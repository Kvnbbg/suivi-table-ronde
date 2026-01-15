(function () {
  'use strict';

  const decisionLabels = {
    consensus: 'Consensus',
    consultation: 'Consultation',
    initiative: 'Initiative personnelle',
    veille: 'Veille / À explorer',
  };

  const logger = window.SuiviLogger?.createLogger({ namespace: 'community-log-ui' }) ?? {
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  const communityLog = window.CommunityLog?.createCommunityLog({ logger }) ?? window.CommunityLog;

  const form = document.getElementById('entryForm');
  const formFeedback = document.getElementById('formFeedback');
  const entriesList = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  const entriesCounter = document.getElementById('entriesCounter');
  const tagFilter = document.getElementById('tagFilter');
  const searchEntries = document.getElementById('searchEntries');
  const importButton = document.getElementById('importEntriesButton');
  const importInput = document.getElementById('importEntriesInput');
  const exportButton = document.getElementById('exportEntries');
  const clearButton = document.getElementById('clearEntries');
  const exportFeedback = document.getElementById('exportFeedback');
  const saveDraft = document.getElementById('saveDraft');
  const clearDraft = document.getElementById('clearDraft');
  const statusMessage = document.getElementById('statusMessage');

  const draftKey = 'communityLogDraft';

  function setStatus(message, variant = 'info') {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.dataset.variant = variant;
  }

  function showFeedback(element, message, timeout = 5000) {
    if (!element) return;
    element.textContent = message;
    if (timeout > 0) {
      setTimeout(() => {
        if (element.textContent === message) {
          element.textContent = '';
        }
      }, timeout);
    }
  }

  function hasStorageSupport() {
    if (!window.localStorage) return false;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'ok');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('storage.unavailable', { error: error?.message });
      return false;
    }
  }

  function getFormData() {
    const data = new FormData(form);
    return {
      title: data.get('title') || '',
      summary: data.get('summary') || '',
      commitments: data.get('commitments') || '',
      participants: data.get('participants') || '',
      decisionType: data.get('decisionType') || '',
      tags: data.get('tags') || '',
    };
  }

  function renderEntries(entries) {
    entriesList.innerHTML = '';

    if (!entries.length) {
      emptyState.hidden = false;
      entriesCounter.textContent = '0 contribution documentée';
      return;
    }

    emptyState.hidden = true;
    entriesCounter.textContent = entries.length === 1
      ? '1 contribution documentée'
      : `${entries.length} contributions documentées`;

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'entry-card';
      article.setAttribute('tabindex', '0');

      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const date = new Date(entry.createdAt);
      const dateTime = document.createElement('time');
      dateTime.dateTime = entry.createdAt;
      dateTime.textContent = date.toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      meta.appendChild(dateTime);

      if (entry.decisionType) {
        const decision = document.createElement('span');
        decision.className = 'tag';
        decision.textContent = decisionLabels[entry.decisionType] || entry.decisionType;
        meta.appendChild(decision);
      }

      if (entry.participants) {
        const participants = document.createElement('span');
        participants.textContent = `Impliqué·es : ${entry.participants}`;
        meta.appendChild(participants);
      }

      const heading = document.createElement('h3');
      heading.textContent = entry.title;

      const summary = document.createElement('p');
      summary.textContent = entry.summary;

      const commitments = document.createElement('p');
      commitments.textContent = `Engagements : ${entry.commitments}`;

      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'entry-meta';
      const safeTags = Array.isArray(entry.tags) ? entry.tags : [];
      safeTags.forEach((tag) => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      });

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'btn-secondary';
      removeButton.textContent = 'Retirer cette note';
      removeButton.addEventListener('click', () => {
        if (confirm('Voulez-vous retirer cette contribution du journal ?')) {
          const updated = communityLog.removeEntry(entry.id);
          refreshEntries(updated);
          showFeedback(exportFeedback, 'Contribution retirée. Vous pouvez toujours la republier.');
        }
      });

      article.appendChild(meta);
      article.appendChild(heading);
      article.appendChild(summary);
      article.appendChild(commitments);
      if (safeTags.length) {
        article.appendChild(tagsContainer);
      }
      article.appendChild(removeButton);

      entriesList.appendChild(article);
    });
  }

  function refreshEntries(entries) {
    entriesList.setAttribute('aria-busy', 'true');
    const baseEntries = entries
      ? communityLog.sortEntries(entries)
      : communityLog.sortEntries(communityLog.loadEntries());

    const filtered = communityLog.filterEntries(baseEntries, {
      tag: tagFilter.value,
      search: searchEntries.value,
    });
    renderEntries(filtered);
    updateTagFilter(baseEntries);
    entriesList.setAttribute('aria-busy', 'false');
  }

  function updateTagFilter(entries) {
    const currentValue = tagFilter.value;
    const tags = communityLog.uniqueTags(entries);
    tagFilter.innerHTML = '<option value="">Tous les mots-clés</option>';
    tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = decisionLabels[tag] || tag;
      tagFilter.appendChild(option);
    });
    if (tags.includes(currentValue)) {
      tagFilter.value = currentValue;
    }
  }

  function exportEntriesToFile(entries) {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'journal-communautaire.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function buildImportedEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== 'object') return null;

    const data = {
      title: rawEntry.title ?? '',
      summary: rawEntry.summary ?? '',
      commitments: rawEntry.commitments ?? '',
      participants: rawEntry.participants ?? '',
      decisionType: rawEntry.decisionType ?? '',
      tags: rawEntry.tags ?? '',
    };

    const options = {};
    if (rawEntry.id) {
      const safeId = String(rawEntry.id);
      options.idGenerator = () => safeId;
    }

    if (rawEntry.createdAt) {
      const parsedDate = new Date(rawEntry.createdAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        const timestamp = parsedDate.toISOString();
        options.timestamp = () => timestamp;
      }
    }

    try {
      return communityLog.createEntry(data, options);
    } catch (error) {
      logger.warn('import.entry_invalid', { error: error?.message });
      return null;
    }
  }

  function mergeEntries(existingEntries, importedEntries) {
    const merged = new Map();
    existingEntries.forEach((entry) => merged.set(entry.id, entry));
    importedEntries.forEach((entry) => merged.set(entry.id, entry));
    return Array.from(merged.values());
  }

  async function handleImport(file) {
    if (!file) return;
    if (!hasStorageSupport()) {
      showFeedback(exportFeedback, 'Impossible d’importer sans stockage local.', 6000);
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        showFeedback(exportFeedback, 'Le fichier importé doit contenir un tableau de contributions.', 7000);
        return;
      }

      const importedEntries = parsed.map(buildImportedEntry).filter(Boolean);
      if (!importedEntries.length) {
        showFeedback(exportFeedback, 'Aucune contribution valide n’a été trouvée dans ce fichier.', 7000);
        return;
      }

      const existingEntries = communityLog.loadEntries();
      const existingIds = new Set(existingEntries.map((entry) => entry.id));
      const addedCount = importedEntries.filter((entry) => !existingIds.has(entry.id)).length;

      const mergedEntries = mergeEntries(existingEntries, importedEntries);
      const sortedEntries = communityLog.sortEntries(mergedEntries);
      communityLog.persistEntries(sortedEntries);
      refreshEntries(sortedEntries);

      showFeedback(
        exportFeedback,
        `Import terminé : ${addedCount} contribution(s) ajoutée(s), ${importedEntries.length - addedCount} mise(s) à jour.`,
        7000,
      );
    } catch (error) {
      logger.error('import.failed', { error: error?.message });
      showFeedback(exportFeedback, 'Impossible de lire ce fichier. Vérifiez qu’il s’agit d’un JSON valide.', 7000);
    } finally {
      if (importInput) {
        importInput.value = '';
      }
    }
  }

  function saveDraftData() {
    if (!hasStorageSupport()) {
      showFeedback(formFeedback, 'Le brouillon ne peut pas être sauvegardé sans stockage local.', 6000);
      return;
    }
    const data = getFormData();
    window.localStorage.setItem(draftKey, JSON.stringify(data));
    showFeedback(formFeedback, 'Brouillon sauvegardé dans ce navigateur.');
  }

  function loadDraftData() {
    if (!hasStorageSupport()) return;
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      Object.entries(data).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) {
          field.value = value;
        }
      });
      showFeedback(formFeedback, 'Brouillon chargé. Vous pouvez reprendre votre rédaction.', 4000);
    } catch (error) {
      logger.warn('draft.invalid', { error: error?.message });
      showFeedback(formFeedback, 'Le brouillon enregistré est illisible, il a été ignoré.', 6000);
    }
  }

  function clearDraftData() {
    if (!hasStorageSupport()) return;
    window.localStorage.removeItem(draftKey);
    showFeedback(formFeedback, 'Brouillon effacé.');
  }

  function handleError(error, fallbackMessage) {
    const details = Array.isArray(error?.details) ? error.details.join(' ') : '';
    const message = details ? `${fallbackMessage} ${details}` : fallbackMessage;
    showFeedback(formFeedback, message.trim(), 7000);
    logger.error('ui.error', { error: error?.message, details });
  }

  function init() {
    if (!communityLog) {
      setStatus('Le module de journal communautaire est indisponible.', 'error');
      return;
    }

    if (!hasStorageSupport()) {
      setStatus('Le stockage local est indisponible : les contributions ne pourront pas être sauvegardées.', 'error');
    } else {
      setStatus('Prêt à documenter les décisions collectives.', 'info');
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = getFormData();
      const validation = communityLog.validateEntry(data);

      if (!validation.valid) {
        showFeedback(formFeedback, validation.errors.join(' '), 6000);
        return;
      }

      try {
        const entry = communityLog.createEntry(data);
        const entries = communityLog.addEntry(entry);
        form.reset();
        clearDraftData();
        refreshEntries(entries);
        showFeedback(formFeedback, 'Contribution ajoutée au journal. Merci pour votre transparence !');
      } catch (error) {
        handleError(error, "Impossible d'enregistrer la contribution.");
      }
    });

    tagFilter.addEventListener('change', () => refreshEntries());
    searchEntries.addEventListener('input', () => refreshEntries());

    exportButton.addEventListener('click', () => {
      const entries = communityLog.loadEntries();
      if (!entries.length) {
        showFeedback(exportFeedback, 'Le journal est vide : ajoutez une contribution avant d’exporter.');
        return;
      }
      exportEntriesToFile(entries);
      showFeedback(exportFeedback, 'Fichier exporté. Partagez-le avec votre collectif pour renforcer la transparence.');
    });

    if (importButton && importInput) {
      importButton.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        handleImport(file);
      });
    }

    clearButton.addEventListener('click', () => {
      if (confirm('Cette action efface toutes les contributions de ce navigateur. Continuer ?')) {
        try {
          communityLog.persistEntries([]);
          refreshEntries([]);
          showFeedback(exportFeedback, 'Journal réinitialisé. Les décisions restent documentées si vous avez exporté le fichier.');
        } catch (error) {
          showFeedback(exportFeedback, 'Impossible de réinitialiser le journal. Vérifiez votre stockage local.', 6000);
          logger.error('storage.clear_failed', { error: error?.message });
        }
      }
    });

    saveDraft.addEventListener('click', saveDraftData);
    clearDraft.addEventListener('click', () => {
      form.reset();
      clearDraftData();
    });

    window.addEventListener('beforeunload', () => {
      const data = getFormData();
      if (data.title || data.summary || data.commitments) {
        saveDraftData();
      }
    });

    loadDraftData();
    refreshEntries();

    if (!communityLog.loadEntries().length && !window.localStorage?.getItem(draftKey)) {
      showFeedback(formFeedback, 'Bienvenue ! Ajoutez votre première contribution pour lancer la discussion.', 7000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
