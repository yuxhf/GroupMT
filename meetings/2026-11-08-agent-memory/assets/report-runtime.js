(() => {
      const sections = Array.from(document.querySelectorAll('.report-section[id]'));
      const links = Array.from(document.querySelectorAll('.toc-group a[href^="#"]'));
      const desktopToc = document.querySelector('.toc');
      const currentLabels = Array.from(document.querySelectorAll('.current-page'));
      let activeId = '';
      let scheduled = false;
      let manualLockUntil = 0;

      function keepDesktopLinkVisible(link) {
        if (!desktopToc || !link || window.innerWidth <= 760) return;
        const containerRect = desktopToc.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const topGuard = containerRect.top + 50;
        const bottomGuard = containerRect.bottom - 18;
        if (linkRect.top < topGuard) {
          desktopToc.scrollBy({top: linkRect.top - topGuard, behavior: 'smooth'});
        } else if (linkRect.bottom > bottomGuard) {
          desktopToc.scrollBy({top: linkRect.bottom - bottomGuard, behavior: 'smooth'});
        }
      }

      function setActive(id) {
        if (!id || id === activeId) return;
        activeId = id;
        let label = '';
        let desktopActive = null;
        links.forEach((link) => {
          const isActive = link.getAttribute('href') === '#' + id;
          link.classList.toggle('active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'page');
            label = link.textContent.trim();
            if (link.closest('.toc') === desktopToc) desktopActive = link;
          } else {
            link.removeAttribute('aria-current');
          }
        });
        document.querySelectorAll('.toc-group').forEach((group) => {
          group.classList.toggle('active-group', Boolean(group.querySelector('a.active')));
        });
        currentLabels.forEach((node) => { node.textContent = label || '当前页'; });
        keepDesktopLinkVisible(desktopActive);
      }

      function findCurrentSection() {
        const marker = Math.max(96, window.innerHeight * 0.24);
        let current = sections[0];
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= marker) current = section;
          else break;
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          current = sections[sections.length - 1];
        }
        return current;
      }

      function updateFromScroll() {
        scheduled = false;
        if (performance.now() < manualLockUntil) return;
        const current = findCurrentSection();
        if (current) setActive(current.id);
      }

      function scheduleUpdate() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(updateFromScroll);
      }

      const observer = new IntersectionObserver(scheduleUpdate, {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 0.01]
      });
      sections.forEach((section) => observer.observe(section));
      window.addEventListener('scroll', scheduleUpdate, {passive: true});
      window.addEventListener('resize', scheduleUpdate, {passive: true});

      links.forEach((link) => {
        link.addEventListener('click', () => {
          const id = decodeURIComponent(link.getAttribute('href').slice(1));
          manualLockUntil = performance.now() + 700;
          setActive(id);
          const mobileDetails = link.closest('.mobile-toc');
          if (mobileDetails) window.setTimeout(() => { mobileDetails.open = false; }, 180);
        });
      });

      const initialId = location.hash.slice(1);
      if (initialId && document.getElementById(initialId)) setActive(initialId);
      else updateFromScroll();
    })();
(() => {
      const share = window.REPORT_SHARE;
      if (!share) return;
      document.querySelectorAll('[data-share-papers]').forEach((node) => { node.href = share.papers_url; });
      document.querySelectorAll('[data-share-report]').forEach((node) => { node.href = share.report_url; });
      document.querySelectorAll('[data-share-url-text]').forEach((node) => { node.textContent = share.papers_url; });
      document.querySelectorAll('[data-share-qr]').forEach((node) => {
        node.src = 'share_qr.svg?v=' + encodeURIComponent(share.session_id);
        node.hidden = false;
      });
      document.querySelectorAll('[data-share-offline]').forEach((node) => { node.hidden = true; });
    })();
