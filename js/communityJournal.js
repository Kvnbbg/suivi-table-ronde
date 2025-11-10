(function () {
    'use strict';

    const decisionLabels = {
      consensus: 'Consensus',
      consultation: 'Consultation',
      initiative: 'Initiative personnelle',
      veille: 'Veille / À explorer',
    };

    const form = document.getElementById('entryForm');
    const formFeedback = document.getElementById('formFeedback');
    const entriesList = document.getElementById('entriesList');
    const emptyState = document.getElementById('emptyState');
    const entriesCounter = document.getElementById('entriesCounter');
    const tagFilter = document.getElementById('tagFilter');
    const searchEntries = document.getElementById('searchEntries');
    const exportButton = document.getElementById('exportEntries');
    const clearButton = document.getElementById('clearEntries');
    const exportFeedback = document.getElementById('exportFeedback');
    const saveDraft = document.getElementById('saveDraft');
    const clearDraft = document.getElementById('clearDraft');
    const draftKey = 'communityLogDraft';

    function showFeedback(element, message, timeout = 5000) {
      element.textContent = message;
      if (timeout > 0) {
        setTimeout(() => {
          if (element.textContent === message) {
            element.textContent = '';
          }
        }, timeout);
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
        entry.tags.forEach((tag) => {
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
            const updated = CommunityLog.removeEntry(entry.id);
            refreshEntries(updated);
            showFeedback(exportFeedback, 'Contribution retirée. Vous pouvez toujours la republier.');
          }
        });

        article.appendChild(meta);
        article.appendChild(heading);
        article.appendChild(summary);
        article.appendChild(commitments);
        if (entry.tags.length) {
          article.appendChild(tagsContainer);
        }
        article.appendChild(removeButton);

        entriesList.appendChild(article);
      });
    }

    function refreshEntries(entries) {
      const baseEntries = entries
        ? CommunityLog.sortEntries(entries)
        : CommunityLog.sortEntries(CommunityLog.loadEntries());

      const filtered = CommunityLog.filterEntries(baseEntries, {
        tag: tagFilter.value,
        search: searchEntries.value,
      });
      renderEntries(filtered);
      updateTagFilter(baseEntries);
    }

    function updateTagFilter(entries) {
      const currentValue = tagFilter.value;
      const tags = CommunityLog.uniqueTags(entries);
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

    function saveDraftData() {
      const data = getFormData();
      localStorage.setItem(draftKey, JSON.stringify(data));
      showFeedback(formFeedback, 'Brouillon sauvegardé dans ce navigateur.');
    }

    function loadDraftData() {
      const raw = localStorage.getItem(draftKey);
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
        console.warn('Brouillon illisible :', error);
      }
    }

    function clearDraftData() {
      localStorage.removeItem(draftKey);
      showFeedback(formFeedback, 'Brouillon effacé.');
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = getFormData();
      const validation = CommunityLog.validateEntry(data);

      if (!validation.valid) {
        showFeedback(formFeedback, validation.errors.join(' '), 6000);
        return;
      }

      try {
        const entry = CommunityLog.createEntry(data);
        const entries = CommunityLog.addEntry(entry);
        form.reset();
        clearDraftData();
        refreshEntries(entries);
        showFeedback(formFeedback, 'Contribution ajoutée au journal. Merci pour votre transparence !');
      } catch (error) {
        console.error(error);
        const details = Array.isArray(error.details) ? error.details.join(' ') : '';
        showFeedback(formFeedback, `Impossible d'enregistrer la contribution. ${details}`.trim(), 6000);
      }
    });

    tagFilter.addEventListener('change', () => refreshEntries());
    searchEntries.addEventListener('input', () => refreshEntries());

    exportButton.addEventListener('click', () => {
      const entries = CommunityLog.loadEntries();
      if (!entries.length) {
        showFeedback(exportFeedback, 'Le journal est vide : ajoutez une contribution avant d’exporter.');
        return;
      }
      exportEntriesToFile(entries);
      showFeedback(exportFeedback, 'Fichier exporté. Partagez-le avec votre collectif pour renforcer la transparence.');
    });

    clearButton.addEventListener('click', () => {
      if (confirm('Cette action efface toutes les contributions de ce navigateur. Continuer ?')) {
        CommunityLog.persistEntries([]);
        refreshEntries([]);
        showFeedback(exportFeedback, 'Journal réinitialisé. Les décisions restent documentées si vous avez exporté le fichier.');
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
  })();
