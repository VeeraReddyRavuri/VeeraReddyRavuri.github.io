import { getProjectData } from './projects.js';

let archModalEl = null;
let resumeModalEl = null;

export function initModals() {
  archModalEl = document.getElementById('arch-modal');
  resumeModalEl = document.getElementById('resume-modal');

  // Architecture modal close
  const archClose = document.getElementById('modal-close');
  if (archClose) {
    archClose.addEventListener('click', closeArchModal);
  }
  if (archModalEl) {
    archModalEl.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeArchModal();
    });
  }

  // Resume modal close
  const resumeClose = document.getElementById('resume-modal-close');
  if (resumeClose) {
    resumeClose.addEventListener('click', closeResumeModal);
  }
  if (resumeModalEl) {
    resumeModalEl.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeResumeModal();
    });
  }

  // Escape key handler
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeArchModal();
      closeResumeModal();
      document.getElementById('nav-links')?.classList.remove('open');
    }
  });
}

export function openArchModal(projectId) {
  const p = getProjectData(projectId);
  if (!p || !p.architectureSvg) return;

  document.getElementById('modal-title').textContent = p.title + ' — Architecture';
  document.getElementById('modal-diagram').innerHTML = p.architectureSvg;
  document.getElementById('modal-note').textContent = p.architectureNote || '';
  archModalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeArchModal() {
  if (!archModalEl) return;
  archModalEl.classList.remove('open');
  document.body.style.overflow = '';
}

export function openResumeModal(e) {
  if (e) e.preventDefault();
  if (!resumeModalEl) return;
  const iframe = document.getElementById('resume-iframe');
  if (iframe) {
    iframe.src = 'assets/Veera_Reddy_Ravuri_Cloud_DevOps_Resume.pdf?v=2';
  }
  resumeModalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeResumeModal() {
  if (!resumeModalEl) return;
  resumeModalEl.classList.remove('open');
  document.body.style.overflow = '';
  const iframe = document.getElementById('resume-iframe');
  if (iframe) iframe.src = '';
}
