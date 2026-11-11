import {createPlayer} from './rfmem-player-state.mjs';

document.querySelectorAll('[data-task-reader]').forEach(root=>{
  const $=(selector,parent=root)=>parent.querySelector(selector);
  const $$=(selector,parent=root)=>[...parent.querySelectorAll(selector)];
  const spec=JSON.parse($('[data-step-spec]').textContent),steps=spec.steps;
  const workbench=$('.workbench'),scene=$('[data-case-scene]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let last=-1,view='demo',figure=spec.figures[0],animations=[];
  const settle=()=>{animations.forEach(a=>a.cancel());animations=[];};
  const player=createPlayer({count:steps.length,interval:4500,reduced:motion.matches,onChange:render});
  function render({index,playing}){
    const changed=index!==last,s=steps[index];
    if(changed){
      settle();scene.dataset.step=String(index);
      $$('[data-show]',scene).forEach(node=>{
        const visible=node.dataset.show.split(',').map(Number).includes(index);
        node.hidden=!visible;node.toggleAttribute('hidden',!visible);
        node.setAttribute('aria-hidden',String(!visible));node.classList.toggle('is-visible',visible);
      });
      $$('[data-case-jump]').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
      $('[data-case-counter]').textContent=`${index+1} / ${steps.length} · ${s.label}`;
      $('[data-case-mapping]').textContent=`原图对应：${s.mapping}`;
      $('[data-case-title]').textContent=s.title;$('[data-case-description]').textContent=s.description;
      $('[data-case-takeaway]').textContent=s.takeaway;$('[data-case-formula]').textContent=s.formula||'该步按原图任务讲解，不增加未给出的数值。';
      if(spec.key==='hippo'){
        const nodes=$$('[data-h-node]');
        nodes.forEach(n=>n.classList.remove('is-seed','is-active','is-returned','is-noise'));
        const flag=(ids,cls)=>ids.forEach(id=>$(`[data-h-node="${id}"]`)?.classList.add(cls));
        if(index>=6)flag(['xiaolin','panda','zoo','prefdoc','flowerdoc','beachdoc','citydoc','zoodoc','other2','other3','other4'],'is-seed');
        if(index===7)flag(['xiaolin','panda','zoo','alias'],'is-active');
        if(index>=8)flag(['xiaolin','panda','zoo','city','prefdoc','zoodoc','citydoc'],'is-active');
        if(index>=9){flag(['prefdoc','zoodoc','citydoc','flowerdoc'],'is-returned');flag(['flowerdoc'],'is-noise');}
        if(index===7&&!motion.matches){
          const paths=[[[695,270],[810,244]],[[810,244],[820,362]],[[820,362],[720,414]],[[810,244],[865,180]]];
          $$('[data-h-pulse]').forEach((pulse,i)=>animations.push(pulse.animate([
            {transform:`translate(${paths[i][0][0]}px,${paths[i][0][1]}px)`,opacity:0},
            {transform:`translate(${paths[i][0][0]}px,${paths[i][0][1]}px)`,opacity:1,offset:.12},
            {transform:`translate(${paths[i][1][0]}px,${paths[i][1][1]}px)`,opacity:1,offset:.85},
            {transform:`translate(${paths[i][1][0]}px,${paths[i][1][1]}px)`,opacity:0}],
            {duration:1600,delay:i*250,easing:'ease-in-out'})));
        }
        if(index===8&&!motion.matches){
          const pulse=$('[data-h-pulse="0"]');
          animations.push(pulse.animate([{transform:'translate(820px,362px)',opacity:0},{transform:'translate(820px,362px)',opacity:1,offset:.1},{transform:'translate(810px,525px)',opacity:1,offset:.9},{transform:'translate(810px,525px)',opacity:0}],{duration:1700,easing:'ease-in-out'}));
        }
      }
      if(s.diagram){
        const d=s.diagram;
        $$('[data-case-field]').forEach(node=>{
          const value=d.fields[node.dataset.caseField] ?? '—';
          if(node.namespaceURI==='http://www.w3.org/2000/svg'){
            const rows=Array.isArray(value)?value:[String(value)],x=node.getAttribute('x'),line=Number(node.dataset.lineHeight||22);
            node.replaceChildren(...rows.map((v,i)=>{const span=document.createElementNS('http://www.w3.org/2000/svg','tspan');span.setAttribute('x',x);span.setAttribute('dy',String(i?line:0));span.textContent=v;return span;}));
          }else node.textContent=Array.isArray(value)?value.join(' / '):value;
        });
        $$('[data-p-node]').forEach(n=>n.classList.toggle('is-active',(d.active||[]).includes(n.dataset.pNode)));
        $$('[data-p-route]').forEach(n=>n.classList.toggle('is-active',(d.routes||[]).includes(n.dataset.pRoute)));
        $$('[data-evidence-id]').forEach(n=>n.classList.toggle('is-used',(d.seen||[]).includes(n.dataset.evidenceId)));
        $$('[data-operation]').forEach(n=>{n.classList.toggle('is-selected',n.dataset.operation===d.operation);n.classList.toggle('is-wrong',d.wrong&&['DELETE','ADD'].includes(n.dataset.operation));});
        scene.classList.toggle('has-candidates',Boolean(d.candidates));scene.classList.toggle('has-distilled',Boolean(d.distilled));scene.classList.toggle('is-counterexample',Boolean(d.wrong));
        if(Array.isArray(d.memory))scene.dataset.petCount=String(d.memory.length);
        if(d.transfer&&!motion.matches){
          const route=$(`[data-p-route="${d.transfer.route}"]`),token=$('[data-transfer-token]');
          if(route&&token){
            $('[data-transfer-label]').textContent=d.transfer.label;
            const length=route.getTotalLength(),frames=Array.from({length:25},(_,i)=>{const p=route.getPointAtLength(length*i/24);return {transform:`translate(${p.x}px,${p.y}px)`,opacity:i===0||i===24?0:1,offset:i/24};});
            animations.push(token.animate(frames,{duration:1500,easing:'ease-in-out'}));
          }
        }
      }
      last=index;
    }
    $('[data-case-prev]').disabled=index===0;$('[data-case-next]').disabled=index===steps.length-1;
    $('[data-case-play]').textContent=playing?'暂停':index===steps.length-1?'重新播放':'播放';
    $('[data-case-play]').setAttribute('aria-pressed',String(playing));
    $('[data-case-status]').textContent=motion.matches?'减少动态效果':playing?'自动演示中':index===steps.length-1?'演示结束':'手动讲解';
    if(!playing&&!changed)animations.forEach(a=>a.pause());else animations.forEach(a=>a.play());
  }
  const go=index=>{player.go(index);if(!motion.matches)animations.forEach(a=>a.play());};
  const play=()=>{if(!player.state().playing)document.dispatchEvent(new CustomEvent('memory:play',{detail:spec.key}));player.toggle();};
  $('[data-case-prev]').addEventListener('click',()=>go(player.state().index-1));
  $('[data-case-next]').addEventListener('click',()=>go(player.state().index+1));
  $('[data-case-reset]').addEventListener('click',()=>go(0));
  $('[data-case-play]').addEventListener('click',play);
  $('[data-case-speed]').addEventListener('change',e=>player.speed(Number(e.target.value)));
  $$('[data-case-jump]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.caseJump))));
  function setView(value){
    view=value;player.stop();settle();
    $$('[data-case-view]').forEach(button=>{const current=button.dataset.caseView===value;button.setAttribute('aria-selected',String(current));button.tabIndex=current?0:-1;});
    $$('[data-case-panel]').forEach(panel=>panel.hidden=panel.dataset.casePanel!==value);
    $('.control-zone').hidden=value!=='demo';
  }
  $$('[data-case-view]').forEach(button=>{
    button.addEventListener('click',()=>setView(button.dataset.caseView));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const next=event.key==='Home'?'demo':event.key==='End'?'overview':view==='demo'?'overview':'demo';
      setView(next);$(`[data-case-view="${next}"]`).focus();
    });
  });
  $$('[data-case-figure]').forEach(button=>button.addEventListener('click',()=>{
    figure=spec.figures.find(f=>f.key===button.dataset.caseFigure);
    const image=$('[data-case-image]');image.src=figure.src;image.alt=`${spec.title} · ${figure.label}`;image.width=figure.width;image.height=figure.height;
    $('[data-case-caption]').textContent=figure.label;
    $$('[data-case-figure]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  workbench.addEventListener('keydown',event=>{
    if(view!=='demo'||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,a,summary,[data-case-view],[data-graph-scroll]'))return;
    const actions={ArrowLeft:()=>go(player.state().index-1),ArrowRight:()=>go(player.state().index+1),Home:()=>go(0),End:()=>go(steps.length-1)};
    if(actions[event.key]){event.preventDefault();actions[event.key]();}
    if(event.key===' '&&!event.target.closest('button')){event.preventDefault();play();}
  });
  const dialog=$('[data-case-dialog]'),placeholder=document.createComment(spec.key+' workbench');workbench.before(placeholder);
  let returnFocus=null,savedOverflow='';
  $('[data-case-focus]').addEventListener('click',event=>{
    player.stop();settle();returnFocus=event.currentTarget;savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.append(workbench);$('[data-case-exit]').hidden=false;dialog.showModal();$('[data-case-exit]').focus();
  });
  $('[data-case-exit]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{player.stop();settle();placeholder.after(workbench);$('[data-case-exit]').hidden=true;document.body.style.overflow=savedOverflow;returnFocus?.focus();});
  const imageDialog=$('[data-case-image-dialog]');let imageFocus=null;
  $('[data-case-image-open]').addEventListener('click',event=>{
    player.stop();settle();imageFocus=event.currentTarget;
    $('[data-case-large-image]').src=figure.src;$('[data-case-large-image]').alt=`${spec.title} · ${figure.label}`;
    $('[data-case-image-label]').textContent=figure.label;(dialog.open?dialog:root).append(imageDialog);imageDialog.showModal();
  });
  $('[data-case-image-close]').addEventListener('click',()=>imageDialog.close());
  imageDialog.addEventListener('close',()=>{root.append(imageDialog);imageFocus?.focus();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.stop();settle();}});
  document.addEventListener('memory:play',event=>{if(event.detail!==spec.key){player.stop();settle();}});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting)){player.stop();settle();}},{threshold:0}).observe(workbench);
  function reduced(){settle();player.reduced(motion.matches);$('[data-case-play]').disabled=motion.matches;$('[data-case-speed]').disabled=motion.matches;}
  motion.addEventListener('change',reduced);root.dataset.ready='true';render(player.state());reduced();
});
