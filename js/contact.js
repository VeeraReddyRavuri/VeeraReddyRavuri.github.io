export function initContact() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const confirm = document.querySelector('.contact-confirm');
  const errorEl = document.querySelector('.form-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide any previous error
    if (errorEl) {
      errorEl.classList.remove('visible');
    }

    const data = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        // Success: hide form, show confirmation
        form.classList.add('form--submitted');
        if (confirm) {
          confirm.classList.remove('contact-confirm--hidden');
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      // Failure: show inline error
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again or email directly.';
        errorEl.classList.add('visible');
      }
    }
  });
}
