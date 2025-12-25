document.addEventListener('DOMContentLoaded', () => {
  // Caching DOM elements for performance
  const masterModal = document.getElementById('masterModal');
  const feedbackForm = document.getElementById('feedbackForm');
  const confirmationAnimation = document.getElementById('confirmation-animation');
  const toggleLangBtn = document.getElementById('toggle-lang');

  // Safe function execution wrapper
  function safeExecute(func, alternative = null) {
    try {
      func();
    } catch (error) {
      console.error('Error executing function:', error);
      if (alternative) alternative();
    }
  }

  // Open Master Modal with error handling
  const openMasterModal = () => {
    safeExecute(() => {
      if (masterModal) {
        masterModal.style.display = 'flex';
      } else {
        console.warn('Modal not found.');
      }
    });
  };

  // Close Master Modal
  const closeMasterModal = () => {
    safeExecute(() => {
      if (masterModal) {
        masterModal.style.display = 'none';
      }
    });
  };

  // Open Index Page with alternative alert
  const openIndex = () => {
    safeExecute(
      () => window.open('index.html', '_blank'),
      () => alert('^_^ I appreciate the suggestion!'),
    );
  };

  // Toggle Language with proper UI updates
  const toggleLanguage = () => {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    document.documentElement.lang = newLang;
    if (toggleLangBtn) {
      toggleLangBtn.textContent = newLang === 'fr' ? '🌍 Passer en Français' : '🌍 Switch to English';
    }
  };

  // Feedback Form Submission with input validation
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const message = document.getElementById('message')?.value.trim();

      if (!name || !email || !message) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      const mailtoLink = `mailto:kevinmarville@gmail.com?subject=Feedback from ${name}&body=${encodeURIComponent(message)}%0D%0A%0D%0AEmail: ${email}`;
      window.location.href = mailtoLink;

      if (confirmationAnimation) {
        confirmationAnimation.classList.remove('hidden');
        setTimeout(() => confirmationAnimation.classList.add('hidden'), 3000);
      }
    });
  }

  // Save Feedback Locally with error handling
  const saveFeedback = () => {
    safeExecute(() => {
      const message = document.getElementById('message')?.value.trim();
      if (message) {
        localStorage.setItem('savedFeedback', message);
        alert('💾 Feedback sauvegardé !');
      } else {
        alert('Veuillez entrer un message.');
      }
    });
  };

  window.openMasterModal = openMasterModal;
  window.closeMasterModal = closeMasterModal;
  window.openIndex = openIndex;
  window.toggleLanguage = toggleLanguage;
  window.saveFeedback = saveFeedback;

  // Ensure elements exist before attaching event listeners
  if (toggleLangBtn) {
    toggleLangBtn.addEventListener('click', toggleLanguage);
  }
});
