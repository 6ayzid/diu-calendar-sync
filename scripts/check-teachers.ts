async function run() {
  for (const t of ['FZA', 'AUA', 'MRN', 'ASA']) {
    const res = await fetch(`https://routine.zohirrayhan.me/api/teacher-schedule?teacher=${t}&department=cse`);
    const d = await res.json();
    console.log(`\n=== Teacher ${t} ===`);
    console.log('success:', d.success);
    console.log('teacher:', d.teacher);
    console.log('details:', d.details);
    console.log('classes count:', d.schedule?.length);
  }
}
run();
