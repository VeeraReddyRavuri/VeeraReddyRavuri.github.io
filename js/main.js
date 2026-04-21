import { initProjects } from './projects.js';
import { initBlogPreviews, initBlogPage } from './blog.js';
import { initModals } from './modals.js';
import { initAnimations } from './animations.js';
import { initNav } from './nav.js';
import { initContact } from './contact.js';

async function boot() {
  initNav();
  initModals();
  initContact();

  if (window.location.pathname.includes('blog')) {
    await initBlogPage();
  } else {
    await Promise.all([initProjects(), initBlogPreviews()]);
  }

  initAnimations();
}

boot();
