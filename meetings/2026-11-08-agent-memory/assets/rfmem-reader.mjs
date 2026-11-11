import {createPlayer} from './rfmem-player-state.mjs';

const component = document.querySelector('[data-rfmem-reader]');
const $ = (selector, root = component) => root.querySelector(selector);
const $$ = (selector, root = component) => [...root.querySelectorAll(selector)];
const workbench = $('#rfmem-recollection-animation');
const diagram = $('.diagram');
const spec = JSON.parse($('#rfmem-step-spec').textContent);
const steps = spec.steps;
const memories = new Map(spec.memories.map(item => [item.id,item]));
const memory = id => memories.get(id) || {id,...spec.other[String(id)]};
const labels = $$('[data-jump]').map(button => button.textContent);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let currentView = 'demo', previousStep = -1, figure = '2', activeAnimations = [];
const figures = {
  '2': {src:'figures/papers/rfmem_architecture.png', alt:'RF-Mem Figure 2：Familiarity 与 Recollection 双路径总体架构', width:1115, height:650},
  '1': {src:'figures/papers/rfmem_intro_figure1.png', alt:'RF-Mem Figure 1：一次检索与逐步回忆的对比', width:789, height:405},
  '18': {src:'figures/papers/rfmem_personamem_case_figure18.png', alt:'RF-Mem Figure 18：四轮检索分支与 Top-10 结果', width:1390, height:1430}
};
function settleMotion() {
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
  $$('[data-transfer-id]',diagram).forEach(token=>{token.hidden=true;token.setAttribute('hidden','');});
}
const player = createPlayer({count:steps.length, interval:4500, reduced:motion.matches, onChange:render});
function render({index, playing}) {
  const changed = previousStep !== index;
  const item = steps[index];
  if (changed) {
    settleMotion();
    diagram.dataset.step = String(index);
    diagram.dataset.mode = item.mode || 'recollection';
    $$('[data-show]', diagram).forEach(node => {
      const visible = node.getAttribute('data-show').split(',').map(Number).includes(index);
      node.classList.toggle('is-visible', visible);
      node.hidden = !visible;
      if (visible) node.removeAttribute('hidden'); else node.setAttribute('hidden','');
      node.setAttribute('aria-hidden', String(!visible));
    });
    $$('[data-focus-now]',diagram).forEach(node => node.removeAttribute('data-focus-now'));
    const focus = $(`.${item.focus}`,diagram);
    focus?.setAttribute('data-focus-now','');
    // A single change cue on the actual object, rather than an ornamental loop.
    if (previousStep !== -1 && !motion.matches && focus?.animate) {
      activeAnimations.push(focus.animate([{opacity:.25},{opacity:1}], {duration:550,easing:'ease-out'}));
      item.added.forEach((id,order)=>{
        const token=$(`[data-transfer-id="${id}"]`,diagram);
        token.hidden=false;token.removeAttribute('hidden');
        const from=`translate(${token.dataset.fromX}px,${token.dataset.fromY}px)`;
        const to=`translate(${token.dataset.toX}px,${token.dataset.toY}px)`;
        token.style.transform=from;
        const animation=token.animate([{transform:from,opacity:.85},{transform:to,opacity:1}],{duration:850,delay:order*160,fill:'both',easing:'ease-in-out'});
        animation.finished.then(()=>{token.hidden=true;token.setAttribute('hidden','');}).catch(()=>{});
        activeAnimations.push(animation);
      });
    }
    $('[data-bag-title]').textContent=item.mode==='fast'?'Familiarity':'ResultBag';
    $('[data-bag-count]').textContent=`${item.bag.length} / 10`;
    $('[data-bag-caption]').textContent=item.mode==='fast'?'一次检索 · 原图上半部分':item.final?'按轮次展示 · 非排名':'保留分支累计 · 按 ID 去重';
    $$('[data-result-slot]',diagram).forEach((row,i)=>{
      const id=item.bag[i],m=id===undefined?null:memory(id);
      row.classList.toggle('is-collected',!!m);
      row.classList.toggle('is-new',item.added.includes(id));
      row.classList.toggle('is-complementary',!!item.final && memories.get(id)?.round>=2);
      $('[data-result-label]',row).textContent=m?`${id} · ${m.label}`:'待补充';
      $('[data-result-round]',row).textContent=m && item.mode!=='fast'?`r${m.round}`:'';
    });
    $('[data-result-count]').textContent=String(item.bag.length);
    const list=$('[data-result-list]');list.replaceChildren();
    if (!item.bag.length){const li=document.createElement('li');li.textContent='尚未检索。';list.append(li);}
    item.bag.forEach(id=>{const m=memory(id),li=document.createElement('li');li.textContent=`ID ${id} · ${m.label}：${m.meaning}`;list.append(li);});
    $('[data-counter]').textContent = `${index + 1} / ${steps.length} · ${labels[index]}`;
    $('[data-title]').textContent = item.title;
    $('[data-description]').textContent = item.description;
    $('[data-takeaway]').textContent = item.takeaway;
    $('[data-formula]').textContent = item.formula;
    $$('[data-jump]').forEach((button,i) => {
      if (i === index) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    });
    previousStep = index;
  }
  $('[data-prev]').disabled = index === 0;
  $('[data-next]').disabled = index === steps.length - 1;
  $('[data-play]').textContent = playing ? '暂停' : index === steps.length - 1 ? '重新播放' : '播放';
  $('[data-play]').setAttribute('aria-pressed',String(playing));
  $('[data-status]').textContent = motion.matches ? '减少动态效果' : playing ? '自动演示中' : index === steps.length - 1 ? '演示结束' : '手动讲解';
  if (!playing && !changed) activeAnimations.forEach(animation => animation.pause());
  else activeAnimations.forEach(animation => animation.play());
}
// Manual navigation is a single complete cue. Autoplay pause really freezes it.
function go(index) {
  player.go(index);
  if (!motion.matches) activeAnimations.forEach(animation => animation.play());
}
$('[data-prev]').addEventListener('click',()=>go(player.state().index-1));
$('[data-next]').addEventListener('click',()=>go(player.state().index+1));
$('[data-reset]').addEventListener('click',()=>go(0));
$('[data-play]').addEventListener('click',()=>player.toggle());
$('[data-speed]').addEventListener('change',event=>player.speed(Number(event.target.value)));
$$('[data-jump]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.jump))));

function setView(view) {
  currentView = view;
  player.stop(); settleMotion();
  $$('[data-view]').forEach(button=>{
    const active = button.dataset.view === view;
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  });
  $('#rfmem-panel-demo').hidden=view!=='demo';$('#rfmem-panel-overview').hidden=view!=='overview';
  $('.control-zone').hidden=view!=='demo';
  $('[data-comparison]').hidden=view!=='demo';
  $('[data-view-meta]').textContent=view==='demo'?'Figure 18 · 教学重构':`Figure ${figure} · 英文原图`;
}
$$('[data-view]').forEach(button=>{
  button.addEventListener('click',()=>setView(button.dataset.view));
  button.addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();event.stopPropagation();
    const view=event.key==='Home'?'demo':event.key==='End'?'overview':currentView==='demo'?'overview':'demo';
    setView(view);$(`[data-view="${view}"]`).focus();
  });
});
$$('[data-figure]').forEach(button=>button.addEventListener('click',()=>{
  figure=button.dataset.figure;
  const item=figures[figure],image=$('[data-reference-image]');
  image.src=item.src;image.alt=item.alt;image.width=item.width;image.height=item.height;
  $$('[data-figure]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  $('[data-figure-caption]').textContent=` · Figure ${figure} · v1 · 英文原图`;
  $('[data-view-meta]').textContent=`Figure ${figure} · 英文原图`;
}));

workbench.addEventListener('keydown',event=>{
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || currentView!=='demo') return;
  if (event.target.closest('input,select,textarea,a,summary,[data-view]')) return;
  if (event.key==='ArrowLeft') {event.preventDefault();go(player.state().index-1);}
  if (event.key==='ArrowRight') {event.preventDefault();go(player.state().index+1);}
  if (event.key==='Home') {event.preventDefault();go(0);}
  if (event.key==='End') {event.preventDefault();go(steps.length-1);}
  if (event.key===' ' && !event.target.closest('button')) {event.preventDefault();player.toggle();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){player.stop();settleMotion();}});
