import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.TEST_TOOLS;
const {default:lighthouse}=await import(pathToFileURL(path.join(root,'node_modules/lighthouse/core/index.js')));
const {launch}=await import(pathToFileURL(path.join(root,'node_modules/chrome-launcher/dist/index.js')));
const results=[];
for(const mode of ['mobile','desktop']) {
  for(const page of ['index','about','projects','skills','contact']) {
    let chrome;
    try {
      chrome=await launch({chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--no-first-run','--no-default-browser-check']});
      const flags={port:chrome.port,onlyCategories:['accessibility'],output:'json',logLevel:'error'};
      if(mode==='desktop') Object.assign(flags,{formFactor:'desktop',screenEmulation:{mobile:false,width:1366,height:768,deviceScaleFactor:1,disabled:false}});
      else flags.screenEmulation={mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false};
      const r=await lighthouse(`https://aec9692.github.io/portfolio/${page}.html`,flags);
      await fs.writeFile(`test-results/lighthouse-${page}-${mode}.json`,r.report);
      const findings=r.lhr.categories.accessibility.auditRefs.filter(a=>a.weight>0).map(a=>r.lhr.audits[a.id]).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,details:a.details}));
      results.push({page,mode,score:Math.round(r.lhr.categories.accessibility.score*100),version:r.lhr.lighthouseVersion,fetchTime:r.lhr.fetchTime,findings});
    }catch(e){results.push({page,mode,error:e.message});}
    finally {if(chrome) await chrome.kill();}
    await fs.writeFile('test-results/lighthouse-summary.json',JSON.stringify(results,null,2));
    console.log(JSON.stringify(results.at(-1), (key,value)=>key==='details'?undefined:value));
  }
}
