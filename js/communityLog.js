(function (global) {
  'use strict';

  const STORAGE_KEY = 'communityLogEntries';
  const MAX_FIELD_LENGTH = 2000;
  const REQUIRED_FIELDS = ['title', 'summary', 'commitments'];

  const defaultIdGenerator = () => `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const defaultTimestamp = () => new Date().toISOString();

  function sanitizeText(value = '') {
    return value
      .toString()
      .replace(/[&<>"']/g, (character) => {
        switch (character) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          case "'":
            return '&#39;';
          default:
            return character;
        }
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) {
      return tags
        .map((tag) => sanitizeText(tag).toLowerCase())
        .filter(Boolean);
    }
    return sanitizeText(tags)
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }

  function validateEntry(data = {}) {
    const errors = [];

    REQUIRED_FIELDS.forEach((field) => {
      if (!data[field] || !sanitizeText(data[field])) {
        errors.push(`Le champ « ${field} » est obligatoire.`);
      }
    });

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > MAX_FIELD_LENGTH) {
        errors.push(`Le champ « ${key} » dépasse la longueur autorisée.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  function createEntry(data = {}, options = {}) {
    const { idGenerator = defaultIdGenerator, timestamp = defaultTimestamp } = options;
    const validation = validateEntry(data);

    if (!validation.valid) {
      const error = new Error('Entrée invalide');
      error.details = validation.errors;
      throw error;
    }

    return {
      id: idGenerator(),
      createdAt: timestamp(),
      title: sanitizeText(data.title),
      summary: sanitizeText(data.summary),
      commitments: sanitizeText(data.commitments),
      participants: sanitizeText(data.participants || ''),
      decisionType: sanitizeText(data.decisionType || '').toLowerCase(),
      tags: normalizeTags(data.tags),
    };
  }

  function loadEntries(storage = global.localStorage) {
    if (!storage) return [];
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((entry) => entry && entry.id && entry.createdAt);
    } catch (error) {
      console.warn('Impossible de charger les entrées :', error);
      return [];
    }
  }

  function persistEntries(entries, storage = global.localStorage) {
    if (!storage) return;
    const safeEntries = Array.isArray(entries) ? entries : [];
    storage.setItem(STORAGE_KEY, JSON.stringify(safeEntries));
  }

  function addEntry(entry, storage = global.localStorage) {
    const entries = loadEntries(storage);
    entries.push(entry);
    const ordered = sortEntries(entries);
    persistEntries(ordered, storage);
    return ordered;
  }

  function removeEntry(id, storage = global.localStorage) {
    const entries = loadEntries(storage).filter((entry) => entry.id !== id);
    persistEntries(entries, storage);
    return entries;
  }

  function sortEntries(entries) {
    return [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function filterEntries(entries, { tag = '', search = '' } = {}) {
    const normalizedTag = sanitizeText(tag).toLowerCase();
    const normalizedSearch = sanitizeText(search).toLowerCase();

    return entries.filter((entry) => {
      const matchesTag =
        !normalizedTag ||
        entry.tags.includes(normalizedTag) ||
        entry.decisionType === normalizedTag;

      const searchableText = [
        entry.title,
        entry.summary,
        entry.commitments,
        entry.participants,
        entry.decisionType,
        entry.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesTag && matchesSearch;
    });
  }

  function uniqueTags(entries) {
    const tags = new Set();
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => tags.add(tag));
      if (entry.decisionType) {
        tags.add(entry.decisionType);
      }
    });
    return Array.from(tags).sort();
  }

  const api = {
    STORAGE_KEY,
    sanitizeText,
    normalizeTags,
    validateEntry,
    createEntry,
    loadEntries,
    persistEntries,
    addEntry,
    removeEntry,
    sortEntries,
    filterEntries,
    uniqueTags,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.CommunityLog = api;
})(typeof window !== 'undefined' ? window : globalThis);
