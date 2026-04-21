# Veera Reddy Ravuri — Cloud-Native DevOps Portfolio

Production-grade DevOps portfolio website deployed to GitHub Pages. Pure HTML + CSS + JS — no frameworks, no build tools.

## File Structure

```
/
├── index.html            ← Main portfolio page
├── blog.html             ← Blog listing + detail viewer
├── resume.html           ← Clean resume page with download
├── css/
│   ├── tokens.css        ← CSS variables, reset, base styles
│   ├── layout.css        ← Nav, footer, containers, sections
│   ├── components.css    ← Buttons, cards, modals, tags, badges
│   ├── projects.css      ← Project cards, pipeline, roadmap strip
│   ├── blog.css          ← Blog listing, post page, tag filters
│   ├── resume.css        ← Resume page only styles
│   └── animations.css    ← Keyframes, scroll animations, reduced motion
├── js/
│   ├── main.js           ← Boot: imports and calls init functions
│   ├── projects.js       ← Fetch, render, sort projects
│   ├── blog.js           ← Fetch, render blog posts and listing
│   ├── modals.js         ← Architecture + resume modal logic
│   ├── animations.js     ← Scroll observer, counter, gear pipeline
│   ├── nav.js            ← Hamburger, escape key, mobile menu
│   └── contact.js        ← Form submission via fetch, confirmation UI
├── posts/
│   ├── index.json        ← Ordered array of post slugs
│   ├── docker-dns-nginx-debugging.md
│   ├── terraform-state-drift-recovery.md
│   └── linux-reliability-toolkit-deep-dive.md
├── data/
│   └── projects.json     ← Project data (schema documented below)
├── assets/
│   ├── Veera_Reddy_Ravuri_Cloud_DevOps_Resume.pdf
│   └── runbooks/
│       ├── p1-runbook.md
│       ├── p2-runbook.md
│       └── p3-runbook.md
└── .github/
    └── workflows/
        └── deploy.yml    ← GitHub Pages deployment
```

## Portfolio Projects

| # | Project | Stack | Status |
|---|---------|-------|--------|
| 1 | Linux & Python Reliability Toolkit | Python, psutil, systemd, YAML, cron | ✅ Live |
| 2 | Bug Tracker — Containerized Stack | Docker, FastAPI, PostgreSQL, Nginx | ✅ Live |
| 3 | AWS Production Infrastructure Blueprint | Terraform, Ansible, AWS, GitHub Actions | ✅ Live |
| 4 | Secure CI/CD Pipeline | GitHub Actions, Trivy, ECR, ALB | 🔨 In Progress |
| 5 | Kubernetes + War Room Stack | Kubernetes, Helm, Prometheus, Grafana | 📋 Planned |
| 6 | MLOps Production Pipeline | Kubeflow, MLflow, FastAPI, Docker | 📋 Planned |
| 7 | LLM / RAG Infrastructure | LangChain, FAISS, FastAPI, Docker | 📋 Planned |
| 8 | AI-Augmented SRE Dashboard | OpenAI API, Prometheus, Grafana | 📋 Planned |

## Adding a Blog Post

1. Create a new file at `posts/your-post-slug.md` following the frontmatter format:
   ```markdown
   ---
   title: "Post Title Here"
   date: "2026-03-20"
   excerpt: "One or two sentence summary shown on listing page."
   tags: ["Tag1", "Tag2"]
   ---

   ## First Section

   Post content in markdown...
   ```
2. Add the slug to the top of `posts/index.json`.
3. Push to main. Site redeploys in ~45 seconds.

## Design Decisions

**Why no framework?** React or Astro would add a build step, increase repo complexity, and make the source harder to read for non-frontend engineers who view it. This site uses plain HTML, CSS (split into logical modules), and ES module JavaScript. It loads in under a second, deploys in under a minute, and the architecture is fully auditable from the GitHub source link in the footer. Deliberate simplicity is an engineering decision, not a shortcut.

## Local Development

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

A local server is required because the site uses ES modules and `fetch()` for data loading.

## Deployment

Push to `main` branch. GitHub Actions automatically deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## License

© 2026 Veera Reddy Ravuri. All rights reserved.