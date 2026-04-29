// ── Frontmatter parser ───────────────────────────────────────
function parseFrontmatter(mdString) {
  const match = mdString.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: mdString };

  const metaBlock = match[1];
  const content = match[2];
  const meta = {};

  metaBlock.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch { /* leave as string */ }
    }

    meta[key] = value;
  });

  return { meta, content };
}

// ── Markdown parser ──────────────────────────────────────────
function parseMarkdown(mdString) {
  let html = mdString;

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
    return `${langLabel}<pre><code class="lang-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy">');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Table parsing — proper thead/tbody structure
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return tableBlock;

    // Identify separator row (e.g. |---|---|)
    const sepIndex = rows.findIndex(r => /^\|[\s\-:|]+\|$/.test(r));
    if (sepIndex === -1) return tableBlock;

    // Header rows = everything before separator
    const headerRows = rows.slice(0, sepIndex);
    // Data rows = everything after separator
    const dataRows = rows.slice(sepIndex + 1);

    function parseRow(row, tag) {
      const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    }

    const thead = headerRows.length
      ? '<thead>' + headerRows.map(r => parseRow(r, 'th')).join('') + '</thead>'
      : '';

    const tbody = dataRows.length
      ? '<tbody>' + dataRows.map(r => parseRow(r, 'td')).join('') + '</tbody>'
      : '';

    return `<table>${thead}${tbody}</table>`;
  });

  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-done">$1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task-pending">$1</li>');

  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
    if (match.includes('<ol>')) return match;
    return `<ul>${match}</ul>`;
  });

  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  html = html.replace(/<p><(h[1-3]|pre|hr|tr|table|ul|ol|blockquote|span class="code-lang")/g, '<$1');
  html = html.replace(/<\/(h[1-3]|pre|hr|tr|table|ul|ol|blockquote)><\/p>/g, '</$1>');
  html = html.replace(/<p><\/p>/g, '');

  return html;
}

// ── Blog previews for index.html ─────────────────────────────
export async function initBlogPreviews() {
  const root = document.getElementById('posts-root');
  if (!root) return;

  try {
    const indexRes = await fetch('posts/index.json');
    if (!indexRes.ok) throw new Error();
    const slugs = await indexRes.json();
    const previewSlugs = slugs.slice(0, 3);

    for (const slug of previewSlugs) {
      const mdRes = await fetch(`posts/${slug}.md`);
      if (!mdRes.ok) continue;
      const mdText = await mdRes.text();
      const { meta } = parseFrontmatter(mdText);
      const wordCount = (meta.excerpt || '').split(/\s+/).length + 200;
      const readTime = Math.ceil(wordCount / 200);

      const dateStr = new Date(meta.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const item = document.createElement('a');
      item.className = 'blog-strip-item';
      item.href = `blog.html#${slug}`;
      item.innerHTML = `
        <span class="blog-strip-title">${meta.title || slug}</span>
        <span class="blog-strip-meta">${dateStr} · ${readTime} min</span>`;
      root.appendChild(item);
    }
  } catch (err) {
    console.error('[blog] initBlogPreviews failed:', err);
  }
}

