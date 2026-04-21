export function initAnimations() {
  // ── Typewriter: hero name (once, no loop) ─────────────────
  const heroNameEl = document.querySelector('h1.hero-name');
  if (heroNameEl) {
    const line1 = 'Veera Reddy';
    const line2 = 'Ravuri';
    const typeSpeed = 65;

    heroNameEl.innerHTML = '';
    heroNameEl.classList.add('typewriter-cursor');

    function renderName(t1, t2) {
      if (t2 !== undefined) {
        heroNameEl.innerHTML = t1 + '<br><span class="hi">' + t2 + '</span>';
      } else {
        heroNameEl.textContent = t1;
      }
    }

    let phase = 0;
    let idx = 0;

    function tickName() {
      if (phase === 0) {
        idx++;
        renderName(line1.slice(0, idx));
        if (idx === line1.length) {
          phase = 1;
          idx = 0;
          setTimeout(tickName, 300);
          return;
        }
        setTimeout(tickName, typeSpeed);
      } else if (phase === 1) {
        idx++;
        renderName(line1, line2.slice(0, idx));
        if (idx === line2.length) {
          heroNameEl.classList.remove('typewriter-cursor');
          return;
        }
        setTimeout(tickName, typeSpeed);
      }
    }

    setTimeout(tickName, 300);
  }

  // ── Typewriter: hero subtitle (once, no loop) ─────────────
  const heroSubEl = document.querySelector('.hero-subtitle');
  if (heroSubEl) {
    const subtitleText = heroSubEl.textContent.trim();
    heroSubEl.textContent = '';
    heroSubEl.classList.add('typewriter-cursor');
    heroSubEl.style.setProperty('opacity', '1');

    let subIdx = 0;

    function tickSub() {
      subIdx++;
      heroSubEl.textContent = subtitleText.slice(0, subIdx);
      if (subIdx === subtitleText.length) {
        heroSubEl.classList.remove('typewriter-cursor');
        return;
      }
      setTimeout(tickSub, 38);
    }

    setTimeout(tickSub, 900);
  }

  // ── Scroll fade-in with reverse ────────────────────────────
  const fadeTargets = document.querySelectorAll('.fade-up');

  if (fadeTargets.length > 0) {
    const fadeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: [0, 0.15] });

    fadeTargets.forEach(el => fadeObserver.observe(el));
  }

  // ── Project card pipeline + gear animation ─────────────────
  const projectCards = document.querySelectorAll('.project-card');

  if (projectCards.length > 0) {
    const pipelineObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        const thisItem = card.closest('.pipeline-item');

        if (!entry.isIntersecting) {
          if (entry.boundingClientRect.top > 0) {
            card.classList.remove('visible');
            // Reverse: unfill segment and hide gears (bottom to top)
            if (thisItem) {
              const prev = thisItem.previousElementSibling;
              if (prev) {
                const seg = prev.querySelector('.p-seg');
                if (seg) seg.classList.remove('filled');
                const gearConnector = prev.querySelector('.p-gear-connector');
                if (gearConnector) {
                  const gears = [...gearConnector.querySelectorAll('.pipeline-gear')].reverse();
                  gears.forEach((gear, idx) => {
                    setTimeout(() => gear.classList.remove('visible'), idx * 150);
                  });
                }
              }
            }
          }
          return;
        }

        card.classList.add('visible');

        if (thisItem) {
          const prev = thisItem.previousElementSibling;
          if (prev) {
            const seg = prev.querySelector('.p-seg');
            if (seg) setTimeout(() => seg.classList.add('filled'), 250);

            // Gear animation: appear top to bottom with stagger
            const gearConnector = prev.querySelector('.p-gear-connector');
            if (gearConnector) {
              const gears = gearConnector.querySelectorAll('.pipeline-gear');
              gears.forEach((gear, idx) => {
                setTimeout(() => gear.classList.add('visible'), 400 + idx * 150);
              });
            }
          }
        }
      });
    }, { threshold: [0, 0.15] });

    projectCards.forEach(c => pipelineObserver.observe(c));
  }

  // ── Details smooth height transition (capture phase for all details) ──
  document.addEventListener('toggle', (e) => {
    const details = e.target;
    if (details.tagName !== 'DETAILS') return;

    const content = details.querySelector('.details-content, .coming-soon-body, .roadmap-chip-body, .incident-body');
    if (content) {
      content.style.setProperty('max-height', details.open ? content.scrollHeight + 'px' : '0');
    }

    // Update see-more summary text for project cards
    const summary = details.querySelector('.see-more-btn');
    if (summary) {
      summary.innerHTML = details.open
        ? '<span class="see-more-chevron">▶</span> Hide details'
        : '<span class="see-more-chevron">▶</span> See full details';
    }
  }, true);

  // ── Metric counter animation (loops while in view) ─────────
  const counterElements = document.querySelectorAll('[data-count-to]');

  if (counterElements.length > 0) {
    const pauseAtEnd = 1800;
    const pauseAtZero = 400;
    const countDuration = 1400;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function runCounter(el) {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.suffix || '';
      if (isNaN(target)) return;
      const decimals = (target.toString().split('.')[1] || '').length;

      function countUp() {
        const start = performance.now();
        function animate(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / countDuration, 1);
          const current = easeOut(progress) * target;
          el.textContent = current.toFixed(decimals) + suffix;
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setTimeout(() => {
              if (!el.dataset.counting) return;
              el.textContent = '0' + suffix;
              setTimeout(() => {
                if (!el.dataset.counting) return;
                countUp();
              }, pauseAtZero);
            }, pauseAtEnd);
          }
        }
        requestAnimationFrame(animate);
      }

      countUp();
    }

    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          if (!el.dataset.counting) {
            el.dataset.counting = 'true';
            runCounter(el);
          }
        } else {
          delete el.dataset.counting;
          const target = parseFloat(el.dataset.countTo);
          const suffix = el.dataset.suffix || '';
          const decimals = (target.toString().split('.')[1] || '').length;
          el.textContent = target.toFixed(decimals) + suffix;
        }
      });
    }, { threshold: 0.15 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // ── Skill tag stagger ──────────────────────────────────────
  const skillsSection = document.getElementById('skills');

  if (skillsSection) {
    const skillTags = skillsSection.querySelectorAll('.skill-tag');

    const skillObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        skillTags.forEach((tag, index) => {
          tag.style.setProperty('--stagger-delay', `${index * 40}ms`);
          tag.classList.add('visible');
        });
        skillObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    skillObserver.observe(skillsSection);
  }
}
