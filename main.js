/* ── Portfolio Main Script ─────────────────────────────────── */
const PROJECT_DATA = {};

/* ── Copy toast ───────────────────────────────────────────── */
function showCopyToast(text) {
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text || 'Copied to clipboard!';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showCopyToast()).catch(() => showCopyToast('Copy failed'));
}

/* ── Resume modal ─────────────────────────────────────────── */
function openResume(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('resume-modal');
  const iframe = document.getElementById('resume-iframe');
  iframe.src = 'assets/Veera_Reddy_Ravuri_Cloud_DevOps_Resume.pdf?v=2';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeResume() {
  const modal = document.getElementById('resume-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('resume-iframe').src = '';
}

document.getElementById('resume-modal-close').addEventListener('click', closeResume);
document.getElementById('resume-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeResume();
});

/* ── Render projects ──────────────────────────────────────── */
async function init() {
  let projects;
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error();
    projects = await res.json();
  } catch {
    document.getElementById('projects-root').innerHTML =
      `<p style="font-family:var(--fm);font-size:13px;color:var(--muted2);">
         Preview requires a local server.<br>
         Run: <strong style="color:var(--accent)">python3 -m http.server</strong>
         then open <strong style="color:var(--accent)">http://localhost:8000</strong>
       </p>`;
    return;
  }

  // Store project data for modal access
  projects.forEach(p => { PROJECT_DATA[p.id] = p; });

  // Separate live and coming-soon projects
  const liveProjects = projects.filter(p => p.status === 'live');
  const comingSoonProjects = projects.filter(p => p.status === 'coming-soon');

  // Sort live projects: P3 → P2 → P1 (latest/most complex first)
  liveProjects.sort((a, b) => {
    const order = { p3: 0, p2: 1, p1: 2 };
    return (order[a.id] ?? 99) - (order[b.id] ?? 99);
  });

  const phases = [
    { id: 1, label: 'Phase 1 — Foundation', cls: 'p1' },
    { id: 2, label: 'Phase 2 — Orchestration & Reliability', cls: 'p2' },
    { id: 3, label: 'Phase 3 — AI Infrastructure', cls: 'p3' },
  ];

  const root = document.getElementById('projects-root');

  // ── Render LIVE projects (P3 → P2 → P1) ──────────────────
  const liveGroup = document.createElement('div');
  liveGroup.className = 'phase-group p1';
  liveGroup.innerHTML = `
    <div class="phase-header">
      <span class="phase-badge">Live Projects</span>
      <div class="phase-line"></div>
    </div>
    <div class="pipeline-list" id="pl-live"></div>`;
  root.appendChild(liveGroup);

  const liveList = liveGroup.querySelector('#pl-live');

  liveProjects.forEach((p, i) => {
    const isLast = i === liveProjects.length - 1;
    const highlights = p.highlights.map(h => `<li>${h}</li>`).join('');
    const stack = p.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');

    // Hero metrics badges
    const heroMetricsHTML = (p.heroMetrics && p.heroMetrics.length) ? `
      <div class="hero-metrics">
        ${p.heroMetrics.map(m => `
          <div class="hero-metric-badge">
            <span class="hero-metric-val">${m.value}</span>
            <span class="hero-metric-lbl">${m.label}</span>
          </div>`).join('')}
      </div>` : '';

    // Quick summary
    const qsHTML = p.quickSummary ? `
      <div class="quick-summary">
        <div class="qs-item"><span class="qs-label">Problem</span><span class="qs-value">${p.quickSummary.problem}</span></div>
        <div class="qs-item"><span class="qs-label">Solution</span><span class="qs-value">${p.quickSummary.solution}</span></div>
        <div class="qs-item"><span class="qs-label">Key Challenge</span><span class="qs-value">${p.quickSummary.keyChallenge}</span></div>
        <div class="qs-item"><span class="qs-label">Result</span><span class="qs-value">${p.quickSummary.result}</span></div>
      </div>` : '';

    // Why it matters
    const whyHTML = p.whyItMatters ? `
      <div class="why-matters">
        <div class="why-matters-label">Why This Matters in Production</div>
        <div class="why-matters-text">${p.whyItMatters}</div>
      </div>` : '';

    // Operational Ownership
    const opsHTML = p.operationalOwnership ? `
      <div class="ops-ownership">
        <div class="ops-ownership-header">
          <span class="ops-badge ${p.operationalOwnership.recoveryValidated ? 'ops-badge-pass' : 'ops-badge-fail'}"></span>
          <span class="ops-ownership-label">Operational Ownership</span>
        </div>
        ${p.operationalBlurb ? `<div class="ops-blurb">${p.operationalBlurb}</div>` : ''}
        <div class="ops-items">
          <span class="ops-item"><strong>Uptime tested:</strong> ${p.operationalOwnership.uptimeSimulationHours}h</span>
          <span class="ops-item"><strong>Alerts:</strong> CPU ≥${p.operationalOwnership.alertThresholds.cpuPercent}% / Mem ≥${p.operationalOwnership.alertThresholds.memoryPercent}%</span>
          <span class="ops-item"><strong>SLA target:</strong> ${p.operationalOwnership.slaTarget}</span>
          <span class="ops-item"><strong>Recovery:</strong> ${p.operationalOwnership.recoveryValidated ? '✓ Validated' : '○ Pending'} (${p.operationalOwnership.failoverTests} tests)</span>
          <span class="ops-item"><a href="${p.operationalOwnership.runbookLink}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">Open runbook →</a></span>
        </div>
      </div>` : '';

    // Scaling
    const scalingHTML = (p.scaling) ? `
      <div class="scaling-section">
        <div class="scaling-label">Scaling Considerations</div>
        <ul class="scaling-items">
          <li>${p.scaling.horizontalScaling}</li>
          ${p.scaling.statelessDesign ? '<li>Stateless design — supports horizontal autoscaling</li>' : ''}
          ${p.scaling.dbBottleneck ? '<li>Database layer is current bottleneck</li>' : ''}
          ${p.scaling.recommendedNextSteps.map(s => `<li>Next: ${s}</li>`).join('')}
        </ul>
        ${p.scaling.capacityNote ? `<div class="scaling-note">${p.scaling.capacityNote}</div>` : ''}
      </div>` : '';

    // Tradeoffs
    const tradeoffHTML = (p.tradeoffs && p.tradeoffs.length) ? `
      <div class="tradeoffs-section">
        <div class="tradeoffs-label">Key Tradeoffs</div>
        <div class="tradeoff-cards">
          ${p.tradeoffs.map(t => `
            <div class="tradeoff-card">
              <div class="tradeoff-decision">${t.decision}</div>
              <div class="tradeoff-detail">
                <span class="tradeoff-choice">Chose: ${t.choice}</span>
                &nbsp;·&nbsp;
                <span class="tradeoff-alt">Alt: ${t.alternative}</span>
              </div>
              <div class="tradeoff-detail" style="margin-top:4px;font-size:10px;color:var(--muted);">${t.justification}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    // Engineering Practices
    const engHTML = (p.engineeringPractices && p.engineeringPractices.length) ? `
      <div class="eng-practices">
        <div class="eng-label">Engineering Practices</div>
        <ul class="eng-items">
          ${p.engineeringPractices.map(e => `<li>${e}</li>`).join('')}
        </ul>
      </div>` : '';

    // Interview Bridge
    const ibHTML = (p.interviewBridge && p.interviewBridge.length) ? `
      <div class="interview-bridge">
        <div class="ib-label">Ask me about</div>
        <div class="ib-topics">
          ${p.interviewBridge.map(t => `<span class="ib-topic">${t}</span>`).join('')}
        </div>
      </div>` : '';

    const metricsHTML = p.metrics.length ? `
      <div class="card-metrics">
        ${p.metrics.map((m, mi) => `
          ${mi > 0 ? '<div class="metric-divider"></div>' : ''}
          <div class="metric-item">
            <span class="metric-value">${m.value}</span>
            <span class="metric-label">${m.label}</span>
            <span class="metric-note">${m.note}</span>
          </div>`).join('')}
      </div>` : '';

    // Demo proof
    const demoHTML = (p.demo && p.demo.length) ? `
      <div class="demo-proof" data-demo="${p.id}">
        <div class="demo-proof-header">
          <span class="demo-proof-label">Live Proof</span>
          <span class="demo-proof-chevron">▶</span>
        </div>
        <div class="demo-proof-body">
          <div class="demo-proof-inner">
            ${p.demo.map(d => {
      if (d.type === 'gif') {
        return `<div class="demo-block">
                  <div class="demo-block-title">${d.title}</div>
                  <img src="${d.url}" alt="${d.title}" class="demo-gif" loading="lazy">
                </div>`;
      }
      return `<div class="demo-block">
                <div class="demo-block-title">${d.title}</div>
                <pre>${d.content}</pre>
              </div>`;
    }).join('')}
          </div>
        </div>
      </div>` : '';

    // Architecture preview
    const archPreviewHTML = (p.architectureDiagram && p.architectureSvg) ? `
      <div class="arch-preview" onclick="openModal('${p.id}')">
        ${p.architectureSvg}
        <div class="arch-preview-overlay">
          <span class="arch-preview-cta">View full architecture →</span>
        </div>
      </div>` : '';

    // Build links bar (at TOP)
    const archBtn = p.architectureDiagram
      ? `<button class="btn btn-ghost" onclick="openModal('${p.id}')">Architecture</button>`
      : '';
    const ghLink = p.github
      ? `<a href="${p.github}" class="card-link" target="_blank" rel="noopener">⌥ GitHub</a>`
      : '';
    const blogBtn = p.relatedBlogSlug
      ? `<a href="blog.html#${p.relatedBlogSlug}" class="btn-deepdive">Deep-Dive</a>`
      : '';
    const linkedInBtn = p.linkedInPost
      ? `<a href="${p.linkedInPost}" class="btn-deepdive" target="_blank" rel="noopener">↗ LinkedIn</a>`
      : '';
    const linksBar = `<div class="card-links-bar">${ghLink}${archBtn}${blogBtn}${linkedInBtn}</div>`;

    const item = document.createElement('div');
    item.className = 'pipeline-item';
    item.innerHTML = `
      <div class="p-rail">
        <div class="p-node live" data-id="${p.id}"></div>
        ${!isLast ? '<div class="p-seg"></div>' : ''}
      </div>
      <div class="project-card" data-id="${p.id}">
        <div class="card-top">
          <h3 class="card-title">${p.title}</h3>
          <span class="card-status s-live">● Live</span>
        </div>
        <div class="card-stack" style="margin-bottom:12px;">${stack}</div>
        ${linksBar}
        ${heroMetricsHTML}
        <div class="card-proved">"${p.whatIProved}"</div>
        ${qsHTML}

        <div class="see-more-btn" data-toggle="${p.id}">
          <span class="see-more-chevron">▶</span> See full project details
        </div>
        <div class="card-expandable" id="expand-${p.id}">
          ${whyHTML}
          ${opsHTML}
          <div class="card-desc">${p.description}</div>
          <ul class="card-highlights">${highlights}</ul>
          ${metricsHTML}
          ${scalingHTML}
          ${tradeoffHTML}
          ${archPreviewHTML}
          ${demoHTML}
          ${engHTML}
          ${ibHTML}
        </div>
      </div>`;
    liveList.appendChild(item);
  });

  // ── Render COMING SOON projects as accordions ─────────────
  phases.forEach(phase => {
    const group = comingSoonProjects.filter(p => p.phase === phase.id);
    if (!group.length) return;

    const groupEl = document.createElement('div');
    groupEl.className = `phase-group ${phase.cls}`;
    groupEl.innerHTML = `
      <div class="phase-header">
        <span class="phase-badge">${phase.label} — Coming Soon</span>
        <div class="phase-line"></div>
      </div>
      <div id="cs-${phase.id}"></div>`;
    root.appendChild(groupEl);

    const csRoot = groupEl.querySelector(`#cs-${phase.id}`);

    group.forEach(p => {
      const stack = p.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');
      const highlights = p.highlights.map(h => `<li>${h}</li>`).join('');

      const card = document.createElement('div');
      card.className = 'coming-soon-card';
      card.innerHTML = `
        <div class="coming-soon-header">
          <div class="coming-soon-header-left">
            <span class="card-status s-soon">○</span>
            <span class="coming-soon-title">${p.title}</span>
            <div class="coming-soon-stack">${stack}</div>
          </div>
          <span class="coming-soon-chevron">▶</span>
        </div>
        <div class="coming-soon-body">
          <div class="coming-soon-body-inner">
            <div class="card-proved" style="margin-bottom:12px;">"${p.whatIProved}"</div>
            <div class="card-desc" style="margin-bottom:12px;">${p.description}</div>
            <ul class="card-highlights">${highlights}</ul>
          </div>
        </div>`;

      card.querySelector('.coming-soon-header').addEventListener('click', () => {
        card.classList.toggle('open');
      });
      csRoot.appendChild(card);
    });
  });

  /* ── Render war stories ─────────────────────────────────── */
  const incRoot = document.getElementById('incidents-root');
  // Use same order as live projects (P3 → P2 → P1)
  const incProjects = liveProjects.filter(p => p.warStory);
  const incTagCls = { p1: 'inc-p1', p2: 'inc-p2', p3: 'inc-p3' };

  incProjects.forEach(p => {
    const ws = p.warStory;
    const sevCls = { High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' };

    const impactHTML = ws.impact ? `
      <div class="inc-field full">
        <span class="inc-field-label">Impact</span>
        <div class="inc-impact">${ws.impact}</div>
        ${ws.severity ? `<span class="inc-severity ${sevCls[ws.severity] || 'sev-medium'}">${ws.severity}</span>` : ''}
        ${ws.customerImpact ? `<div style="font-size:12px;color:var(--muted);margin-top:6px;font-style:italic;">Customer view: ${ws.customerImpact}</div>` : ''}
      </div>` : '';

    const runbookHTML = (ws.runbook && ws.runbook.length) ? `
      <div class="inc-field full">
        <span class="inc-field-label">3 AM Runbook Steps <span style="font-size:8px;opacity:0.5;">(click to copy)</span></span>
        <ol class="inc-runbook">
          ${ws.runbook.map(step => `<li onclick="copyText('${step.replace(/'/g, "\\'")}')">${step}</li>`).join('')}
        </ol>
      </div>` : '';

    const card = document.createElement('div');
    card.className = 'incident-card';
    card.innerHTML = `
      <div class="incident-header">
        <div class="incident-meta">
          <span class="incident-tag ${incTagCls[p.id] || 'inc-p1'}">${p.id.toUpperCase()}</span>
          <span class="incident-title">${ws.title}</span>
        </div>
        <span class="incident-chevron">▶</span>
      </div>
      <div class="incident-body">
        <div class="incident-body-inner">
          <div class="inc-field what full">
            <span class="inc-field-label">What Happened</span>
            <span class="inc-field-value">${ws.what}</span>
          </div>
          ${impactHTML}
          <div class="inc-field">
            <span class="inc-field-label">Symptoms</span>
            <span class="inc-field-value">${ws.symptoms}</span>
          </div>
          <div class="inc-field">
            <span class="inc-field-label">Root Cause</span>
            <span class="inc-field-value">${ws.rootCause}</span>
          </div>
          <div class="inc-field fix">
            <span class="inc-field-label">Fix Applied</span>
            <span class="inc-field-value">${ws.fix}</span>
          </div>
          <div class="inc-field prev">
            <span class="inc-field-label">Prevention Added</span>
            <span class="inc-field-value">${ws.prevention}</span>
          </div>
          ${runbookHTML}
        </div>
      </div>`;

    card.querySelector('.incident-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });
    incRoot.appendChild(card);
  });

  /* ── Scroll-triggered pipeline animation ─────────────────── */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      card.classList.add('visible');
      const thisItem = card.closest('.pipeline-item');
      if (thisItem) {
        const prev = thisItem.previousElementSibling;
        if (prev) {
          const seg = prev.querySelector('.p-seg');
          if (seg) setTimeout(() => seg.classList.add('filled'), 250);
        }
      }
      observer.unobserve(card);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.project-card').forEach(c => observer.observe(c));

  /* ── Demo proof toggle ──────────────────────────────────── */
  document.querySelectorAll('.demo-proof-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.demo-proof').classList.toggle('open');
    });
  });

  /* ── See more toggle ────────────────────────────────────── */
  document.querySelectorAll('.see-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggle;
      const expandable = document.getElementById(`expand-${id}`);
      expandable.classList.toggle('open');
      btn.classList.toggle('open');
      btn.innerHTML = btn.classList.contains('open')
        ? '<span class="see-more-chevron" style="transform:rotate(90deg)">▶</span> Show less'
        : '<span class="see-more-chevron">▶</span> See full project details';
    });
  });
}

/* ── Architecture modal ───────────────────────────────────── */
function openModal(projectId) {
  const p = PROJECT_DATA[projectId];
  if (!p || !p.architectureSvg) return;
  document.getElementById('modal-title').textContent = p.title + ' — Architecture';
  document.getElementById('modal-diagram').innerHTML = p.architectureSvg;
  document.getElementById('modal-note').textContent = p.architectureNote || '';
  document.getElementById('arch-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('arch-modal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('arch-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

/* ── Global Escape key ────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeResume();
    document.getElementById('nav-links').classList.remove('open');
  }
});

/* ── Latest blog posts ────────────────────────────────────── */
async function loadLatestPosts() {
  try {
    const res = await fetch('data/blog.json');
    if (!res.ok) throw new Error();
    const posts = await res.json();
    const latest = posts.slice(0, 2);
    const root = document.getElementById('posts-root');

    latest.forEach(post => {
      const dateStr = new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const card = document.createElement('a');
      card.className = 'post-card';
      card.href = `blog.html#${post.slug}`;
      card.innerHTML = `
        <div class="post-card-date">${dateStr}</div>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <span class="post-card-link">Read full post →</span>`;
      root.appendChild(card);
    });
  } catch {
    // Blog posts optional
  }
}

/* ── Hamburger toggle + mobile menu fix ───────────────────── */
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('nav-links').classList.remove('open');
  });
});


/* ── Boot ─────────────────────────────────────────────────── */
init();
loadLatestPosts();