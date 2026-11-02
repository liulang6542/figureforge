// Verifies serialized browser requests, without spending API credits.
// Providers are seeded straight through the settings store: the UI no longer
// exposes base/key/model inputs, so driving the DOM would test nothing real.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname.endsWith('/')) pathname+='index.html';
  const filename=path.resolve(root,'.'+decodeURIComponent(pathname));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(filename,(err,data)=>{
    if(err){res.writeHead(404);return res.end();}
    if(pathname==='/forge/index.html') data=Buffer.from(data.toString().replace(/\r\n/g,'\n')
      .replace('window.__ffReconstruct = () => runReconstruction();',`window.__ffReconstruct = () => runReconstruction();
window.__test={parse:callPdfParser,refs:analyzeReferences,scene:requestEditableScene,labels:requestRegionLabels,seed(){pdfContext={fileName:'test.pdf',dataUri:'data:application/pdf;base64,dGVzdA=='};}};`));
    res.writeHead(200,{'Content-Type':/\.m?js$/.test(filename)?'text/javascript':filename.endsWith('.html')?'text/html':'application/octet-stream'});res.end(data);
  });
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({serviceWorkers:'block'}),requests=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    let reject=false,truncateOnce=false;
    await page.route(/\/(chat\/completions|responses)$/,async route=>{
      requests.push(route.request().postDataJSON());
      if(truncateOnce){
        truncateOnce=false;
        return route.fulfill({json:{choices:[{finish_reason:'length',message:{content:'',reasoning_content:'unfinished analysis'}}]}});
      }
      const content=JSON.stringify({selectedSections:[{section:'Method',summary:'Test paper method.'}],nodes:[{id:'box',type:'rect',x:10,y:10,w:40,h:40,fill:'#ffffff'}],labels:['test']});
      await route.fulfill({status:reject?400:200,contentType:'application/json',body:JSON.stringify(reject?{error:{message:'Unsupported reasoning_effort max'}}:{choices:[{message:{content}}],output:[{type:'message',content:[{type:'output_text',text:content}]}]})});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/forge/`);
    assert.equal(await page.evaluate(()=>typeof window.__test),'object',JSON.stringify(errors));

    /* Two profiles stand in for a relay and for the official endpoint; every role
       points at the relay first so no role inherits an empty provider. */
    const ids=await page.evaluate(async()=>{
      const S=await import('./settings-store.mjs');
      window.__S=S;
      S.clearAll();
      const models={chat:['gpt-6.1-sol'],vision:['gpt-6.1-sol'],image:['gpt-6.1-sol']};
      const relay=S.addProfile({label:'Relay',base:'https://test.invalid/v1',proto:'oai',models});
      const official=S.addProfile({label:'Official',base:'https://api.openai.com/v1',proto:'oai',models});
      for(const pid of [relay,official]) S.setApiKey('test-key',pid);
      S.setProvider(relay);
      for(const role of S.ROLES){S.setRoleProvider(role,relay);S.setRoleModel(role,'gpt-6.1-sol');}
      window.__IDS={relay,official};
      window.__test.seed();
      return {relay,official};
    });

    /* Every tier the picker offers must reach the wire, and must drop the fields
       reasoning models reject. */
    for(const which of ['relay','official']){
      await page.evaluate(pid=>{
        for(const role of window.__S.ROLES) window.__S.setRoleProvider(role,pid);
      },ids[which]);
      const responses=which==='official';
      for(const effort of ['','low','max']){
        await page.evaluate(v=>window.__S.setParseEffort(v),effort);
        for(const mode of ['text','img','doc']){
          const parseErr=await page.evaluate(async mode=>{
            try{await window.__test.parse(mode,{text:'test paper',pages:1,total:1,imgs:['data:image/png;base64,dGVzdA==']});return '';}
            catch(e){return e.message;}
          },mode);
          assert.equal(parseErr,'',`${which}/${effort||'default'}/${mode} threw: ${parseErr}`);
          const body=requests.at(-1);
          assert.equal(responses?body.reasoning?.effort:body.reasoning_effort,effort||undefined,`${which}/${mode}/${effort||'default'}`);
          if(effort){
            assert.equal(body.temperature,undefined);
            if(!responses){assert.equal(body.max_tokens,undefined);assert.equal(body.max_completion_tokens,5000);}
          }
        }
      }
    }

    /* Visual analysis and reconstruction carry independent tiers. */
    await page.evaluate(pid=>{for(const role of window.__S.ROLES) window.__S.setRoleProvider(role,pid);},ids.relay);
    await page.evaluate(()=>window.__S.setParseEffort('medium'));
    for(const effort of ['','low','max']){
      await page.evaluate(v=>window.__S.setVisualEffort(v),effort);
      const reconTier=effort==='max'?'low':'max';
      await page.evaluate(v=>window.__S.setReconEffort(v),reconTier);
      for(const stage of ['refs','scene','labels']){
        await page.evaluate(async stage=>{
          if(stage==='refs') return window.__test.refs();
          if(stage==='labels') return window.__test.labels([{x:10,y:10,w:40,h:20}],null);
          const c=document.createElement('canvas');c.width=100;c.height=100;
          return window.__test.scene(c.toDataURL(),100,100,{objectRepair:true,catalog:{canvas:{width:100,height:100},nodes:[{id:'box',type:'rect',x:10,y:10,w:40,h:40}]}});
        },stage);
        assert.equal(requests.at(-1).reasoning_effort,stage==='refs'?(effort||undefined):reconTier,stage);
      }
    }

    /* A truncated answer is retried once with a larger budget, keeping model,
       paper text and the chosen tier intact. */
    truncateOnce=true;
    const beforeRepair=requests.length;
    const repaired=await page.evaluate(()=>window.__test.parse('text',{text:'PAPER_FIXTURE_MUST_SURVIVE',pages:1,total:1}));
    assert.ok(repaired.selectedSections[0].summary);
    assert.equal(requests.length,beforeRepair+2);
    const first=requests[beforeRepair],second=requests[beforeRepair+1];
    assert.equal(second.max_completion_tokens,12000);
    assert.equal(second.reasoning_effort,first.reasoning_effort);
    assert.equal(second.model,first.model);
    assert.deepEqual(second.messages.slice(0,-1),first.messages);
    assert.match(JSON.stringify(second.messages),/PAPER_FIXTURE_MUST_SURVIVE/);

    /* A rejected tier surfaces as an error: no silent downgrade, no retry. */
    reject=true;
    const before=requests.length;
    const failure=await page.evaluate(async()=>{try{await window.__test.labels([],null);return '';}catch(e){return e.message;}});
    assert.match(failure,/Unsupported reasoning_effort/);
    assert.equal(requests.length,before+1,'no downgrade request after rejection');
    assert.equal(requests.at(-1).reasoning_effort,'low');

    /* Tiers survive a reload; step four's in-page picker reflects the stored one. */
    await page.reload();
    await page.waitForTimeout(500);
    const persisted=await page.evaluate(async()=>{
      const S=await import('./settings-store.mjs');
      return {parse:S.parseEffort(),visual:S.visualEffort(),recon:S.reconEffort(),
              reconDom:document.getElementById('reconReasoningEffort').value};
    });
    assert.equal(persisted.parse,'medium');
    assert.equal(persisted.visual,'max');
    assert.equal(persisted.recon,'low');
    assert.equal(persisted.reconDom,'low');
    assert.deepEqual(errors,[]);
    console.log(`PASS: ${requests.length} actual browser API requests; parsing text/image/PDF over relay and official Responses, visual analysis/reconstruction/labels, independent persisted tiers and explicit rejection.`);
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
