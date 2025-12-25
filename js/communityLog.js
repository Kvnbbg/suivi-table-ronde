(function (global) {
  'use strict';

  /**
   * @typedef {Object} CommunityLogConfig
   * @property {string} storageKey
   * @property {number} maxFieldLength
   * @property {string[]} requiredFields
   * @property {{info: Function, warn: Function, error: Function}} logger
   */

  const DEFAULT_CONFIG = {
    storageKey: 'communityLogEntries',
    maxFieldLength: 2000,
    requiredFields: ['title', 'summary', 'commitments'],
  };

  const defaultIdGenerator = () => `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const defaultTimestamp = () => new Date().toISOString();

  function createFallbackLogger() {
    const targetConsole = typeof console !== 'undefined'
      ? console
      : { log: () => {}, info: () => {}, warn: () => {}, error: () => {} };
    const log = (level, event, context = {}) => {
      const payload = {
        timestamp: new Date().toISOString(),
        namespace: 'community-log',
        level,
        event,
        ...context,
      };
      const method = targetConsole[level] || targetConsole.log;
      method.call(targetConsole, payload);
    };

    return {
      info: (event, context) => log('info', event, context),
      warn: (event, context) => log('warn', event, context),
      error: (event, context) => log('error', event, context),
    };
  }

  function createAppError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details) {
      error.details = details;
    }
    return error;
  }

  function validateConfig(options = {}) {
    const errors = [];
    const storageKey = options.storageKey ?? DEFAULT_CONFIG.storageKey;
    const maxFieldLength = options.maxFieldLength ?? DEFAULT_CONFIG.maxFieldLength;
    const requiredFields = options.requiredFields ?? DEFAULT_CONFIG.requiredFields;
    const logger = options.logger ?? createFallbackLogger();

    if (typeof storageKey !== 'string' || !storageKey.trim()) {
      errors.push('storageKey doit être une chaîne non vide.');
    }
    if (!Number.isFinite(maxFieldLength) || maxFieldLength <= 0) {
      errors.push('maxFieldLength doit être un nombre positif.');
    }
    if (!Array.isArray(requiredFields) || requiredFields.length === 0) {
      errors.push('requiredFields doit être un tableau non vide.');
    }
    if (typeof logger?.info !== 'function' || typeof logger?.warn !== 'function' || typeof logger?.error !== 'function') {
      errors.push('logger doit exposer info/warn/error.');
    }

    if (errors.length) {
      throw createAppError('CONFIG_INVALID', 'Configuration invalide.', errors);
    }

    return {
      storageKey: storageKey.trim(),
      maxFieldLength,
      requiredFields: requiredFields.map((field) => field.toString()),
      logger,
    };
  }

  function sanitizeText(value = '') {
    return value
      .toString()
      .replace(/[&<>"]/g, (character) => {
        switch (character) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          default:
            return character;
        }
      })
      .replace(/'/g, '&#39;')
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

  function createCommunityLog(options = {}) {
    const config = validateConfig(options);
    const logger = config.logger;

    function validateEntry(data = {}) {
      const errors = [];

      config.requiredFields.forEach((field) => {
        if (!data[field] || !sanitizeText(data[field])) {
          errors.push(`Le champ « ${field} » est obligatoire.`);
        }
      });

      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > config.maxFieldLength) {
          errors.push(`Le champ « ${key} » dépasse la longueur autorisée (${config.maxFieldLength}).`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    }

    function createEntry(data = {}, entryOptions = {}) {
      const { idGenerator = defaultIdGenerator, timestamp = defaultTimestamp } = entryOptions;
      const validation = validateEntry(data);

      if (!validation.valid) {
        throw createAppError('ENTRY_INVALID', 'Entrée invalide.', validation.errors);
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
        const raw = storage.getItem(config.storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((entry) => entry && entry.id && entry.createdAt);
      } catch (error) {
        logger.warn('storage.load_failed', {
          message: 'Impossible de charger les entrées.',
          error: error?.message,
        });
        return [];
      }
    }

    function persistEntries(entries, storage = global.localStorage) {
      if (!storage) return;
      const safeEntries = Array.isArray(entries) ? entries : [];
      try {
        storage.setItem(config.storageKey, JSON.stringify(safeEntries));
      } catch (error) {
        logger.error('storage.write_failed', {
          message: 'Impossible de sauvegarder les entrées.',
          error: error?.message,
        });
        throw createAppError('STORAGE_WRITE_FAILED', 'Impossible de sauvegarder le journal.', error?.message);
      }
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
        const safeTags = Array.isArray(entry.tags) ? entry.tags : [];
        const matchesTag =
          !normalizedTag ||
          safeTags.includes(normalizedTag) ||
          entry.decisionType === normalizedTag;

        const searchableText = [
          entry.title,
          entry.summary,
          entry.commitments,
          entry.participants,
          entry.decisionType,
          safeTags.join(' '),
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
        const safeTags = Array.isArray(entry.tags) ? entry.tags : [];
        safeTags.forEach((tag) => tags.add(tag));
        if (entry.decisionType) {
          tags.add(entry.decisionType);
        }
      });
      return Array.from(tags).sort();
    }

    return {
      STORAGE_KEY: config.storageKey,
      config,
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
  }

  const api = createCommunityLog();
  api.createCommunityLog = createCommunityLog;
  api.createAppError = createAppError;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.CommunityLog = api;
})(typeof window !== 'undefined' ? window : globalThis);
