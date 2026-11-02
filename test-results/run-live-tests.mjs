// Run with Node.js and TEST_TOOLS pointing to a folder containing playwright and lighthouse.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const toolRoot = process.env.TEST_TOOLS;
const { chromium } = await import(pathToFileURL(path.join(toolRoot, 'node_modules/playwright/index.mjs')));
const base = 'https://aec9692.github.io/portfolio/';
const out = path.resolve('test-results');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
const pages = ['index', 'about', 'projects', 'skills', 'contact'];
async function record(id, details, fn) {
  try { const evidence = await fn(); results.push({id, result:'Pass', details, evidence}); }
  catch (error) { results.push({id, result:'Fail', details, error:String(error.message)}); }
  await fs.writeFile(path.join(out, 'live-results.json'), JSON.stringify({base, testedAt:new Date().toISOString(), browser:browser.version(), results}, null, 2));
}
function check(value, message) { if (!value) throw new Error(message); }
for (const [device, viewport] of Object.entries({phone:{width:390,height:844},laptop:{width:1366,height:768}})) {
  const context = await browser.newContext({viewport, deviceScaleFactor:1});
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  for (let i=0;i<pages.length;i++) {
    const name = pages[i];
    const errors = [];
    const listener = e => errors.push(e.message);
    page.on('pageerror',listener);
    await record(`T${(device==='phone'?10:15)+i}`, `${name}: ${device} layout`, async()=>{
      const response = await page.goto(base+name+'.html');
      await page.locator('h1').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:path.join(out,`${name}-${device}.png`),fullPage:true});
      const layout = await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,h1:document.querySelector('h1').innerText,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),overflow:[...document.querySelectorAll('header a,main a,button,input,textarea,h1,h2,h3')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1)}).map(e=>e.textContent.trim().slice(0,60))}));
      check(response.status()===200,'Page did not return HTTP 200');
      check(layout.scrollWidth<=layout.width+1,'Horizontal overflow: '+JSON.stringify(layout));
      check(!layout.overflow.length,'Offscreen controls/text: '+JSON.stringify(layout.overflow));
      check(!layout.brokenImages.length,'Broken images: '+JSON.stringify(layout.brokenImages));
      check(!errors.length,'JavaScript errors: '+errors.join('; '));
      return {...layout, screenshot:`${name}-${device}.png`,note:'Automated geometry/image checks; screenshot retained for visual review.'};
    });
    page.off('pageerror',listener);
    await record(`T${i+1}`,`${name}: all navigation links on ${device}`,async()=>{
      const links = await page.locator('header a').evaluateAll(as=>as.map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()})));
      check(links.length>=5,'Fewer than five navigation links');
      const visited = [];
      for (let j=0;j<links.length;j++) {
        await page.goto(base+name+'.html');
        await page.locator('h1').waitFor();
        await Promise.all([page.waitForNavigation({waitUntil:'load'}), page.locator('header a').nth(j).click()]);
        await page.waitForURL(base+links[j].href);
        await page.locator('h1').waitFor();
        visited.push({link:links[j].text,url:page.url()});
      }
      await page.goto(base+name+'.html');
      await page.locator('h1').waitFor();
      check(await page.locator('header a[aria-current="page"]').getAttribute('href')===name+'.html','Current-page marker incorrect');
      return visited;
    });
    await record(`T${20+i}`,`${name}: Tab and Enter on ${device}`,async()=>{
      await page.goto(base+name+'.html');
      await page.locator('h1').waitFor();
      const count = await page.locator('a[href],button,input,textarea,select').count();
      const focus = [];
      for (let j=0;j<count;j++) {
        await page.keyboard.press('Tab');
        focus.push(await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {tag:e.tagName,text:(e.textContent||e.getAttribute('name')||'').trim().slice(0,60),href:e.getAttribute('href'),outline:s.outlineStyle,outlineWidth:s.outlineWidth,shadow:s.boxShadow}}));
      }
      check(focus.every(f=>f.tag!=='BODY'),'Tab did not reach all controls');
      check(focus.every(f=>(f.outline!=='none'&&f.outlineWidth!=='0px')||f.shadow!=='none'),'Some focused controls lack an outline or shadow');
      // Exercise every non-mail link with Enter from keyboard focus.
      const hrefs = await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(h=>!h.startsWith('mailto:')));
      for (const href of hrefs) {
        await page.goto(base+name+'.html');
        await page.locator('h1').waitFor();
        for(let j=0;j<count+1;j++) {
          await page.keyboard.press('Tab');
          if(await page.evaluate(h=>document.activeElement.getAttribute('href')===h,href)) break;
        }
        check(await page.evaluate(h=>document.activeElement.getAttribute('href')===h,href),'Could not focus '+href);
        if(href.startsWith('#')) await page.keyboard.press('Enter');
        else await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.keyboard.press('Enter')]);
        await page.waitForURL(new URL(href,base+name+'.html').href);
      }
      return {focus,activated:hrefs,note:name==='contact'?'Email-app integration is tested separately; field validation is tested separately.':''};
    });
  }
  await context.close();
}
const context = await browser.newContext({viewport:{width:1366,height:768}});
const page = await context.newPage();
page.setDefaultTimeout(10000);
await record('T6','Home action links',async()=>{
  const seen=[];
  for (const [label,file] of [['Explore my projects','projects.html'],['Get to know me','about.html']]) {
    await page.goto(base); await page.getByRole('link',{name:new RegExp(label)}).click();
    await page.waitForURL(base+file); seen.push(page.url());
  } return seen;
});
await record('T7','Skills anchors',async()=>{
  await page.goto(base+'skills.html');
  const positions=[];
  for (const [name,id] of [['Technical skills','technical'],['Professional skills','professional']]) {
    await page.getByRole('link',{name:new RegExp(name,'i')}).click();
    await page.waitForURL(base+'skills.html#'+id);
    await page.waitForTimeout(600);
    positions.push(await page.locator('#'+id).evaluate(e=>({id:e.id,top:e.getBoundingClientRect().top})));
  } return positions;
});
await record('T25','Scenery choices',async()=>{
  await page.goto(base);
  const evidence=[];
  for(const scene of ['forest','mountains','lake']) {
    await page.locator(`button[data-scene="${scene}"]`).click();
    check(await page.locator('.scene-choice[aria-pressed="true"]').count()===1,'Multiple active choices');
    check(await page.locator('.scene-layer.is-active').getAttribute('data-scene')===scene,'Incorrect active scene');
    const image=await page.locator(`.scene-layer[data-scene="${scene}"]`).evaluate(e=>getComputedStyle(e).backgroundImage);
    const url=image.match(/url\(["']?(.*?)["']?\)/)?.[1];
    check(url,'Background missing'); const r=await context.request.get(url); check(r.ok(),'Background not available');
    evidence.push({scene,url,status:r.status()});
  } return evidence;
});
await record('T26','Scenery pause, play and pointer exit',async()=>{
  await page.goto(base); await page.locator('#scenery-toggle').waitFor();
  const scene=page.locator('.scenic-home');
  const box=await scene.boundingBox();
  await page.mouse.move(box.x+20,box.y+20);
  const moving=await scene.evaluate(e=>e.style.getPropertyValue('--pointer-x'));
  await page.locator('#scenery-toggle').click();
  await page.mouse.move(box.x+100,box.y+100);
  const paused=await scene.evaluate(e=>({x:e.style.getPropertyValue('--pointer-x'),paused:e.classList.contains('scenery-paused')}));
  check(paused.paused&&paused.x==='0px','Motion not paused');
  await page.locator('#scenery-toggle').click();
  await page.mouse.move(box.x+50,box.y+50);
  check(await page.locator('#scenery-toggle').getAttribute('aria-pressed')==='false','Play state incorrect');
  await page.mouse.move(0,0);
  check(await scene.evaluate(e=>e.style.getPropertyValue('--pointer-x'))==='0px','Pointer exit did not reset');
  return {moving,paused};
});
await record('T27','Reduced motion on live Home',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(base);
  check(await page.locator('#scenery-toggle').getAttribute('aria-pressed')==='true','Not paused initially');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('#scenery-toggle').getAttribute('aria-pressed')==='false');
  return 'Starts paused with reduced motion; preference change resumes scenery. Live Projects has no animations/viewer.';
});
await record('T28','Live page content and titles',async()=>{
  const data=[];
  for(const name of pages){await page.goto(base+name+'.html');await page.locator('h1').waitFor();data.push({name,title:await page.title(),heading:await page.locator('h1').innerText()});}
  check(new Set(data.map(p=>p.title)).size===5,'Titles are not unique'); return data;
});
async function fill(data={}) {
  await page.goto(base+'contact.html');
  for(const [name,value] of Object.entries({name:'Test Visitor',email:'visitor@example.com',phone:'',message:'Hello, I have a project question.',...data})) await page.locator(`[name="${name}"]`).fill(value);
}
async function submitInvalid(data,field) {
  await fill(data); await page.getByRole('button',{name:/Continue to email/}).click();
  const evidence=await page.locator(`[name="${field}"]`).evaluate(e=>({valid:e.validity.valid,message:e.validationMessage}));
  check(!evidence.valid,'Invalid input accepted');
  check(await page.locator('#form-status').innerText()==='','Success message shown for invalid input'); return evidence;
}
await record('T29','Empty form',()=>submitInvalid({name:'',email:'',message:''},'name'));
await record('T30','Invalid email',()=>submitInvalid({email:'not-an-email'},'email'));
await record('T31','Short/whitespace message and whitespace name',async()=>{
  const a=await submitInvalid({message:'Hi'},'message');
  const b=await submitInvalid({message:'          '},'message');
  const c=await submitInvalid({name:'   '},'name'); return [a,b,c];
});
await record('T32','Invalid optional phone',async()=>[await submitInvalid({phone:'abc123'},'phone'),await submitInvalid({phone:'123'},'phone')]);
await record('T33','Valid form; browser-side draft status',async()=>{
  await fill(); await page.getByRole('button',{name:/Continue to email/}).click();
  check(await page.locator('form').evaluate(e=>e.checkValidity()),'Valid form rejected');
  const status=await page.locator('#form-status').innerText(); check(status.includes('Opening your email app'),'Draft status absent');
  return {status,note:'External mail application and draft contents were not verified.'};
});
await record('T34','Correct invalid phone and resubmit',async()=>{
  await submitInvalid({phone:'abc123'},'phone'); await page.locator('[name="phone"]').fill('+1 (201) 555-0123');
  await page.getByRole('button',{name:/Continue to email/}).click();
  check(await page.locator('form').evaluate(e=>e.checkValidity()),'Corrected phone rejected');
  check((await page.locator('#form-status').innerText()).includes('Opening'),'No draft status'); return 'Custom validity clears after editing; valid phone accepted.';
});
await record('T35','Ten-character message and special characters',async()=>{
  for(const data of [{message:'1234567890'},{name:'Alex & Sam',message:'Question about A&B? Please reply.'}]) {
    await fill(data); await page.getByRole('button',{name:/Continue to email/}).click();
    check((await page.locator('#form-status').innerText()).includes('Opening'),'Valid input rejected');
  } return 'Both inputs accepted; external email draft encoding remains unverified.';
});
await page.goto(base+'projects.html');
const deployedProjects = await page.locator('main').innerText();
await fs.writeFile(path.join(out,'deployment-notes.txt'), 'Live Projects content:\n'+deployedProjects+'\n\n3D previews: '+await page.locator('.model-preview').count());
await context.close();
await browser.close();
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.result==='Pass').length,failed:results.filter(r=>r.result==='Fail')},null,2));
