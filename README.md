# Veera Reddy Ravuri — Portfolio

> Cloud-Native DevOps Engineer · Building infrastructure that doesn't fail — and tooling to detect it when it does.

**Live site:** [veerareddy­ravuri.github.io](https://veerareddy­ravuri.github.io)

---

## Overview

This is the source for my personal portfolio website — a static site built with plain HTML, CSS, and vanilla JavaScript, auto-deployed to GitHub Pages via GitHub Actions on every push to `main`.

The site documents an 8-project DevOps portfolio built over 8 months, covering Linux reliability, containerization, AWS infrastructure, CI/CD pipelines, Kubernetes, and AI infrastructure. Every project is broken on purpose. Every break has an incident report.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | HTML + CSS + Vanilla JS | No framework overhead, loads in <1s, no build step |
| Data | `data/projects.json` + `data/blog.json` | Projects and blog posts are data-driven — adding a new project means editing one JSON file |
| Hosting | GitHub Pages | Free, tied to GitHub profile, custom domain support |
| Deploy | GitHub Actions | Auto-deploy on every push to `main` |
| Fonts | Google Fonts (Syne, DM Sans, JetBrains Mono) | Loaded via CDN with `preconnect` for performance |
| Contact form | Formspree | Serverless form handling, no backend required |

---

## Project Structure

```
.
├── index.html                  # Main portfolio page
├── blog.html                   # Blog listing + detail view
├── style.css                   # All styles (single file)
├── main.js                     # All JavaScript (single file)
├── data/
│   ├── projects.json           # All 8 project entries (source of truth)
│   └── blog.json               # Blog post content in markdown
├── assets/
│   ├── Veera_Reddy_Ravuri_Cloud_DevOps_Resume.pdf
│   └── runbooks/
│       ├── p1-runbook.md       # Linux toolkit incident runbook
│       ├── p2-runbook.md       # Docker stack incident runbook
│       └── p3-runbook.md       # AWS infrastructure incident runbook
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Actions deploy pipeline
```

---

## How the Site Works

### Project cards are data-driven

All project content lives in `data/projects.json`. The JavaScript in `main.js` fetches this file on load and renders every card, metric strip, war story, and architecture diagram. To add or update a project:

1. Edit `data/projects.json`
2. Push to `main`
3. Site redeploys automatically in ~45 seconds

### Architecture diagrams are inline SVGs

Each live project has an `architectureSvg` field in `projects.json` containing a raw SVG string. Clicking "Architecture" on a project card injects this SVG into a modal. No external image hosting needed.

### Blog posts are JSON with markdown content

`data/blog.json` stores posts with a `content` field written in markdown. `blog.html` has a lightweight markdown-to-HTML parser that handles headers, code blocks, bold, italic, inline code, and tables.

### Deploy pipeline

```yaml
# Triggered on every push to main
push → checkout → configure-pages → upload-artifact → deploy-pages
```

The site has no build step — it's pure static files. The workflow uploads the entire repo root and deploys it directly.

---

## Local Development

No build tools required. Clone and serve:

```bash
git clone git@github.com:VeeraReddyRavuri/VeeraReddyRavuri.github.io.git
cd VeeraReddyRavuri.github.io
python3 -m http.server 8000
```

Open `http://localhost:8000`. The local server is required because `data/projects.json` is loaded via `fetch()` — `file://` protocol blocks cross-origin requests.

---

## Adding a New Project

Open `data/projects.json` and add a new object following this schema:

```json
{
  "id": "p4",
  "title": "Project Title",
  "phase": 1,
  "status": "live",
  "whatIProved": "One sentence. Recruiter-facing.",
  "description": "Full description of the project.",
  "heroMetrics": [
    { "value": "X%", "label": "Metric Name" }
  ],
  "quickSummary": {
    "problem": "What problem you solved.",
    "solution": "How you solved it.",
    "keyChallenge": "The hardest part.",
    "result": "Measurable outcome."
  },
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "metrics": [
    { "label": "Metric Label", "value": "Value", "note": "context" }
  ],
  "warStory": {
    "title": "Incident title",
    "what": "What happened.",
    "symptoms": "What you observed.",
    "rootCause": "Why it happened.",
    "fix": "What you changed.",
    "prevention": "What you added to prevent recurrence.",
    "severity": "High",
    "runbook": ["Step 1", "Step 2", "Step 3"]
  },
  "architectureDiagram": false,
  "architectureSvg": null,
  "architectureNote": null,
  "stack": ["Tool1", "Tool2"],
  "github": "https://github.com/VeeraReddyRavuri/repo-name",
  "relatedBlogSlug": null
}
```

Set `status` to `"coming-soon"` for projects not yet live — they render as collapsible accordion cards with reduced opacity.

---

## Adding a Blog Post

Open `data/blog.json` and prepend a new entry:

```json
{
  "slug": "url-friendly-slug",
  "title": "Post Title",
  "date": "2026-04-01",
  "excerpt": "One or two sentence summary shown on the blog list page.",
  "tags": ["Tag1", "Tag2"],
  "linkedInPost": null,
  "content": "## Section Header\n\nMarkdown content here.\n\n```bash\ncode block\n```"
}
```

The blog page auto-generates read time from word count and infers the related project from the slug (`docker` → P2, `terraform` → P3, `linux` → P1).

---

## Deployment

Deployments are fully automated. Every push to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`.

**To deploy a change:**
```bash
git add .
git commit -m "your message"
git push origin main
```

**To check deployment status:**  
Go to the repo → Actions tab → "Deploy Portfolio to GitHub Pages"

**First-time setup (one-time only):**  
Repo Settings → Pages → Source → **GitHub Actions**

---

## Portfolio Projects

| # | Project | Status | Key Proof |
|---|---------|--------|-----------|
| P1 | Linux & Python Reliability Toolkit | ✅ Live | ≤5 min detection latency, silent failure war story |
| P2 | Bug Tracker — Containerized Stack | ✅ Live | 225MB → 120MB image, Nginx DNS debugging war story |
| P3 | AWS Production Infrastructure Blueprint | ✅ Live | 14 resources in Terraform state, drift recovery war story |
| P4 | Secure CI/CD Pipeline | 🔄 Building | GitHub Actions + Trivy + blue/green deploy |
| P5 | Kubernetes + War Room Stack | 📋 Planned | HPA, 4 chaos scenarios, Prometheus + Grafana |
| P6 | MLOps Production Pipeline | 📋 Planned | Hugging Face model serving, P99 latency monitoring |
| P7 | LLM / RAG Infrastructure | 📋 Planned | Per-query cost tracking, Redis caching, rate limiting |
| P8 | AI-Augmented SRE Dashboard | 📋 Planned | AlertManager + LLM triage + human approval gate |

Full documentation for each project is in the respective GitHub repositories linked from the site.

---

## Design Decisions

**Why no framework?**  
React/Next.js would add a build step, increase complexity, and slow initial load. A static HTML site loads in <1s, deploys in 45 seconds, and has zero dependencies to break.

**Why JSON-driven content?**  
Separating data from presentation means updating a project description, adding a metric, or fixing a war story requires editing one JSON file — not touching HTML or JS. This also makes the data portable.

**Why dark minimalist design?**  
Senior DevOps and SRE engineers skew toward functional over decorative. A clean dark site with monospace fonts signals technical taste without being gimmicky. It also loads well on every device and connection speed.

**Why inline SVG for architecture diagrams?**  
No external hosting, no broken image links, no CORS issues. The SVG renders identically on every browser and can be styled with CSS variables to match the site theme.

---

## Contact

**Veera Reddy Ravuri**  
Cloud-Native DevOps Engineer  
Open to Cloud / DevOps / SRE roles · India · Remote / Hybrid / On-site

- Email: veerareddy.ravuri01@gmail.com  
- LinkedIn: [linkedin.com/in/veerareddyravuri](https://www.linkedin.com/in/veerareddyravuri/)  
- GitHub: [github.com/VeeraReddyRavuri](https://github.com/VeeraReddyRavuri)

---

## License

The portfolio infrastructure (HTML, CSS, JS, deployment config) is open source under the MIT License.  
All project content, war stories, runbooks, and personal information are © 2026 Veera Reddy Ravuri.