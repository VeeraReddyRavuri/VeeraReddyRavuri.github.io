import { openArchModal } from './modals.js';

const PROJECT_DATA = new Map();

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function getProjectData(id) {
  return PROJECT_DATA.get(id);
}

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

function makeGearSVG(size) {
  return `<svg class="pipeline-gear" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="var(--accent)"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function buildGearConnector(gearCount) {
  let baseSize;
  if (gearCount >= 3) baseSize = 14;
  else if (gearCount === 2) baseSize = 16;
  else baseSize = 18;

  let gearsHTML = '';
  for (let i = 0; i < gearCount; i++) {
    const size = baseSize + (i * 4);
    gearsHTML += makeGearSVG(size);
  }
  return gearsHTML;
}

export async function initProjects() {
  let projects;
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error();
    projects = await res.json();
  } catch {
    const root = document.getElementById('projects-root');
    if (root) {
      const errorEl = document.createElement('div');
      errorEl.className = 'projects-error';
      errorEl.innerHTML = `Preview requires a local server.<br>Run: <strong>python3 -m http.server</strong> then open <strong>http://localhost:8000</strong>`;
      root.appendChild(errorEl);
    }
    return;
  }

  // Store project data for modal access
  projects.forEach(p => { PROJECT_DATA.set(p.id, p); });

  // Separate projects by status
  const liveProjects = projects.filter(p => p.status === 'live');
  const nonLiveProjects = projects.filter(p => p.status === 'coming-soon' || p.status === 'in-progress');

  // Sort by displayOrder (lower = first)
  liveProjects.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
  nonLiveProjects.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));

  const root = document.getElementById('projects-root');
  if (!root) return;

  // ── Render "currently building" indicator ──────────────────
  const inProgress = projects.find(p => p.status === 'in-progress');
  if (inProgress) {
    const heroContainer = document.querySelector('.hero-inner');
    if (heroContainer) {
      const heroCtasEl = heroContainer.querySelector('.hero-ctas');
      if (heroCtasEl) {
        const hcb = document.createElement('div');
        hcb.className = 'hero-currently-building';
        hcb.innerHTML = `<div class="hcb-pulse"></div><strong>Currently building:</strong> ${sanitize(inProgress.title)}`;
        heroContainer.insertBefore(hcb, heroCtasEl);
      }
    }
    const latestPostsSection = document.getElementById('latest-posts');
    if (latestPostsSection) {
      const sectionTitle = latestPostsSection.querySelector('.section-title');
      if (sectionTitle) {
        const cb = document.createElement('div');
        cb.className = 'currently-building';
        cb.innerHTML = `<div class="pulse"></div>Currently building: ${sanitize(inProgress.title)}`;
        sectionTitle.insertAdjacentElement('afterend', cb);
      }
    }
  }

  // ── Render LIVE projects ───────────────────────────────────
  const liveGroup = document.createElement('div');
  liveGroup.className = 'phase-group p1';

  const liveHeader = document.createElement('div');
  liveHeader.className = 'phase-header';
  liveHeader.innerHTML = `<span class="phase-badge">Live Projects</span><div class="phase-line"></div>`;
  liveGroup.appendChild(liveHeader);

  const liveList = document.createElement('div');
  liveList.className = 'pipeline-list';
  liveGroup.appendChild(liveList);
  root.appendChild(liveGroup);

  liveProjects.forEach((p, i) => {
    const isLast = i === liveProjects.length - 1;
    const highlights = p.highlights.map(h => `<li>${sanitize(h)}</li>`).join('');
    const stack = p.stack.map(s => `<span class="stack-tag">${sanitize(s)}</span>`).join('');

    // Hero metrics badges
    const heroMetricsHTML = (p.heroMetrics && p.heroMetrics.length) ? `
      <div class="hero-metrics">
        ${p.heroMetrics.map(m => {
          const numericMatch = m.value.match(/^([\d.]+)(%?)$/);
          const dataAttrs = numericMatch
            ? ` data-count-to="${numericMatch[1]}" data-suffix="${numericMatch[2]}"`
            : '';
          return `<div class="hero-metric-badge">
            <span class="hero-metric-val"${dataAttrs}>${sanitize(m.value)}</span>
            <span class="hero-metric-lbl">${sanitize(m.label)}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    // Quick summary
    const qsHTML = p.quickSummary ? `
      <div class="quick-summary">
        <div class="qs-item"><span class="qs-label">Problem</span><span class="qs-value">${sanitize(p.quickSummary.problem)}</span></div>
        <div class="qs-item"><span class="qs-label">Solution</span><span class="qs-value">${sanitize(p.quickSummary.solution)}</span></div>
        <div class="qs-item"><span class="qs-label">Key Challenge</span><span class="qs-value">${sanitize(p.quickSummary.keyChallenge)}</span></div>
        <div class="qs-item"><span class="qs-label">Result</span><span class="qs-value">${sanitize(p.quickSummary.result)}</span></div>
      </div>` : '';

    // Why it matters
    const whyHTML = p.whyItMatters ? `
      <div class="why-matters">
        <div class="why-matters-label">Why This Matters in Production</div>
        <div class="why-matters-text">${sanitize(p.whyItMatters)}</div>
      </div>` : '';

    // Operational Ownership
    const opsHTML = p.operationalOwnership ? `
      <div class="ops-ownership">
        <div class="ops-ownership-header">
          <span class="ops-badge ${p.operationalOwnership.recoveryValidated ? 'ops-badge-pass' : 'ops-badge-fail'}"></span>
          <span class="ops-ownership-label">Operational Ownership</span>
        </div>
        ${p.operationalBlurb ? `<div class="ops-blurb">${sanitize(p.operationalBlurb)}</div>` : ''}
        <div class="ops-items">
          <span class="ops-item"><strong>Uptime tested:</strong> ${sanitize(String(p.operationalOwnership.uptimeSimulationHours))}h</span>
          <span class="ops-item"><strong>Alerts:</strong> CPU ≥${sanitize(String(p.operationalOwnership.alertThresholds.cpuPercent))}% / Mem ≥${sanitize(String(p.operationalOwnership.alertThresholds.memoryPercent))}%</span>
          <span class="ops-item"><strong>SLA target:</strong> ${sanitize(p.operationalOwnership.slaTarget)}</span>
          <span class="ops-item"><strong>Recovery:</strong> ${p.operationalOwnership.recoveryValidated ? '✓ Validated' : '○ Pending'} (${sanitize(String(p.operationalOwnership.failoverTests))} tests)</span>
          <span class="ops-item"><a href="${sanitize(p.operationalOwnership.runbookLink)}" target="_blank" rel="noopener">Open runbook →</a></span>
        </div>
      </div>` : '';

    // War story teaser inside card
    const warStoryTeaser = p.warStory ? (() => {
      const ws = p.warStory;
      const blogLink = p.relatedBlogSlug
        ? `<a href="blog.html#${sanitize(p.relatedBlogSlug)}" class="card-link">Read post →</a>`
        : '';
      const sevCls = { High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' };
      return `
        <div class="war-story-teaser">
          <div class="war-story-teaser-header">
            <span class="war-story-teaser-icon">⚡</span>
            <span class="war-story-teaser-label">War Story</span>
            ${ws.severity ? `<span class="inc-severity ${sevCls[ws.severity] || 'sev-medium'}">${sanitize(ws.severity)}</span>` : ''}
          </div>
          <div class="war-story-teaser-title">${sanitize(ws.title)}</div>
          <div class="war-story-teaser-root">${sanitize(ws.rootCause)}</div>
          ${blogLink}
        </div>`;
    })() : '';

    // Scaling
    const scalingHTML = p.scaling ? `
      <div class="scaling-section">
        <div class="scaling-label">Scaling Considerations</div>
        <ul class="scaling-items">
          <li>${sanitize(p.scaling.horizontalScaling)}</li>
          ${p.scaling.statelessDesign ? '<li>Stateless design — supports horizontal autoscaling</li>' : ''}
          ${p.scaling.dbBottleneck ? '<li>Database layer is current bottleneck</li>' : ''}
          ${p.scaling.recommendedNextSteps.map(s => `<li>Next: ${sanitize(s)}</li>`).join('')}
        </ul>
        ${p.scaling.capacityNote ? `<div class="scaling-note">${sanitize(p.scaling.capacityNote)}</div>` : ''}
      </div>` : '';

    // Tradeoffs
    const tradeoffHTML = (p.tradeoffs && p.tradeoffs.length) ? `
      <div class="tradeoffs-section">
        <div class="tradeoffs-label">Key Tradeoffs</div>
        <div class="tradeoff-cards">
          ${p.tradeoffs.map(t => `
            <div class="tradeoff-card">
              <div class="tradeoff-decision">${sanitize(t.decision)}</div>
              <div class="tradeoff-detail">
                <span class="tradeoff-choice">Chose: ${sanitize(t.choice)}</span>
                &nbsp;·&nbsp;
                <span class="tradeoff-alt">Alt: ${sanitize(t.alternative)}</span>
              </div>
              <div class="tradeoff-justification">${sanitize(t.justification)}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    // Engineering Practices
    const engHTML = (p.engineeringPractices && p.engineeringPractices.length) ? `
      <div class="eng-practices">
        <div class="eng-label">Engineering Practices</div>
        <ul class="eng-items">
          ${p.engineeringPractices.map(e => `<li>${sanitize(e)}</li>`).join('')}
        </ul>
      </div>` : '';

    // Interview Bridge
    const ibHTML = (p.interviewBridge && p.interviewBridge.length) ? `
      <div class="interview-bridge">
        <div class="ib-label">Ask me about</div>
        <div class="ib-topics">
          ${p.interviewBridge.map(t => `<span class="ib-topic">${sanitize(t)}</span>`).join('')}
        </div>
      </div>` : '';

    const metricsHTML = p.metrics.length ? `
      <div class="card-metrics">
        ${p.metrics.map((m, mi) => `
          ${mi > 0 ? '<div class="metric-divider"></div>' : ''}
          <div class="metric-item">
            <span class="metric-value">${sanitize(m.value)}</span>
            <span class="metric-label">${sanitize(m.label)}</span>
            <span class="metric-note">${sanitize(m.note)}</span>
          </div>`).join('')}
      </div>` : '';

    // Demo proof
    const demoHTML = (p.demo && p.demo.length) ? `
      <div class="demo-proof" data-demo="${sanitize(p.id)}">
        <div class="demo-proof-header">
          <span class="demo-proof-label">Live Proof</span>
          <span class="demo-proof-chevron">▶</span>
        </div>
        <div class="demo-proof-body">
          <div class="demo-proof-inner">
            ${p.demo.map(d => {
              if (d.type === 'gif') {
                return `<div class="demo-block">
                  <div class="demo-block-title">${sanitize(d.title)}</div>
                  <img src="${sanitize(d.url)}" alt="${sanitize(d.title)}" class="demo-gif" loading="lazy">
                </div>`;
              }
              return `<div class="demo-block">
                <div class="demo-block-title">${sanitize(d.title)}</div>
                <pre>${d.content}</pre>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : '';

    // Architecture preview
    const archPreviewHTML = (p.architectureDiagram && p.architectureSvg) ? `
      <div class="arch-preview" data-arch-id="${sanitize(p.id)}">
        ${p.architectureSvg}
        <div class="arch-preview-overlay">
          <span class="arch-preview-cta">View full architecture →</span>
        </div>
      </div>` : '';

    // Links bar — no project ID numbers in rendered output
    const archBtn = p.architectureDiagram
      ? `<button class="btn btn-ghost" data-arch-btn="${sanitize(p.id)}" aria-label="View architecture diagram">Architecture</button>`
      : '';
    const ghLink = p.github
      ? `<a href="${sanitize(p.github)}" class="card-link" target="_blank" rel="noopener">⌥ GitHub</a>`
      : '';
    const blogBtn = p.relatedBlogSlug
      ? `<a href="blog.html#${sanitize(p.relatedBlogSlug)}" class="btn-deepdive">Deep-Dive</a>`
      : '';
    const linkedInBtn = p.linkedInPost
      ? `<a href="${sanitize(p.linkedInPost)}" class="btn-deepdive" target="_blank" rel="noopener">↗ LinkedIn</a>`
      : '';
    const linksBar = `<div class="card-links-bar">${ghLink}${archBtn}${blogBtn}${linkedInBtn}</div>`;

    const item = document.createElement('div');
    item.className = 'pipeline-item';

    const cardEl = document.createElement('div');
    cardEl.className = 'project-card';
    cardEl.dataset.id = p.id;

    // Use <details> for expandable content
    cardEl.innerHTML = `
      <div class="card-top">
        <h3 class="card-title">${sanitize(p.title)}</h3>
        <span class="card-status s-live">● Live</span>
      </div>
      <div class="card-stack card-stack--compact">${stack}</div>
      <div class="card-proved">"${sanitize(p.whatIProved)}"</div>
      ${heroMetricsHTML}
      ${linksBar}
      <details class="card-details">
        <summary class="see-more-btn">
          <span class="see-more-chevron">▶</span> See full details
        </summary>
        <div class="details-content">
          ${qsHTML}
          ${whyHTML}
          ${opsHTML}
          ${warStoryTeaser}
          <div class="card-desc">${sanitize(p.description)}</div>
          <ul class="card-highlights">${highlights}</ul>
          ${metricsHTML}
          ${scalingHTML}
          ${tradeoffHTML}
          ${archPreviewHTML}
          ${demoHTML}
          ${engHTML}
          ${ibHTML}
        </div>
      </details>`;

    // Build rail with gear connector
    const gearHTML = !isLast ? `<div class="p-gear-connector">${buildGearConnector(liveProjects.length - i)}</div>` : '';
    const railHTML = `
      <div class="p-rail">
        <div class="p-node live" data-id="${sanitize(p.id)}"></div>
        ${!isLast ? `<div class="p-seg"></div>${gearHTML}` : ''}
      </div>`;

    item.innerHTML = railHTML;
    item.appendChild(cardEl);
    liveList.appendChild(item);
  });

  // ── Render ENGINEERING ROADMAP (non-live projects) ─────────
  if (nonLiveProjects.length > 0) {
    const roadmapSection = document.createElement('div');
    roadmapSection.className = 'roadmap-section';

    const roadmapHeader = document.createElement('div');
    roadmapHeader.innerHTML = `
      <div class="section-label">// what's next</div>
      <div class="section-title">Engineering Roadmap</div>`;
    roadmapSection.appendChild(roadmapHeader);

    const strip = document.createElement('div');
    strip.className = 'roadmap-strip';

    nonLiveProjects.forEach(p => {
      const isBuilding = p.status === 'in-progress';
      const chip = document.createElement('details');
      chip.className = `roadmap-chip ${isBuilding ? 'roadmap-chip--building' : ''}`;
      const firstSentence = p.description ? p.description.split('. ')[0] + '.' : '';
      const chipStack = p.stack.map(s => `<span class="stack-tag">${sanitize(s)}</span>`).join('');

      chip.innerHTML = `
        <summary class="roadmap-chip-header">
          <div class="roadmap-chip-status">
            <span class="roadmap-dot ${isBuilding ? 'roadmap-dot--building' : ''}"></span>
            <span class="roadmap-chip-label">${isBuilding ? 'Building now' : 'Planned'}</span>
          </div>
          <div class="roadmap-chip-title">${sanitize(p.title)}</div>
          <div class="roadmap-chip-proved">"${sanitize(p.whatIProved)}"</div>
        </summary>
        <div class="roadmap-chip-body">
          <div class="roadmap-chip-stack">${chipStack}</div>
          <div class="roadmap-chip-desc">${sanitize(firstSentence)}</div>
        </div>`;

      strip.appendChild(chip);
    });

    roadmapSection.appendChild(strip);
    root.appendChild(roadmapSection);
  }

  // ── Render war stories ─────────────────────────────────────
  const incRoot = document.getElementById('incidents-root');
  if (incRoot) {
    const incProjects = liveProjects.filter(p => p.warStory);

    incProjects.forEach(p => {
      const ws = p.warStory;
      const sevCls = { High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' };

      // No project ID numbers — use project title as tag
      const impactHTML = ws.impact ? `
        <div class="inc-field full">
          <span class="inc-field-label">Impact</span>
          <div class="inc-impact">${sanitize(ws.impact)}</div>
          ${ws.severity ? `<span class="inc-severity ${sevCls[ws.severity] || 'sev-medium'}">${sanitize(ws.severity)}</span>` : ''}
          ${ws.customerImpact ? `<div class="inc-customer-impact">Customer view: ${sanitize(ws.customerImpact)}</div>` : ''}
        </div>` : '';

      const runbookHTML = (ws.runbook && ws.runbook.length) ? `
        <div class="inc-field full">
          <span class="inc-field-label">3 AM Runbook Steps <span class="inc-runbook-hint">(click to copy)</span></span>
          <ol class="inc-runbook">
            ${ws.runbook.map(step => `<li><button class="runbook-copy-btn" aria-label="Copy step to clipboard" data-copy="${sanitize(step)}">${sanitize(step)}</button></li>`).join('')}
          </ol>
        </div>` : '';

      // Blog post link at the bottom if relatedBlogSlug is set
      const blogLinkHTML = p.relatedBlogSlug
        ? `<div class="inc-field full"><a href="blog.html#${sanitize(p.relatedBlogSlug)}" class="card-link">Read full post →</a></div>`
        : '';

      const card = document.createElement('details');
      card.className = 'incident-card';
      card.innerHTML = `
        <summary class="incident-header">
          <div class="incident-meta">
            <span class="incident-tag">${sanitize(p.title)}</span>
            <span class="incident-title">${sanitize(ws.title)}</span>
          </div>
          <span class="incident-chevron">▶</span>
        </summary>
        <div class="incident-body">
          <div class="incident-body-inner">
            <div class="inc-field what full">
              <span class="inc-field-label">What Happened</span>
              <span class="inc-field-value">${sanitize(ws.what)}</span>
            </div>
            ${impactHTML}
            <div class="inc-field">
              <span class="inc-field-label">Symptoms</span>
              <span class="inc-field-value">${sanitize(ws.symptoms)}</span>
            </div>
            <div class="inc-field">
              <span class="inc-field-label">Root Cause</span>
              <span class="inc-field-value">${sanitize(ws.rootCause)}</span>
            </div>
            <div class="inc-field fix">
              <span class="inc-field-label">Fix Applied</span>
              <span class="inc-field-value">${sanitize(ws.fix)}</span>
            </div>
            <div class="inc-field prev">
              <span class="inc-field-label">Prevention Added</span>
              <span class="inc-field-value">${sanitize(ws.prevention)}</span>
            </div>
            ${runbookHTML}
            ${blogLinkHTML}
          </div>
        </div>`;

      incRoot.appendChild(card);
    });

    // "All War Stories →" link
    const warStoryCta = document.createElement('div');
    warStoryCta.className = 'blog-cta-wrap';
    warStoryCta.innerHTML = `<a href="blog.html?tag=war-story" class="btn btn-outline">All War Stories →</a>`;
    incRoot.insertAdjacentElement('afterend', warStoryCta);

    // Runbook copy buttons
    incRoot.addEventListener('click', e => {
      const btn = e.target.closest('.runbook-copy-btn');
      if (btn) {
        e.stopPropagation();
        copyText(btn.dataset.copy);
      }
    });
  }

  // ── Demo proof toggle ──────────────────────────────────────
  document.querySelectorAll('.demo-proof-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.demo-proof').classList.toggle('open');
    });
  });

  // ── Architecture buttons ───────────────────────────────────
  document.querySelectorAll('[data-arch-btn]').forEach(btn => {
    btn.addEventListener('click', () => openArchModal(btn.dataset.archBtn));
  });

  document.querySelectorAll('[data-arch-id]').forEach(preview => {
    preview.addEventListener('click', () => openArchModal(preview.dataset.archId));
  });
}
