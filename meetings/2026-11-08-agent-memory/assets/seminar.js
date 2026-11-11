(() => {
  const surveyButtons = [...document.querySelectorAll('[data-survey-open]')];
  if (surveyButtons.length) {
    const viewer = document.createElement('dialog');
    viewer.className = 'survey-image-viewer';
    viewer.innerHTML = '<header><strong></strong><button type="button" data-survey-zoom aria-pressed="false">原尺寸 100%</button><button type="button" data-survey-close>关闭 · Esc</button></header><div class="survey-image-scroll"><img alt=""></div>';
    document.body.append(viewer);
    const image = viewer.querySelector('img');
    surveyButtons.forEach(button => button.addEventListener('click', () => {
      image.src = button.dataset.surveyOpen;
      image.alt = button.dataset.surveyLabel;
      image.style.width = '100%';
      viewer.querySelector('[data-survey-zoom]').setAttribute('aria-pressed', 'false');
      viewer.querySelector('[data-survey-zoom]').textContent = '原尺寸 100%';
      viewer.querySelector('strong').textContent = button.dataset.surveyLabel;
      viewer.showModal();
      viewer.querySelector('.survey-image-scroll').scrollTop = 0;
    }));
    viewer.querySelector('[data-survey-close]').addEventListener('click', () => viewer.close());
    viewer.querySelector('[data-survey-zoom]').addEventListener('click', event => {
      const zoomed = event.currentTarget.getAttribute('aria-pressed') !== 'true';
      image.style.width = zoomed ? image.naturalWidth + 'px' : '100%';
      event.currentTarget.setAttribute('aria-pressed', String(zoomed));
      event.currentTarget.textContent = zoomed ? '适应窗口' : '原尺寸 100%';
    });
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-rf-expand]').forEach(button => {
    const root=button.closest('[data-step-animation]');
    function expand(value) {
      root.classList.toggle('rf-expanded',value);
      if (value) root.scrollTop=0;
      document.body.classList.toggle('rf-presenting',value);
      button.setAttribute('aria-pressed',String(value));
      button.textContent=value?'退出放大 · Esc':'放大演示 ↗';
      if (!value) button.focus();
    }
    button.addEventListener('click',()=>expand(!root.classList.contains('rf-expanded')));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('rf-expanded')) expand(false);});
  });
  document.querySelectorAll('[data-step-animation]').forEach(root => {
    root.dataset.enhanced = 'true';
    if (reduced) {
      const button = root.querySelector('[data-step-play]');
      if (button) { button.disabled = true; button.title = '系统已启用减少动态效果；请使用上一步 / 下一步。'; }
    }
  });
  const buttons = [...document.querySelectorAll('[data-case-target]')];
  const panels = [...document.querySelectorAll('[data-case]')];
  function show(key) {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.caseTarget === key)));
    panels.forEach(panel => { panel.hidden = panel.dataset.case !== key; });
  }
  buttons.forEach(button => button.addEventListener('click', () => show(button.dataset.caseTarget)));
  if (buttons.length) show(buttons[0].dataset.caseTarget);
  function revealHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    let details = target.closest('details');
    if (!details) return;
    while (details) { details.open = true; details = details.parentElement?.closest('details'); }
    target.scrollIntoView({block:'start', behavior: reduced ? 'instant' : 'smooth'});
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.static-transcript').forEach(node => { node.dataset.wasOpen = String(node.open); node.open = true; });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.static-transcript').forEach(node => { node.open = node.dataset.wasOpen === 'true'; });
  });
})();
