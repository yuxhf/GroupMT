/* Run against a local server; PLAYWRIGHT_MODULE can point to an existing install. */
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
async function check(browser,{url,output,baseline}){
  await fs.mkdir(output,{recursive:true});
  const results={desktop:[],sizes:[],players:[],images:[],errors:[]};
  const desktop=await browser.newContext({viewport:{width:1440,height:1000}});
  const current=await desktop.newPage();
  current.on('pageerror',e=>results.errors.push(e.message));
  await current.goto(url);
  if(baseline){
    const before=await desktop.newPage();
    await before.route(url,r=>r.fulfill({contentType:'text/html',path:baseline}));
    await before.goto(url);
    for(const p of [before,current])await p.evaluate(async()=>{
      document.querySelectorAll('img').forEach(i=>i.loading='eager');
      await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))]);
    });
    for(const id of ['agent-intro','memory-palace','hippo-focus','rfmem-focus','memr3-focus','memory-r1-focus','rpmem-focus']){
      const shots=[];
      for(const p of [before,current]){
        await p.bringToFront();
        await p.evaluate(id=>{const e=document.getElementById(id);scrollTo({top:e.getBoundingClientRect().top+scrollY,behavior:'instant'});},id);
        shots.push(await p.screenshot());
      }
      const identical=shots[0].equals(shots[1]);
      results.desktop.push({id,identical});assert(identical,`Desktop appearance changed: ${id}`);
    }
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const p=await context.newPage();p.setDefaultTimeout(5000);
  p.on('pageerror',e=>results.errors.push(e.message));
  await p.goto(url);await p.bringToFront();
  for(const [width,height]of [[320,740],[360,800],[390,844],[430,932],[844,390],[932,430]]){
    await p.setViewportSize({width,height});
    // Let ResizeObserver apply the diagram width after the viewport changes.
    await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const layout=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,
      diagramsContained:[...document.querySelectorAll('[data-mobile-diagram]')].every(e=>e.parentElement.clientWidth<=innerWidth&&getComputedStyle(e.parentElement).overflowX==='auto')}));
    results.sizes.push({width,height,...layout});assert(!layout.overflow&&layout.diagramsContained);
  }
  for(const key of ['hippo','rfmem','memr3','memory-r1']){
    await p.setViewportSize({width:390,height:844});
    const rf=key==='rfmem',root=p.locator(rf?'[data-rfmem-reader]':`[data-task-reader="${key}"]`);
    const next=root.locator(rf?'[data-next]':'[data-case-next]');
    const counter=root.locator(rf?'[data-counter]':'[data-case-counter]');
    // Mobile presentation must work even when native modal opening is unavailable.
    await root.locator('.focus-dialog').evaluate(e=>{e.showModal=()=>{throw new Error('native modal intentionally unavailable');};});
    // Mobile presentation must work even when native modal opening is unavailable.
    await root.locator('.focus-dialog').evaluate(e=>{e.showModal=()=>{throw new Error('native modal intentionally unavailable');};});
    await root.locator(rf?'[data-focus-open]':'[data-case-focus]').click();await next.click();
    const state=await counter.innerText();
    await p.setViewportSize({width:844,height:390});assert.equal(await counter.innerText(),state);
    assert(await root.locator('.focus-dialog .transport').evaluate(e=>[...e.querySelectorAll('button')].every(b=>{
      const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;
    })),`${key}: controls outside viewport`);
    const tools=root.locator('.mobile-diagram-tools button'),diagram=root.locator('[data-mobile-diagram]');
    await tools.nth(1).click();const larger=await diagram.evaluate(e=>e.getBoundingClientRect().width);
    await tools.nth(2).click();assert(larger>await diagram.evaluate(e=>e.getBoundingClientRect().width));
    await root.locator('.mobile-copy-toggle').click();assert.equal(await root.locator('.step-copy').getAttribute('data-mobile-copy'),'full');
    await root.locator('.mobile-copy-toggle').click();
    let count=1;while(!await next.isDisabled()){await next.click();count++;assert(count<30);}
    if(key==='hippo'||key==='rfmem'){
      await root.locator('.mobile-scene-transcript summary').click();
      assert((await root.locator('.mobile-scene-transcript p').innerText()).length>30);
      await root.locator('.mobile-scene-transcript summary').click();
      await p.screenshot({path:path.join(output,`${key}-final-landscape.png`)});
    }
    await root.locator(rf?'[data-reset]':'[data-case-reset]').click();await next.click();
    assert.equal(await counter.innerText(),state);
    if(key==='memr3')await p.screenshot({path:path.join(output,'memr3-landscape.png')});
    await root.locator(rf?'[data-focus-close]':'[data-case-exit]').click();assert.equal(await counter.innerText(),state);
    assert.equal(await root.evaluate(e=>e.classList.contains('mobile-focus-active')),false);
    assert.equal(await p.evaluate(()=>document.body.style.position),'');
    assert.equal(await root.evaluate(e=>e.classList.contains('mobile-focus-active')),false);
    assert.equal(await p.evaluate(()=>document.body.style.position),'');
    results.players.push({key,stepsChecked:count+1,rotationPreserved:true,controlsVisible:true,zoom:true,exitPreserved:true});
  }
  await p.setViewportSize({width:390,height:844});
  await p.locator('#rpmem-focus [data-survey-open]').click();
  await p.waitForFunction(()=>document.querySelector('.mobile-image-viewport img').naturalWidth>0);
  const img=p.locator('.mobile-image-viewport img');
  const scale=()=>img.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a);
  await p.locator('.mobile-image-toolbar button').nth(1).click();assert(await scale()>1);
  const rect=await p.locator('.mobile-image-viewport').boundingBox();
  const x=rect.x+rect.width/2,y=rect.y+rect.height/2,beforePinch=await scale();
  if(browser.browserType().name()==='chromium'){
    const cdp=await context.newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:0},{x:x+30,y,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-70,y,id:0},{x:x+70,y,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await scale()>beforePinch);
  }else{
    await p.touchscreen.tap(x,y);await p.touchscreen.tap(x,y);assert.notEqual(await scale(),beforePinch);
  }
  await p.locator('.mobile-image-toolbar button').nth(2).click();
  await p.screenshot({path:path.join(output,'overview-portrait.png')});
  await p.setViewportSize({width:844,height:390});
  await p.screenshot({path:path.join(output,'overview-landscape.png')});
  await p.keyboard.press('Escape');assert.equal(await p.locator('.mobile-image-viewer').evaluate(e=>e.open),false);
  assert(await p.evaluate(()=>document.activeElement.matches('#rpmem-focus [data-survey-open]')));
  results.images.push({entry:'paper figure',gesture:browser.browserType().name()==='chromium'?'pinch':'double tap',fit:true,rotation:true,focusRestored:true});
  for(const key of ['hippo','rfmem']){
    const rf=key==='rfmem',root=p.locator(rf?'[data-rfmem-reader]':`[data-task-reader="${key}"]`);
    await root.locator(rf?'[data-focus-open]':'[data-case-focus]').click();
    await root.locator(rf?'[data-view="overview"]':'[data-case-view="overview"]').click();
    await root.locator(rf?'[data-image-open]':'[data-case-image-open]').click();
    await p.waitForFunction(()=>document.querySelector('.mobile-image-viewport img').naturalWidth>0);
    assert(await p.locator('.mobile-image-viewer').evaluate(e=>e.closest('.focus-dialog')?.open));
    assert.equal(await p.locator('.mobile-image-viewer').evaluate(e=>e.inert),false);
    await p.locator('.mobile-image-toolbar button').nth(1).click();
    await p.locator('.mobile-image-viewer header button').click();assert(await root.locator('.focus-dialog').evaluate(e=>e.open));
    await root.locator(rf?'[data-view="demo"]':'[data-case-view="demo"]').click();
    await root.locator(rf?'[data-focus-close]':'[data-case-exit]').click();
    results.images.push({entry:key,nestedModal:true,exitRestoresPlayer:true});
  }
  // Timer advancement, explicit pause, and background pause use the real player.
  const rf=p.locator('[data-rfmem-reader]');await rf.locator('[data-focus-open]').click();
  const play=rf.locator('[data-play]'),counter=rf.locator('[data-counter]');const prior=await counter.innerText();
  await play.click();await p.waitForFunction(prior=>document.querySelector('[data-rfmem-reader] [data-counter]').textContent!==prior,prior,{timeout:8000});
  await play.click();assert.equal(await play.getAttribute('aria-pressed'),'false');
  await play.click();await p.evaluate(()=>document.dispatchEvent(new Event('memory:mobile-pause')));assert.equal(await play.getAttribute('aria-pressed'),'false');
  await rf.locator('[data-focus-close]').click();
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.waitForFunction(()=>document.querySelector('[data-rfmem-reader] [data-play]').disabled);
  const old=await counter.innerText();await rf.locator('[data-next]').click();assert.notEqual(await counter.innerText(),old);
  results.playback={timerAdvances:true,pause:true,reducedMotionManualNavigation:true};
  assert.equal(results.errors.length,0,results.errors.join('\n'));
  await fs.writeFile(path.join(output,'checks.json'),JSON.stringify(results,null,2));
  await context.close();await desktop.close();return results;
}
module.exports={check};
if(require.main===module)(async()=>{
  const browser=process.env.CHROME_CDP?await chromium.connectOverCDP(process.env.CHROME_CDP):process.env.BROWSER_ENGINE==='webkit'?await webkit.launch({headless:true}):await chromium.launch({channel:'chrome',headless:true});
  try{console.log(JSON.stringify(await check(browser,{
    url:process.env.REPORT_URL||'http://127.0.0.1:8765/meetings/2026-11-08-agent-memory/',
    output:process.env.REVIEW_OUTPUT||'review/mobile-check',baseline:process.env.BASELINE_HTML
  }),null,2));}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
