const phone = matchMedia('(max-width:760px), (max-width:1100px) and (max-height:600px) and (pointer:coarse)');
const pause = () => document.dispatchEvent(new Event('memory:mobile-pause'));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const button = (text, label = text) => {
  const node = document.createElement('button');
  node.type = 'button'; node.textContent = text; node.setAttribute('aria-label', label);
  return node;
};

// One viewer for the report's existing image entry points. Desktop handlers stay intact.
const viewer = document.createElement('dialog');
viewer.className = 'mobile-image-viewer';
viewer.setAttribute('aria-label', '原图查看');
viewer.innerHTML = '<header><strong id="mobile-image-title"></strong></header><div class="mobile-image-viewport"><img alt="" draggable="false"></div><div class="mobile-image-toolbar" role="group" aria-label="图片缩放"></div><p class="mobile-image-hint">双指缩放 · 双击放大 · 放大后拖动；横屏可获得更大视野</p>';
viewer.setAttribute('aria-labelledby', 'mobile-image-title');
document.body.append(viewer);
const viewport = viewer.querySelector('.mobile-image-viewport');
const image = viewport.querySelector('img');
const toolbar = viewer.querySelector('.mobile-image-toolbar');
const close = button('关闭', '关闭原图，返回阅读');
viewer.querySelector('header').append(close);
const minus = button('−', '缩小图片'), plus = button('+', '放大图片'), fit = button('适应屏幕'), original = button('原尺寸');
toolbar.append(minus, plus, fit, original);
let zoom = 1, x = 0, y = 0, width = 0, height = 0, trigger = null, bodyOverflow = '', ready = false;
const pointers = new Map();
let gesture = null, lastTap = 0;
function constrain() {
  const w = width * zoom, h = height * zoom;
  x = w <= viewport.clientWidth ? (viewport.clientWidth - w) / 2 : clamp(x, viewport.clientWidth - w, 0);
  y = h <= viewport.clientHeight ? (viewport.clientHeight - h) / 2 : clamp(y, viewport.clientHeight - h, 0);
}
function paint() {
  constrain();
  image.style.width = `${width}px`; image.style.height = `${height}px`;
  image.style.transform = `translate(${x}px,${y}px) scale(${zoom})`;
  minus.disabled = zoom <= 1; plus.disabled = zoom >= 8;
}
function zoomTo(value, cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2) {
  if (!ready) return;
  const next = clamp(value, 1, 8), ratio = next / zoom;
  x = cx - (cx - x) * ratio; y = cy - (cy - y) * ratio; zoom = next; paint();
}
function measure(reset = false) {
  if (!viewer.open || !image.naturalWidth || !ready) return;
  const scale = Math.min(viewport.clientWidth / image.naturalWidth, viewport.clientHeight / image.naturalHeight, 1);
  width = image.naturalWidth * scale; height = image.naturalHeight * scale;
  if (reset) { zoom = 1; x = 0; y = 0; }
  paint();
}
image.addEventListener('load', () => { ready = true; measure(true); });
image.addEventListener('error', () => { image.alt = '图片暂时无法加载，请关闭后重试。'; });
minus.addEventListener('click', () => zoomTo(zoom / 1.5));
plus.addEventListener('click', () => zoomTo(zoom * 1.5));
fit.addEventListener('click', () => measure(true));
original.addEventListener('click', () => zoomTo(image.naturalWidth / width));
close.addEventListener('click', () => viewer.close());
function local(event) {
  const rect = viewport.getBoundingClientRect();
  return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}