// ── Full blog page ───────────────────────────────────────────
export async function initBlogPage() {
  let slugs = [];
  const postCache = new Map();
  let allTags = new Set();
  let activeTag = 'All';

  try {
    const indexRes = await fetch('posts/index.json');
    if (!indexRes.ok) throw new Error();
    slugs = await indexRes.json();

    for (const slug of slugs) {
      const mdRes = await fetch(`posts/${slug}.md`);
      if (!mdRes.ok) continue;
      const mdText = await mdRes.text();
      const { meta, content } = parseFrontmatter(mdText);
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);
      const tags = meta.tags || [];
      tags.forEach(t => allTags.add(t));
      postCache.set(slug, { slug, meta, content, readTime, tags });
    }
  } catch (err) {
    const blogList = document.getElementById('blog-list');
    if (blogList) {
      const errorEl = document.createElement('div');
      errorEl.className = 'blog-error';
      errorEl.innerHTML = `Could not load blog posts. Run a local server:<br><strong>python3 -m http.server</strong>`;
      blogList.appendChild(errorEl);
    }
    console.error('[blog] initBlogPage failed:', err);
    return;
  }

  // Check for tag query param (e.g. from "All War Stories →" link)
  const params = new URLSearchParams(window.location.search);
  const tagParam = params.get('tag');
  if (tagParam) {
    activeTag = tagParam;
  }

  renderTagFilters();
  renderBlogList();

  // Check hash for direct post link
  const hash = window.location.hash.replace('#', '');
  if (hash && postCache.has(hash)) {
    showPost(postCache.get(hash));
  }

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (!h) {
      document.getElementById('blog-detail-view').classList.remove('active');
      document.getElementById('blog-list-view').style.setProperty('display', 'block');
    } else if (postCache.has(h)) {
      showPost(postCache.get(h));
    }
  });

  // Back button
  const backBtn = document.getElementById('blog-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('blog-detail-view').classList.remove('active');
      document.getElementById('blog-list-view').style.setProperty('display', 'block');
      history.replaceState(null, '', 'blog.html');
      window.scrollTo(0, 0);
    });
  }

  function renderTagFilters() {
    const filterRoot = document.getElementById('tag-filters');
    if (!filterRoot) return;
    filterRoot.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = `tag-filter ${activeTag === 'All' ? 'tag-filter--active' : ''}`;
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => { activeTag = 'All'; renderTagFilters(); renderBlogList(); });
    filterRoot.appendChild(allBtn);

    [...allTags].sort().forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `tag-filter ${activeTag === tag ? 'tag-filter--active' : ''}`;
      btn.textContent = tag;
      btn.addEventListener('click', () => { activeTag = tag; renderTagFilters(); renderBlogList(); });
      filterRoot.appendChild(btn);
    });
  }

  function renderBlogList() {
    const list = document.getElementById('blog-list');
    if (!list) return;
    list.innerHTML = '';

    for (const slug of slugs) {
      const post = postCache.get(slug);
      if (!post) continue;

      // Tag filter
      if (activeTag !== 'All' && !post.tags.includes(activeTag)) continue;

      const card = document.createElement('a');
      card.className = 'blog-card';
      card.href = `#${slug}`;
      card.addEventListener('click', (e) => { e.preventDefault(); showPost(post); });

      const dateStr = new Date(post.meta.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const tags = post.tags.map(t => `<span class="blog-tag">${t}</span>`).join('');
      const readTime = post.readTime;

      card.innerHTML = `
        <div class="blog-card-meta">
          <span class="blog-card-date">${dateStr}</span>
          <span class="blog-card-read">· ${readTime} min read</span>
        </div>
        <h2>${post.meta.title || slug}</h2>
        <p>${post.meta.excerpt || ''}</p>
        <div class="blog-card-tags">${tags}</div>
        <span class="blog-card-link">Read full deep-dive →</span>`;

      list.appendChild(card);
    }
  }

  function showPost(post) {
    document.getElementById('blog-list-view').style.setProperty('display', 'none');
    const detail = document.getElementById('blog-detail-view');
    detail.classList.add('active');

    const dateStr = new Date(post.meta.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    document.getElementById('blog-detail-title').textContent = post.meta.title || post.slug;
    document.getElementById('blog-detail-date').textContent = dateStr;
    document.getElementById('blog-detail-read').textContent = `· ${post.readTime} min read`;

    const html = parseMarkdown(post.content);
    document.getElementById('blog-detail-content').innerHTML = html;

    const tagsEl = document.getElementById('blog-detail-tags');
    tagsEl.innerHTML = post.tags.map(t => `<span class="blog-tag">${t}</span>`).join('');

    // "More like this" strip
    const relatedRoot = document.getElementById('blog-related');
    if (relatedRoot) {
      relatedRoot.innerHTML = '';
      const related = slugs
        .filter(s => s !== post.slug)
        .map(s => postCache.get(s))
        .filter(p => p && p.tags.some(t => post.tags.includes(t)))
        .slice(0, 2);

      if (related.length > 0) {
        relatedRoot.innerHTML = `<div class="section-label">// more like this</div>`;
        const grid = document.createElement('div');
        grid.className = 'posts-grid';
        related.forEach(r => {
          const rDate = new Date(r.meta.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const rCard = document.createElement('a');
          rCard.className = 'post-card';
          rCard.href = `#${r.slug}`;
          rCard.addEventListener('click', (e) => { e.preventDefault(); showPost(r); });
          rCard.innerHTML = `
            <div class="post-card-date">${rDate}</div>
            <h3>${r.meta.title || r.slug}</h3>
            <p>${r.meta.excerpt || ''}</p>
            <span class="post-card-link">Read post →</span>`;
          grid.appendChild(rCard);
        });
        relatedRoot.appendChild(grid);
      }
    }

    window.location.hash = post.slug;
    window.scrollTo(0, 0);
  }
}
