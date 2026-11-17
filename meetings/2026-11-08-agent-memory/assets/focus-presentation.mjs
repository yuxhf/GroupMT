const mobile = () => matchMedia('(max-width:760px), (max-width:1100px) and (max-height:600px) and (pointer:coarse)').matches;

// Mobile uses a body-level presentation surface rather than Safari's modal top layer.
// Keep the original reader root intact so its selectors, SVG IDs and player survive.
export function installFocusPresentation({root, dialog, workbench, openButton, closeButton, pause}) {
  const position = document.createComment('workbench position');
  workbench.before(position);
  let session = null;
  function size() {
    if (!session?.mobile) return;
    const viewport = window.visualViewport;
    dialog.style.setProperty('--presentation-height', `${viewport?.height || innerHeight}px`);
    dialog.style.setProperty('--presentation-top', `${viewport?.offsetTop || 0}px`);
  }
  function finish() {
    if (!session) return;
    pause();
    const saved = session; session = null;
    position.after(workbench);closeButton.hidden = true;
    if (saved.mobile) {
      saved.rootPosition.after(root);saved.rootPosition.remove();
      root.classList.remove('mobile-focus-active');
      dialog.removeAttribute('aria-modal');
      dialog.style.removeProperty('--presentation-height');dialog.style.removeProperty('--presentation-top');
      saved.siblings.forEach(([node,inert]) => { node.inert = inert; });
      for (const [key,value] of Object.entries(saved.body)) document.body.style[key]=value;
      document.documentElement.style.overflow=saved.htmlOverflow;
      scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
    } else document.body.style.overflow=saved.overflow;
    saved.trigger.focus({preventScroll:true});
    workbench.dispatchEvent(new Event('presentation:resize'));
  }
  function close() {
    if (!session) return;
    if (session.mobile) { dialog.removeAttribute('open');finish(); }
    else dialog.close();
  }
  openButton.addEventListener('click',event=>{
    if (session) return;
    pause();
    const saved={mobile:mobile(),trigger:event.currentTarget,overflow:document.body.style.overflow};
    if (saved.mobile) {
      saved.x=scrollX;saved.y=scrollY;
      saved.body=Object.fromEntries(['position','top','left','width','overflow'].map(key=>[key,document.body.style[key]]));
      saved.htmlOverflow=document.documentElement.style.overflow;
      saved.rootPosition=document.createComment('reader position');root.before(saved.rootPosition);
      document.body.append(root);root.classList.add('mobile-focus-active');
      saved.siblings=[...document.body.children].filter(node=>node!==root&&!['DIALOG','SCRIPT','STYLE','LINK'].includes(node.tagName)).map(node=>[node,node.inert]);
      saved.siblings.forEach(([node])=>{node.inert=true;});
      Object.assign(document.body.style,{position:'fixed',top:`${-saved.y}px`,left:`${-saved.x}px`,width:'100%',overflow:'hidden'});
      document.documentElement.style.overflow='hidden';
      dialog.setAttribute('aria-modal','true');dialog.setAttribute('role','dialog');
    } else document.body.style.overflow='hidden';
    session=saved;dialog.append(workbench);closeButton.hidden=false;
    if (saved.mobile) dialog.setAttribute('open','');
    else dialog.showModal();
    size();closeButton.focus({preventScroll:true});
    workbench.dispatchEvent(new Event('presentation:resize'));
  });
  closeButton.addEventListener('click',close);
  dialog.addEventListener('close',finish);
  document.addEventListener('keydown',event=>{
    if (!session?.mobile || dialog.querySelector('dialog[open]')) return;
    if (event.key==='Escape') {event.preventDefault();close();}
    if (event.key==='Tab') {
      const nodes=[...dialog.querySelectorAll('button:not(:disabled),a[href],select:not(:disabled),summary,[tabindex="0"]')]
        .filter(node=>!node.closest('[hidden]')&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden');
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  window.visualViewport?.addEventListener('resize',size);
  window.visualViewport?.addEventListener('scroll',size);
  window.addEventListener('resize',size);
}
