import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.env.TEMP || 'C:\\temp', 'chrome-grid-verify-' + Date.now());

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
  console.log('[1/4] Launching Headless Chrome...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9223',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--window-size=1400,900',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  const cleanup = () => {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  };

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9223/json/version');
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!versionData) throw new Error('Failed to connect to Chrome CDP endpoint');

    const targetsRes = await fetch('http://127.0.0.1:9223/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const client = new CDPClient(ws);
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('[2/4] Navigating to http://localhost:3000/?section=66_O&view=matrix ...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/?section=66_O&view=matrix' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('[3/4] Inspecting Saturday Oct 10 cards and layout...');
    const result = await client.evaluate(`(() => {
      // Find all elements containing Quiz 1 or CSE328
      const allDivs = Array.from(document.querySelectorAll('div'));
      const quiz1Card = allDivs.find(d => d.textContent?.includes('Quiz 1') && d.textContent?.includes('CSE328') && d.style?.top);
      
      // Check if any "Evening / Online" badge is present
      const eveningBadges = allDivs.filter(d => d.textContent?.includes('Evening / Online') && d.children.length > 0);
      
      return {
        hasQuiz1Card: !!quiz1Card,
        quiz1StyleTop: quiz1Card?.style?.top || null,
        quiz1StyleHeight: quiz1Card?.style?.height || null,
        quiz1Text: quiz1Card?.innerText || null,
        eveningBadgesCount: eveningBadges.length,
      };
    })()`);

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.hasQuiz1Card) {
      console.log('SUCCESS: Quiz 1 card is positioned on the grid! Top style:', result.quiz1StyleTop);
      if (result.quiz1StyleTop?.includes('50%')) {
        console.log('CONFIRMED: Quiz 1 card is placed at 50% (exactly 1:00 PM on 8am-6pm grid)!');
      }
    } else {
      console.error('ERROR: Quiz 1 card not found on grid!');
    }

    const fs = await import('fs');
    const shotBefore = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.default.writeFileSync(
      'C:\\Users\\bayzid\\.gemini\\antigravity\\brain\\d04022e3-054f-4bd8-a821-cdb2ea04b266\\grid_1pm_verified.png',
      Buffer.from(shotBefore.data, 'base64')
    );
    console.log('Saved grid screenshot to grid_1pm_verified.png');

    console.log('[4/4] Testing tap-to-grow modal click on Quiz 1 card...');
    const modalResult = await client.evaluate(`(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const quiz1Card = allDivs.find(d => d.textContent?.includes('Quiz 1') && d.textContent?.includes('CSE328') && d.style?.top);
      if (quiz1Card) {
        quiz1Card.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`);

    await new Promise((r) => setTimeout(r, 600));

    const shotModal = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.default.writeFileSync(
      'C:\\Users\\bayzid\\.gemini\\antigravity\\brain\\d04022e3-054f-4bd8-a821-cdb2ea04b266\\modal_quiz1_verified.png',
      Buffer.from(shotModal.data, 'base64')
    );
    console.log('Saved modal screenshot to modal_quiz1_verified.png');

    const modalDetails = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return null;
      return {
        title: modal.querySelector('#expanded-card-title')?.textContent,
        text: modal.innerText
      };
    })()`);

    console.log('Modal details:', JSON.stringify(modalDetails, null, 2));

    cleanup();
    console.log('Verification finished successfully!');
  } catch (err) {
    console.error('Test run failed:', err);
    cleanup();
  }
}

run();