function beginGesture() {
  const points = [...pointers.values()];
  if (!points.length) { gesture = null; return; }
  const a = points[0], b = points[1];
  gesture = {x, y, zoom, start: a, moved: false, pinch: !!b,
    distance: b ? Math.hypot(b.x-a.x,b.y-a.y) : 0,
    center: b ? {x:(a.x+b.x)/2,y:(a.y+b.y)/2} : a};
}
viewport.addEventListener('pointerdown', event => {
  if (!ready || event.button > 0) return;
  viewport.setPointerCapture(event.pointerId); pointers.set(event.pointerId, local(event)); beginGesture();
});
viewport.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId) || !gesture) return;
  pointers.set(event.pointerId, local(event));
  const [a,b] = [...pointers.values()];
  if (b && gesture.distance) {
    const center = {x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    zoom = clamp(gesture.zoom * Math.hypot(b.x-a.x,b.y-a.y) / gesture.distance,1,8);
    const ratio = zoom / gesture.zoom;
    x = center.x - (gesture.center.x - gesture.x) * ratio;
    y = center.y - (gesture.center.y - gesture.y) * ratio;
    gesture.moved = true;
  } else {
    const dx=a.x-gesture.start.x,dy=a.y-gesture.start.y;
    x=gesture.x+dx;y=gesture.y+dy;
    if (Math.hypot(dx,dy)>8) gesture.moved=true;
  }
  paint();
});
function endPointer(event) {
  if (!pointers.has(event.pointerId)) return;
  const tap = event.type === 'pointerup' && !gesture?.moved && !gesture?.pinch && pointers.size===1;
  if (tap) {
    const now=performance.now(),point=local(event);
    if(now-lastTap<300){zoomTo(zoom>1?1:2.5,point.x,point.y);lastTap=0;} else lastTap=now;
  } else lastTap=0;
  pointers.delete(event.pointerId); beginGesture();
}
viewport.addEventListener('pointerup',endPointer);
viewport.addEventListener('pointercancel',endPointer);
viewport.addEventListener('lostpointercapture',endPointer);
viewport.addEventListener('wheel',event=>{event.preventDefault();const p=local(event);zoomTo(zoom*(event.deltaY>0?.9:1.1),p.x,p.y);},{passive:false});
viewer.addEventListener('keydown',event=>{
  if(event.key==='+'||event.key==='='){event.preventDefault();zoomTo(zoom*1.5);}
  if(event.key==='-'){event.preventDefault();zoomTo(zoom/1.5);}
  if(event.key==='0'){event.preventDefault();measure(true);}
});
viewer.addEventListener('close',()=>{
  pointers.clear();gesture=null;ready=false;
  document.body.style.overflow=bodyOverflow;
  trigger?.focus({preventScroll:true});document.body.append(viewer);
});
new ResizeObserver(()=>measure()).observe(viewport);
document.addEventListener('click',event=>{
  if(!phone.matches || !(event.target instanceof Element))return;
  const source=event.target.closest('[data-survey-open],[data-case-image-open],[data-image-open],[data-thumbnail],.survey-paper-figure>a');
  if(!source)return;
  const root=source.closest('.rfmem-reader');
  const img=source.matches('[data-thumbnail]')?source:source.querySelector('img') || root?.querySelector('[data-reference-image],[data-case-image]');
  const src=source.dataset.surveyOpen || img?.getAttribute('src');
  if(!src)return;
  event.preventDefault();event.stopImmediatePropagation();pause();
  trigger=source;bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  ready=false;image.removeAttribute('src');
  image.alt=source.dataset.surveyLabel || img?.alt || '论文原图';
  viewer.querySelector('strong').textContent=image.alt;
  (source.closest('dialog[open]') || document.body).append(viewer);
  viewer.showModal();image.src=src;close.focus({preventScroll:true});
},true);

