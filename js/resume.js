// ── Resume markdown parser and renderer ─────────────────────

function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: md };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  });
  return { meta, body: match[2] };
}

function renderHeader(meta) {
  return `
    <div class="resume-header">
      <div class="resume-header-left">
        <h1 class="resume-name">${meta.name || ''}</h1>
        <div class="resume-title">${meta.title || ''}</div>
        <div class="resume-location">${meta.location || ''}</div>
      </div>
      <div class="resume-header-right">
        ${meta.phone ? `<span class="resume-contact-item">${meta.phone}</span>` : ''}
        ${meta.email ? `<a href="mailto:${meta.email}" class="resume-contact-item resume-contact-link">${meta.email}</a>` : ''}
        ${meta.linkedin ? `<a href="${meta.linkedin}" target="_blank" rel="noopener" class="resume-contact-item resume-contact-link">LinkedIn ↗</a>` : ''}
        ${meta.github ? `<a href="${meta.github}" target="_blank" rel="noopener" class="resume-contact-item resume-contact-link">GitHub ↗</a>` : ''}
        ${meta.portfolio ? `<a href="${meta.portfolio}" target="_blank" rel="noopener" class="resume-contact-item resume-contact-link">Portfolio ↗</a>` : ''}
      </div>
    </div>`;
}

function renderBody(body) {
  const lines = body.split('\n');
  let html = '';
  let inSection = false;
  let inSubsection = false;
  let inBullets = false;
  let inSkills = false;
  let inImpacts = false;
  let inCerts = false;

  function closeBullets() {
    if (inBullets) { html += '</ul>'; inBullets = false; }
  }

  function closeSubsection() {
    closeBullets();
    if (inSubsection) { html += '</div>'; inSubsection = false; }
  }

  function closeSection() {
    closeSubsection();
    if (inImpacts) { html += '</div>'; inImpacts = false; }
    if (inSection) { html += '</div>'; inSection = false; inSkills = false; inCerts = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();


    // ## Section header
    if (trimmed.startsWith('## ')) {
      closeSection();
      const title = trimmed.slice(3);
      inSkills = title === 'Skills';
      inImpacts = title === 'Key Impacts';
      inCerts = title === 'Certifications';
      html += `<div class="resume-section">
        <div class="resume-section-title">
          <span class="section-label">// ${title.toLowerCase()}</span>
        </div>`;
      if (inImpacts) html += '<div class="resume-impact-grid">';
      inSection = true;
      continue;
    }

    // ### Subsection header (no link)
    if (trimmed.startsWith('### ')) {
      closeSubsection();
      const title = trimmed.slice(4);
      html += `<div class="resume-subsection">
        <div class="resume-sub-header">
          <h3 class="resume-sub-title">${title}</h3>
        </div>`;
      inSubsection = true;
      continue;
    }

    // Backtick stack line
    if (/^`[^`]+`$/.test(trimmed)) {
      const stack = trimmed.slice(1, -1);
      const tags = stack.split(' · ').map(t => `<span class="stack-tag">${t.trim()}</span>`).join('');
      html += `<div class="resume-stack">${tags}</div>`;
      continue;
    }

    // **Label:** value or **Label**: value — skill row (only inside Skills section)
    if (/^\*\*[^*:]+:?\*\*:?\s/.test(trimmed) && inSkills) {
      const match = trimmed.match(/^\*\*([^*]+?):\*\*\s*(.+)$/) ||
                    trimmed.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
      if (match) {
        html += `<div class="resume-skill-row">
          <span class="resume-skill-label">${match[1]}</span>
          <span class="resume-skill-value">${match[2]}</span>
        </div>`;
      }
      continue;
    }

    // **text** · text · text — metadata line (company, date)
    if (/^\*\*[^*]+\*\*/.test(trimmed) && !inSkills) {
      const rendered = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html += `<div class="resume-meta">${rendered}</div>`;
      continue;
    }

    // *italic* — client/subtitle line
    if (/^\*[^*]+\*$/.test(trimmed)) {
      html += `<div class="resume-subtitle">${trimmed.slice(1, -1)}</div>`;
      continue;
    }

    // Bullet point
    if (trimmed.startsWith('- ')) {
      if (inImpacts) {
        // Render as impact card — split on ' — '
        const content = trimmed.slice(2);
        const sepIdx = content.indexOf(' — ');
        if (sepIdx !== -1) {
          const metric = content.slice(0, sepIdx).trim();
          const desc = content.slice(sepIdx + 3).trim();
          html += `<div class="resume-impact-card">
            <div class="resume-impact-metric">${metric}</div>
            <div class="resume-impact-desc">${desc}</div>
          </div>`;
        } else {
          html += `<div class="resume-impact-card"><div class="resume-impact-desc">${content}</div></div>`;
        }
        continue;
      }
      if (inCerts) {
        const content = trimmed.slice(2);
        // Parse status token
        const statusMatch = content.match(/^\[(earned|progress)\]\s*(.+)$/);
        const status = statusMatch ? statusMatch[1] : 'earned';
        const rest = statusMatch ? statusMatch[2] : content;

        // Split on | to get name, issuer, date
        const parts = rest.split('|').map(s => s.trim());
        const name = parts[0] || '';
        const issuer = parts[1] || '';
        const date = parts[2] || '';

        const statusClass = status === 'earned' ? 'cert-status--earned' : 'cert-status--progress';
        const statusLabel = status === 'earned' ? '✓ earned' : '◌ in progress';

        html += `<div class="resume-cert-row ${statusClass}">
          <div class="resume-cert-name">${name}</div>
          <div class="resume-cert-meta">
            <span class="resume-cert-issuer">${issuer}</span>
            <span class="resume-cert-date">${date}</span>
            <span class="resume-cert-badge">${statusLabel}</span>
          </div>
        </div>`;
        continue;
      }
      if (!inBullets) { html += '<ul class="resume-bullets">'; inBullets = true; }
      html += `<li>${trimmed.slice(2)}</li>`;
      continue;
    }

    // Empty line
    if (trimmed === '') {
      closeBullets();
      continue;
    }

    // Paragraph
    closeBullets();
    html += `<p class="resume-para">${trimmed}</p>`;
  }

  closeSection();
  return html;
}

export async function initResume() {
  const root = document.getElementById('resume-root');
  if (!root) return;

  try {
    const res = await fetch('resume.md');
    if (!res.ok) throw new Error(`${res.status}`);
    const md = await res.text();
    const { meta, body } = parseFrontmatter(md);
    root.innerHTML = renderHeader(meta) + renderBody(body);
  } catch (err) {
    console.error('[resume] Failed to load resume.md:', err);
    root.innerHTML = `<div class="resume-error">
      Could not load resume. Run a local server:<br>
      <strong>python3 -m http.server</strong>
    </div>`;
  }
}
