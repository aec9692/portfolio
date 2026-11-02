import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.join(process.env.TEST_TOOLS,'node_modules/playwright/index.mjs')));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
const base='https://aec9692.github.io/portfolio/';
const cdp=await page.context().newCDPSession(page); await cdp.send('Page.enable');
const intents=[]; cdp.on('Page.frameRequestedNavigation',e=>{if(e.url.startsWith('mailto:')) intents.push(e.url)});
const results=[];
const check=(v,m)=>{if(!v)throw Error(m)};
async function record(id,fn){try{results.push({id,result:'Pass',evidence:await fn()})}catch(e){results.push({id,result:'Fail',error:e.message})}}
await record('T9-browser',async()=>{
  await page.goto(base+'contact.html');
  await page.getByRole('link',{name:/aec9692@njit.edu/}).click();
  await page.waitForTimeout(300);
  check(intents.at(-1)==='mailto:aec9692@njit.edu','Incorrect/missing email navigation intent');
  return {intent:intents.at(-1),note:'External mail app not launched/verified in headless Chrome.'};
});
await record('T20-buttons',async()=>{
  await page.goto(base);
  for(const name of ['Forest','Peaks','Lakeside']) {
    await page.getByRole('button',{name,exact:true}).focus(); await page.keyboard.press('Enter');
    check(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed')==='true','Enter did not select '+name);
  }
  await page.locator('#scenery-toggle').focus(); await page.keyboard.press('Enter');
  check(await page.locator('#scenery-toggle').getAttribute('aria-pressed')==='true','Enter did not pause');
  await page.keyboard.press('Enter');check(await page.locator('#scenery-toggle').getAttribute('aria-pressed')==='false','Enter did not play');
  return 'All four scenery buttons activated with Enter; Tab reachability recorded in main results.';
});
await record('T24-submit',async()=>{
  await page.goto(base+'contact.html');await page.getByRole('button',{name:/Continue to email/}).focus();await page.keyboard.press('Enter');
  check(await page.locator(':focus').getAttribute('name')==='name','Invalid submit did not focus name');
  return 'Enter submits form and browser validation focuses required name field.';
});
for(const [id,data] of [['T33-draft',{name:'Test Visitor',message:'Hello, I have a project question.',phone:''}],['T35-draft',{name:'Alex & Sam',message:'Question about A&B? Please reply.',phone:'+1 (201) 555-0123'}]]) {
  await record(id,async()=>{
    await page.goto(base+'contact.html');
    for(const [key,value] of Object.entries({...data,email:'visitor@example.com'}))await page.locator(`[name="${key}"]`).fill(value);
    const before=intents.length;
    await page.getByRole('button',{name:/Continue to email/}).focus();await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    check(intents.length>before,'No mailto intent');
    const url=new URL(intents.at(-1));
    check(url.pathname==='aec9692@njit.edu','Wrong recipient');
    check(url.searchParams.get('subject')===`Portfolio inquiry from ${data.name}`,'Subject changed');
    const body=`${data.message}\n\nFrom: ${data.name}\nReply to: visitor@example.com\nPhone: ${data.phone||'Not provided'}`;
    check(url.searchParams.get('body')===body,'Body changed');
    return {recipient:url.pathname,subject:url.searchParams.get('subject'),body:url.searchParams.get('body'),note:'Browser navigation intent verified; external email application not tested.'};
  });
}
await fs.writeFile('test-results/additional-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await browser.close();
