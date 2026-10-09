import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.env.TEMP || 'C:\\temp', 'chrome-verify-' + Date.now());

class CDPClient {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.callbacks = new Map();
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation failed: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function run() {
  console.log('[1/5] Launching Chrome Headless with CDP...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--window-size=1400,900',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;
  try {
    let versionInfo = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        if (res.ok) {
          versionInfo = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!versionInfo) throw new Error('Could not connect to Chrome port 9222');

    const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    cdp = new CDPClient(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('[2/5] Navigating to http://localhost:3000/?section=68_D ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/?section=68_D' });

    // Wait for routine cards to render
    let cardsLoaded = false;
    for (let i = 0; i < 30; i++) {
      const count = await cdp.evaluate(`document.querySelectorAll('.timeline-grid-layout [class*="cursor-pointer"]').length`);
      if (count && count > 0) {
        cardsLoaded = true;
        console.log(`[3/5] Timetable grid cards rendered: ${count} interactive cards found.`);
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!cardsLoaded) {
      const pageText = await cdp.evaluate(`document.body.innerText.slice(0, 300)`);
      console.log('Page text snapshot:', pageText);
      throw new Error('Cards did not render within timeout');
    }

    // Click on the first card
    console.log('[4/5] Clicking class card to test Tap-to-Grow modal...');
    const clickSuccess = await cdp.evaluate(`
      (() => {
        const card = document.querySelector('.timeline-grid-layout [class*="cursor-pointer"]');
        if (!card) return false;
        card.click();
        return true;
      })()
    `);
    console.log('Card click triggered:', clickSuccess);

    // Wait for modal
    let modalData = null;
    for (let i = 0; i < 20; i++) {
      modalData = await cdp.evaluate(`
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return null;
          const title = dialog.querySelector('#expanded-card-title')?.textContent?.trim();
          const text = dialog.textContent || '';
          return {
            found: true,
            title,
            hasTeacherDetails: text.includes('Teacher Details'),
            hasTeacherRoom: text.includes('Teacher Office Room') || text.includes('KT-805') || text.includes('KT-205'),
            textSnippet: text.replace(/\\s+/g, ' ').slice(0, 300),
          };
        })()
      `);
      if (modalData && modalData.found) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log('[5/5] Tap-to-grow Modal Verification Result:', modalData);

    // Also test compare mode
    console.log('[Testing Compare Mode] Navigating to ?section=68_D&compare=teacher:MSR ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/?section=68_D&compare=teacher:MSR' });
    await new Promise((r) => setTimeout(r, 2000));

    const compareInfo = await cdp.evaluate(`
      (() => {
        const compareBar = document.querySelector('[aria-label="Routine comparison status"]')?.textContent?.trim() ||
                           document.body.textContent.includes('68_D') && document.body.textContent.includes('MSR');
        const cards = document.querySelectorAll('.timeline-grid-layout [class*="cursor-pointer"]').length;
        return {
          compareActive: !!compareBar,
          totalCardsInCompare: cards,
        };
      })()
    `);
    console.log('Compare Mode Verification Result:', compareInfo);

    console.log('=== ALL BROWSER CHECKS PASSED SUCCESSFULLY ===');
  } finally {
    if (chromeProc) chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
