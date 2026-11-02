import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile('test-results/live-results.json','utf8'));
const audits=JSON.parse(await fs.readFile('test-results/lighthouse-summary.json','utf8'));
let doc=await fs.readFile('TESTING.md','utf8');
const table=doc.slice(doc.indexOf('| ID |'),doc.indexOf('\nThe Lighthouse target'));
const rows=table.trim().split('\n');
const passed=new Set(data.results.filter(r=>r.result==='Pass').map(r=>r.id));
const descriptions={
 T8:'Not run — Mastercam screenshot links are not deployed; live Projects has placeholder cards.',
 T9:'Pass — correct mailto navigation request observed; external email app not tested.',
 T12:'Pass — deployed placeholder cards fit; 3D dialog is not deployed.',
 T17:'Pass — deployed placeholder cards fit; 3D dialog is not deployed.',
 T22:'Pass — all deployed links work with Tab/Enter at both sizes; dialog checks await deployment.',
 T27:'Pass — Home starts paused and responds to preference changes; no live project animation exists.',
 T33:'Pass — valid input accepted and recipient, subject, and decoded body verified in browser mailto request.',
 T34:'Pass — editing clears the custom error and a valid phone is accepted.',
 T35:'Pass — 10-character message accepted; special characters preserved in mailto subject/body.',
};
for(let id=36;id<=41;id++)descriptions['T'+id]='Not run — 3D viewer is not present on the live site.';
for(let id=42;id<=46;id++) {
 const name=['index','about','projects','skills','contact'][id-42];
 const mobile=audits.find(r=>r.page===name&&r.mode==='mobile');
 const desktop=audits.find(r=>r.page===name&&r.mode==='desktop');
 descriptions['T'+id]=`Pass — Mobile ${mobile.score}/100; desktop ${desktop.score}/100. Both meet the 90 target.`;
}
const updated=rows.map(line=>{
 if(!/^\| T\d+ /.test(line))return line;
 const cells=line.split('|'); const id=cells[1].trim();
 cells[cells.length-2]=' '+(descriptions[id]||(passed.has(id)?'Pass — observed on the live site; evidence in test-results/live-results.json.':'Not run'))+' ';
 // Keep browser-only assertions separate from external application integration and undeployed controls.
 if(id==='T9') {cells[3]=' On live Contact, activate the direct email link and inspect the browser navigation request. ';cells[4]=' Browser requests mailto:aec9692@njit.edu. External mail app integration is a separate manual check. ';}
 if(id==='T12') {cells[3]=' At 390 × 844, reload live Projects and inspect all deployed cards. ';cells[4]=' Cards fit, images load, and content remains readable without horizontal page scrolling. ';}
 if(id==='T17') {cells[3]=' At 1366 × 768, reload live Projects and inspect all deployed cards. ';cells[4]=' Cards and headings fit and remain readable without horizontal page scrolling. ';}
 if(id==='T22') {cells[3]=' On live Projects, use Tab and Enter on every deployed link at both sizes. After viewer deployment, also test selector, controls, Escape, and focus restoration. ';cells[4]=' Deployed links have visible focus and work without a trap. Dialog behavior remains pending until deployment. ';}
 if(id==='T33') {cells[3]=' Enter Test Visitor, visitor@example.com, message Hello, I have a project question., and no phone; submit and capture the browser mailto navigation intent. ';cells[4]=' Browser requests the correct recipient, name-based subject, message, reply address, and Not provided phone, and shows draft status. ';}
 if(id==='T34') {cells[4]=' The earlier custom error clears; the valid phone is accepted and draft status appears. ';}
 if(id==='T35') {cells[4]=' Ten-character message is accepted; special characters are preserved in the browser mailto request. ';}
 return cells.join('|');
});
const intro=`# Website Test Plan and Results

Live site: https://aec9692.github.io/portfolio/  
Test date: November 2, 2026 (America/New_York)  
Browser: headless Chrome ${data.browser}, Playwright automation  
Viewports: phone **390 × 844**, laptop **1366 × 768**, device scale factor 1  
Accessibility tool: Lighthouse ${audits[0].version}, mobile and desktop Accessibility audits

## Scope and evidence

Tests ran against the public GitHub Pages URLs, with live JavaScript and assets. All five HTML pages returned HTTP 200. Navigation was exercised from every page at both viewport sizes, including the home logos actually present on the deployed Projects and Contact pages. Screenshots of all ten page/viewport combinations were captured and visually reviewed. Form tests used synthetic visitor details; no emails were sent.

**The deployed site differs from the local repository.** Live Projects displays three placeholder project concepts. Mastercam screenshot links and the 3D viewer are local features that are not deployed, so their tests remain Not run. Physical phone testing and opening a draft in an external email app remain manual checks. Browser mailto requests, including decoded subject/body, were verified.

The remote main branch was observed at cc581076d1da74be451bf14750a3dd18d38e5b68. GitHub Pages did not expose a deployment SHA in these checks, so this is a reference branch commit rather than a verified deployment ID. Initial sandbox requests failed; live testing succeeded after network access was approved.

Evidence: [browser results](test-results/live-results.json), [keyboard and mailto checks](test-results/additional-results.json), [Lighthouse summary](test-results/lighthouse-summary.json), and [deployment notes](test-results/deployment-notes.txt). Individual Lighthouse JSON reports and full-page screenshots are saved in test-results/. The reusable test scripts are saved alongside them.

A first automation attempt had same-URL navigation timing errors. These were test-runner errors, not website failures. Its output is retained in [harness-first-attempt.json](test-results/harness-first-attempt.json); after the runner was corrected, all **43 browser checks** and **5 supplementary checks** passed. Tests with multiple viewport runs share a test ID below. The two accessibility defects are recorded separately as T47 and T48.

## Test cases

Main navigation means Home, About, Projects, Skills, and Contact. For each navigation test, return to the source page before activating the next link, include the current-page link, and repeat at both viewport sizes. Pass describes the stated live observation; it does not imply an undeployed feature was tested.

`;
const extra=`| T47 | Projects heading hierarchy | Run live Projects Lighthouse Accessibility in mobile and desktop modes; inspect heading-order findings. | Heading levels follow a logical sequence without skipping h2. | Fail — live cards jump from h1 to h3; flagged in both reports. |
| T48 | Contact optional-label contrast | Run live Contact Lighthouse Accessibility in mobile and desktop modes; inspect color-contrast findings. | Small text contrast is at least 4.5:1. | Fail — optional label is 4.39:1; flagged in both reports. |
`;
const footer=`
## Lighthouse Accessibility scores

The acceptance target is at least 90/100. Meeting this score does not mean that every accessibility audit passes. Projects and Contact meet the target but have the defects recorded above.

| Page | Mobile | Desktop | Findings |
| :-- | --: | --: | :-- |
${['index','about','projects','skills','contact'].map(name=>`| ${name}.html | ${audits.find(a=>a.page===name&&a.mode==='mobile').score} | ${audits.find(a=>a.page===name&&a.mode==='desktop').score} | ${name==='projects'?'Skipped heading level (T47)':name==='contact'?'Optional-label contrast (T48)':'No failed weighted Accessibility audits'} |`).join('\n')}

## Failures, fixes, and live retests

Initial failures are retained. The following fixes are made in local source, **have not been published**, and therefore have no passing live retest yet. No new Lighthouse score is claimed for the fixes.

| Test ID | Initial live result | Local fix | Verification | Live retest |
| :-- | :-- | :-- | :-- | :-- |
| T47 | Fail — h1 followed by h3 in placeholder project cards; mobile/desktop score 98. | Changed shared placeholder card headings to h2 in script.js and retained their font size using .project h2 in styles.css. The newer local Mastercam cards already use h2. | Node syntax check passed. | Not run — fix awaits deployment. |
| T48 | Fail — optional label contrast 4.39:1; mobile/desktop score 95. | Darkened .contact-card .optional from #6d7965 to #596550 in styles.css. | Source change inspected; live audit remains unchanged until publication. | Not run — fix awaits deployment. |

## Remaining checks

- Publish the intended local version, then rerun the live suite and Lighthouse; keep the original failures and add dated retest results.
- Execute T8 and T36–T41 after the Mastercam content and viewer are deployed; repeat Projects layout and keyboard dialog checks.
- Verify the external email app opens the draft correctly on a configured device. The browser's mailto request has passed.
- Check actual touch gestures on a physical phone when the viewer is deployed.

The assignment's complete failure-fix-live-retest cycle remains pending publication. Current results describe the live version tested on November 2, 2026.
`;
await fs.writeFile('TESTING.md',intro+updated.join('\n')+'\n'+extra+footer);
console.log('Updated TESTING.md with live observations, Lighthouse scores, and retained failures.');
