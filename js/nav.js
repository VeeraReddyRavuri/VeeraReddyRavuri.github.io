export function initNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  if (!hamburger || !navLinks) return;

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // Active section detection via IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = navLinks.querySelectorAll('a[href^="#"]');

  if (sections.length === 0 || navAnchors.length === 0) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navAnchors.forEach(a => {
        if (a.getAttribute('href') === `#${id}`) {
          a.classList.add('nav-link--active');
        } else {
          a.classList.remove('nav-link--active');
        }
      });
    });
  }, {
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(section => observer.observe(section));
}