// Keep the same observed element when moved into the native modal.
if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{
  if(entries.some(entry=>!entry.isIntersecting)){player.stop();settleMotion();}
},{threshold:0}).observe(workbench);
motion.addEventListener('change',event=>{settleMotion();player.reduced(event.matches);applyReduced();});
function applyReduced(){
  $('[data-play]').disabled=motion.matches;
  $('[data-play]').title=motion.matches?'系统已启用减少动态效果，请手动切步。':'';
  $('[data-speed]').disabled=motion.matches;
  render(player.state());
}

const focusDialog=$('[data-focus-dialog]');
const placeholder=document.createComment('workbench position');
workbench.before(placeholder);
let focusReturn=null,bodyOverflow='';
$('[data-focus-open]').addEventListener('click',event=>{
  player.stop();settleMotion();focusReturn=event.currentTarget;
  bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  focusDialog.append(workbench);$('[data-focus-close]').hidden=false;
  focusDialog.showModal();$('[data-focus-close]').focus();
});
$('[data-focus-close]').addEventListener('click',()=>focusDialog.close());
focusDialog.addEventListener('close',()=>{
  player.stop();settleMotion();placeholder.after(workbench);
  $('[data-focus-close]').hidden=true;document.body.style.overflow=bodyOverflow;
  focusReturn?.focus();
});

const imageDialog=$('[data-image-dialog]');
let imageReturn=null;
function openImage(item,trigger){
  player.stop();settleMotion();imageReturn=trigger;
  const image=$('[data-large-image]');image.src=item.src;image.alt=item.alt;image.style.width='100%';
  $('[data-image-title]').textContent=item.alt;
  $('[data-image-zoom]').textContent='原尺寸';$('[data-image-zoom]').setAttribute('aria-pressed','false');
  // A nested modal must remain a descendant of the focus dialog so inert applies correctly.
  (focusDialog.open?focusDialog:component).append(imageDialog);
  imageDialog.showModal();$('.image-scroll',imageDialog).scrollTop=0;
}
$('[data-image-open]').addEventListener('click',event=>openImage(figures[figure],event.currentTarget));
$('[data-thumbnail]').addEventListener('click',event=>openImage(figures['18'],event.currentTarget));
$('[data-thumbnail]').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openImage(figures['18'],event.currentTarget);}});
$('[data-image-close]').addEventListener('click',()=>imageDialog.close());
$('[data-image-zoom]').addEventListener('click',event=>{
  const image=$('[data-large-image]'),zoom=event.currentTarget.getAttribute('aria-pressed')!=='true';
  image.style.width=zoom?`${image.naturalWidth}px`:'100%';
  event.currentTarget.setAttribute('aria-pressed',String(zoom));event.currentTarget.textContent=zoom?'适应窗口':'原尺寸';
});
imageDialog.addEventListener('close',()=>{component.append(imageDialog);imageReturn?.focus();});
component.dataset.ready='true';
render(player.state());applyReduced();
