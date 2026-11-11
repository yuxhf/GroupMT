(() => {
  const drawer=document.querySelector('.toc'),toggle=document.querySelector('[data-toc-toggle]'),edge=document.querySelector('[data-toc-edge]'),backdrop=document.querySelector('[data-toc-backdrop]');
  if(!drawer||!toggle||!edge||!backdrop)return;
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const closeButton=drawer.querySelector('[data-toc-close]');
  let opened=false,pinned=false,timer=null;
  const cancel=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
  function revealActive(){
    const active=drawer.querySelector('a[aria-current="page"]');if(!active)return;
    const a=active.getBoundingClientRect(),d=drawer.getBoundingClientRect();
    if(a.top<d.top+55||a.bottom>d.bottom-20)drawer.scrollBy({top:a.top-d.top-75,behavior:'instant'});
  }
  function open(pin=false){
    cancel();opened=true;pinned=pin||pinned;drawer.inert=false;
    document.documentElement.classList.add('toc-open');toggle.setAttribute('aria-expanded','true');backdrop.hidden=false;revealActive();
    if(pin)(drawer.querySelector('a[aria-current="page"]')||closeButton).focus({preventScroll:true});
  }
  function close(restore=false){
    cancel();opened=false;pinned=false;document.documentElement.classList.remove('toc-open');toggle.setAttribute('aria-expanded','false');backdrop.hidden=true;
    if(restore)toggle.focus({preventScroll:true});
    drawer.inert=true;
  }
  function delayedClose(){
    cancel();if(pinned||drawer.contains(document.activeElement))return;
    timer=setTimeout(()=>close(),220);
  }
  toggle.hidden=false;edge.hidden=false;closeButton.hidden=false;
  drawer.inert=true;document.documentElement.classList.add('reader-shell-ready');
  toggle.addEventListener('click',()=>opened?close(true):open(true));
  toggle.addEventListener('pointerenter',()=>{if(fine.matches)open();});
  edge.addEventListener('pointerenter',()=>{if(fine.matches)open();});
  edge.addEventListener('pointerleave',delayedClose);
  drawer.addEventListener('pointerenter',cancel);drawer.addEventListener('pointerleave',delayedClose);
  closeButton.addEventListener('click',()=>close(true));backdrop.addEventListener('click',()=>close(true));
  drawer.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
    close();const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened){event.preventDefault();close(true);}});
  document.addEventListener('focusin',event=>{if(opened&&!pinned&&!drawer.contains(event.target)&&event.target!==toggle)delayedClose();});
})();
