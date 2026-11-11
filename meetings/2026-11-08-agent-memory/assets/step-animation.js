(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const controllers = [];

      document.querySelectorAll('[data-step-animation]:not([data-custom-player])').forEach((root) => {
        const specNode = root.querySelector('[data-step-spec]');
        if (!specNode) return;
        let steps;
        try { steps = JSON.parse(specNode.textContent).steps; }
        catch (error) { console.error('Invalid step animation spec', root.id, error); return; }
        if (!Array.isArray(steps) || !steps.length) return;

        const prev = root.querySelector('[data-step-prev]');
        const next = root.querySelector('[data-step-next]');
        const play = root.querySelector('[data-step-play]');
        const counter = root.querySelector('[data-step-counter]');
        const title = root.querySelector('[data-step-title]');
        const description = root.querySelector('[data-step-description]');
        const formula = root.querySelector('[data-step-formula]');
        const takeaway = root.querySelector('[data-step-takeaway]');
        const dots = Array.from(root.querySelectorAll('[data-step-dot]'));
        const hideTimers = new WeakMap();
        let step = 0;
        let timer = null;

        function includesStep(node, attribute) {
          return (node.getAttribute(attribute) || '').split(',').map(Number).includes(step);
        }

        function setVisible(node, visible) {
          const pending = hideTimers.get(node);
          if (pending) window.clearTimeout(pending);
          if (visible) {
            node.hidden = false; node.removeAttribute('hidden');
            node.setAttribute('aria-hidden', 'false');
            window.requestAnimationFrame(() => node.classList.add('is-visible'));
          } else {
            node.classList.remove('is-visible');
            node.setAttribute('aria-hidden', 'true');
            const finish = () => { if (!node.classList.contains('is-visible')) { node.hidden = true; node.setAttribute('hidden', ''); } };
            if (reducedMotion) finish();
            else hideTimers.set(node, window.setTimeout(finish, 320));
          }
        }

        function stop() {
          if (timer) window.clearInterval(timer);
          timer = null;
          play.setAttribute('aria-pressed', 'false');
          play.textContent = '▶ 自动演示';
        }

        function render() {
          const current = steps[step];
          root.dataset.step = String(step);
          root.querySelectorAll('[data-show]').forEach((node) => setVisible(node, includesStep(node, 'data-show')));
          root.querySelectorAll('[data-active]').forEach((node) => node.classList.toggle('is-active', includesStep(node, 'data-active')));
          title.textContent = current.title || '';
          description.textContent = current.description || '';
          formula.textContent = current.formula || '';
          formula.hidden = !current.formula;
          if (takeaway) {
            takeaway.textContent = current.takeaway || '';
            takeaway.hidden = !current.takeaway;
          }
          counter.textContent = `${step + 1} / ${steps.length}`;
          prev.disabled = step === 0;
          next.disabled = step === steps.length - 1;
          dots.forEach((dot, index) => {
            const currentDot = index === step;
            dot.classList.toggle('is-current', currentDot);
            if (currentDot) dot.setAttribute('aria-current', 'step');
            else dot.removeAttribute('aria-current');
          });
        }

        function go(nextStep, manual = true) {
          if (manual) stop();
          step = Math.max(0, Math.min(steps.length - 1, nextStep));
          render();
        }

        prev.addEventListener('click', () => go(step - 1));
        next.addEventListener('click', () => go(step + 1));
        dots.forEach((dot, index) => dot.addEventListener('click', () => go(index)));
        play.addEventListener('click', () => {
          if (timer) { stop(); return; }
          if (step === steps.length - 1) step = 0;
          play.setAttribute('aria-pressed', 'true');
          play.textContent = 'Ⅱ 暂停';
          render();
          const interval = Number(root.dataset.autoplayMs) || 3200;
          timer = window.setInterval(() => {
            if (step >= steps.length - 1) { stop(); return; }
            step += 1;
            render();
          }, interval);
        });
        root.addEventListener('keydown', (event) => {
          if (event.target.closest('button, a, input, textarea, select')) return;
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(step - 1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); go(step + 1); }
          if (event.key === ' ') { event.preventDefault(); play.click(); }
        });
        controllers.push({stop});
        render();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) controllers.forEach((controller) => controller.stop());
      });
    })();
