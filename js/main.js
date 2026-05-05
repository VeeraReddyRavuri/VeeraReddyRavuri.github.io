import { initProjects } from './projects.js';
import { initBlogPreviews, initBlogPage } from './blog.js';
import { initModals } from './modals.js';
import { initAnimations } from './animations.js';
import { initNav } from './nav.js';
import { initContact } from './contact.js';
import { initResume } from './resume.js';

async function boot() {
  initNav();

  const path = window.location.pathname;

  if (path.includes('resume')) {
    await initResume();
  } else if (path.includes('blog')) {
    initModals();
    await initBlogPage();
    initAnimations();
  } else {
    initModals();
    initContact();
    await Promise.all([initProjects(), initBlogPreviews()]);
    initAnimations();
  }
}

boot();