// Enhance the existing workbench rather than clone it, keeping player state and listeners.
const cleanups=[];
document.querySelectorAll('.rfmem-reader').forEach(root=>{
  const workbench=root.querySelector('.workbench');
  if(!workbench)return;
  const frame=workbench.querySelector('.diagram-frame,.case-stage-scroll');
  const diagram=frame?.querySelector('.diagram');
  const svg=diagram?.querySelector('svg');
  const focusDialog=root.querySelector('.focus-dialog');
  const openButton=root.querySelector('[data-focus-open],[data-case-focus]');
  const copy=workbench.querySelector('.step-copy');
  if(!frame||!diagram||!svg||!focusDialog||!openButton||!copy)return;
  const originalLabel=openButton.textContent;
  const controls=document.createElement('div');controls.className='mobile-only mobile-diagram-tools';
  const hint=document.createElement('span');hint.textContent='清晰视图 · 左右滑动查看';
  const out=button('−','缩小机制图'),into=button('+','放大机制图'),reset=button('全图','显示完整机制图');
  controls.append(hint,out,into,reset);frame.before(controls);
  const orientation=document.createElement('p');orientation.className='mobile-only mobile-orientation-hint';orientation.textContent='建议横屏展开演示，图和播放按钮会一起适配。';
  orientation.style.cssText='font-size:13px;color:#62788e;margin:8px 0';openButton.after(orientation);
  const details=button('展开详细解释');details.className='mobile-only mobile-copy-toggle';details.setAttribute('aria-expanded','false');
  copy.append(details);copy.dataset.mobileCopy='compact';
  details.addEventListener('click',()=>{
    const expanded=details.getAttribute('aria-expanded')!=='true';
    details.setAttribute('aria-expanded',String(expanded));details.textContent=expanded?'收起详细解释':'展开详细解释';copy.dataset.mobileCopy=expanded?'full':'compact';
  });
  let scale=1,mode='readable',currentZoom=1,layoutFrame=0,lastFrameWidth=-1;
  function layout(){
    if(!phone.matches){diagram.style.removeProperty('--mobile-diagram-width');diagram.removeAttribute('data-mobile-diagram');openButton.textContent=originalLabel;return;}
    openButton.textContent='展开演示 ↗';diagram.setAttribute('data-mobile-diagram','');
    const box=svg.viewBox.baseVal;
    let base=Math.max(1,frame.clientWidth);
    // Fit both dimensions in the short landscape viewport; zoom remains available.
    if(focusDialog.open && innerWidth>innerHeight && box.height){
      const maxHeight=parseFloat(getComputedStyle(frame).maxHeight);
      if(Number.isFinite(maxHeight))base=Math.min(base,maxHeight*box.width/box.height);
    }
    currentZoom=mode==='readable'?Math.max(1,box.width/base):scale;
    const nextWidth=`${Math.round(Math.max(1,base)*currentZoom)}px`;
    if(diagram.style.getPropertyValue('--mobile-diagram-width')!==nextWidth)diagram.style.setProperty('--mobile-diagram-width',nextWidth);
    out.disabled=currentZoom<=1;into.disabled=currentZoom>=6;
    reset.textContent=mode==='fit'?'清晰':'全图';
    reset.setAttribute('aria-label',mode==='fit'?'恢复清晰字号':'显示完整机制图');
    hint.textContent=mode==='fit'?'全图预览 · 点清晰读文字':'清晰视图 · 左右滑动查看';
  }
  function requestLayout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;layout();});}
  out.addEventListener('click',()=>{scale=Math.max(1,currentZoom/1.5);mode='custom';layout();});
  into.addEventListener('click',()=>{scale=Math.min(6,currentZoom*1.5);mode='custom';layout();});
  reset.addEventListener('click',()=>{mode=mode==='fit'?'readable':'fit';scale=1;layout();frame.scrollTo(0,0);});
  new ResizeObserver(entries=>{
    const width=entries[0].contentRect.width;
    if(Math.abs(width-lastFrameWidth)>.5){lastFrameWidth=width;requestLayout();}
  }).observe(frame);
  new MutationObserver(()=>{requestLayout();if(!focusDialog.open&&phone.matches)pause();}).observe(focusDialog,{attributes:true,attributeFilter:['open']});
  workbench.addEventListener('presentation:resize',requestLayout);
  // An HTML transcript remains legible even if an older iOS SVG renderer misses a glyph.
  if(root.matches('[data-rfmem-reader],[data-task-reader="hippo"]')){
    const transcript=document.createElement('details');transcript.className='mobile-only mobile-scene-transcript';
    const summary=document.createElement('summary');summary.textContent='查看本步图中文字';
    const content=document.createElement('p');transcript.append(summary,content);frame.after(transcript);
    function syncText(){
      const labels=[...svg.querySelectorAll('text')].filter(node=>{
        if(node.closest('[hidden]'))return false;
        for(let n=node;n&&n!==svg;n=n.parentElement){const style=getComputedStyle(n);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;}
        return true;
      }).map(node=>node.textContent.trim()).filter(Boolean);
      content.textContent=[...new Set(labels)].join(' · ');
    }
    transcript.addEventListener('toggle',()=>{if(transcript.open)syncText();});
    summary.addEventListener('click',syncText);
    new MutationObserver(()=>{if(transcript.open)syncText();}).observe(diagram,{attributes:true,attributeFilter:['data-step']});
  }
  cleanups.push(requestLayout);layout();
});
function update(){
  if(!phone.matches&&viewer.open)viewer.close();
  cleanups.forEach(fn=>fn());
}
phone.addEventListener('change',update);
window.addEventListener('resize',()=>cleanups.forEach(fn=>fn()));
