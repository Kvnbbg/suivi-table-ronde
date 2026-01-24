document.addEventListener('DOMContentLoaded', () => {
  const CONSTANTS = {
    CONFIRMATION_HIDE_DELAY_MS: 3000,
    FEEDBACK_STORAGE_KEY: 'savedFeedback',
    FEEDBACK_EMAIL: 'kevinmarville@gmail.com',
    INDEX_URL: 'index.html',
    LOCAL_STORAGE_TEST_KEY: '__feedback_storage_test__',
    LANGUAGE_LABELS: {
      en: '🌍 Switch to English',
      fr: '🌍 Passer en Français',
    },
    MESSAGES: {
      emptyFields: 'Veuillez remplir tous les champs.',
      invalidEmail: 'Veuillez entrer une adresse email valide.',
      savedFeedback: '💾 Feedback sauvegardé !',
      missingMessage: 'Veuillez entrer un message.',
      storageUnavailable: 'Le stockage local est indisponible.',
      openIndexFallback: '^_^ I appreciate the suggestion!',
    },
  };

  const logger = {
    error(message, error) {
      console.error(`[feedback-ui] ${message}`, error);
    },
  };

  const masterModal = document.getElementById('masterModal');
  const feedbackForm = document.getElementById('feedbackForm');
  const confirmationAnimation = document.getElementById('confirmation-animation');
  const toggleLangBtn = document.getElementById('toggle-lang');

  const getInputValue = (inputId) => document.getElementById(inputId)?.value.trim() ?? '';
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem(CONSTANTS.LOCAL_STORAGE_TEST_KEY, CONSTANTS.LOCAL_STORAGE_TEST_KEY);
      localStorage.removeItem(CONSTANTS.LOCAL_STORAGE_TEST_KEY);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Local storage is unavailable.', error);
      }
      return false;
    }
  };

  function safeExecute(func, alternative = null) {
    try {
      func();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message, error);
      } else {
        logger.error('Unknown error while executing function.', new Error(String(error)));
      }
      if (alternative) {
        alternative();
      }
    }
  }

  /**
   * Opens the master modal window if it exists.
   */
  const openMasterModal = () => {
    safeExecute(() => {
      if (!masterModal) {
        return;
      }

      masterModal.style.display = 'flex';
    });
  };

  /**
   * Closes the master modal window if it exists.
   */
  const closeMasterModal = () => {
    safeExecute(() => {
      if (!masterModal) {
        return;
      }

      masterModal.style.display = 'none';
    });
  };

  /**
   * Opens the index page in a new tab.
   */
  const openIndex = () => {
    safeExecute(
      () => window.open(CONSTANTS.INDEX_URL, '_blank'),
      () => alert(CONSTANTS.MESSAGES.openIndexFallback),
    );
  };

  /**
   * Toggles the document language and updates UI labels.
   */
  const toggleLanguage = () => {
    const documentElement = document.documentElement;
    if (!documentElement) {
      return;
    }

    const currentLang = documentElement.lang || 'fr';
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    documentElement.lang = newLang;

    if (!toggleLangBtn) {
      return;
    }

    toggleLangBtn.textContent = CONSTANTS.LANGUAGE_LABELS[newLang];
  };

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = getInputValue('name');
      const email = getInputValue('email');
      const message = getInputValue('message');

      if (!name || !email || !message) {
        alert(CONSTANTS.MESSAGES.emptyFields);
        return;
      }

      if (!isValidEmail(email)) {
        alert(CONSTANTS.MESSAGES.invalidEmail);
        return;
      }

      const subject = encodeURIComponent(`Feedback from ${name}`);
      const body = encodeURIComponent(`${message}\n\nEmail: ${email}`);
      const mailtoLink = `mailto:${CONSTANTS.FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;

      if (!confirmationAnimation) {
        return;
      }

      confirmationAnimation.classList.remove('hidden');
      setTimeout(
        () => confirmationAnimation.classList.add('hidden'),
        CONSTANTS.CONFIRMATION_HIDE_DELAY_MS,
      );
    });
  }

  /**
   * Saves feedback locally for later retrieval.
   */
  const saveFeedback = () => {
    safeExecute(() => {
      const message = getInputValue('message');
      if (!message) {
        alert(CONSTANTS.MESSAGES.missingMessage);
        return;
      }

      if (!isLocalStorageAvailable()) {
        alert(CONSTANTS.MESSAGES.storageUnavailable);
        return;
      }

      localStorage.setItem(CONSTANTS.FEEDBACK_STORAGE_KEY, message);
      alert(CONSTANTS.MESSAGES.savedFeedback);
    });
  };

  window.openMasterModal = openMasterModal;
  window.closeMasterModal = closeMasterModal;
  window.openIndex = openIndex;
  window.toggleLanguage = toggleLanguage;
  window.saveFeedback = saveFeedback;

  if (toggleLangBtn) {
    toggleLangBtn.addEventListener('click', toggleLanguage);
  }
});
