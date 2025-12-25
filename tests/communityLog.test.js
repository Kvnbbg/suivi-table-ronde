const test = require('node:test');
const assert = require('node:assert');
const CommunityLog = require('../js/communityLog');

const mockStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
};

test('sanitizeText removes HTML and extra spaces', () => {
  const unsafe = "  <script>alert('xss')</script>  ";
  const sanitized = CommunityLog.sanitizeText(unsafe);
  assert.strictEqual(sanitized.includes('<'), false);
  assert.strictEqual(sanitized.includes('>'), false);
  assert.strictEqual(sanitized, '&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;');
});

test('createEntry trims inputs and assigns defaults', () => {
  const data = {
    title: '  Décision  ',
    summary: '  Nous avons décidé  ',
    commitments: '  Partager le compte-rendu  ',
    participants: '  Collectif A  ',
    decisionType: 'Consensus ',
    tags: ' coopération, feedback ',
  };

  const entry = CommunityLog.createEntry(data, {
    idGenerator: () => 'entry-1',
    timestamp: () => '2024-01-01T00:00:00.000Z',
  });

  assert.deepStrictEqual(entry, {
    id: 'entry-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    title: 'Décision',
    summary: 'Nous avons décidé',
    commitments: 'Partager le compte-rendu',
    participants: 'Collectif A',
    decisionType: 'consensus',
    tags: ['coopération', 'feedback'],
  });
});

test('validateEntry returns errors for missing fields', () => {
  const validation = CommunityLog.validateEntry({
    title: '',
    summary: '',
    commitments: '',
  });

  assert.strictEqual(validation.valid, false);
  assert.strictEqual(validation.errors.length > 0, true);
});

test('addEntry stores entries in storage sorted by date', () => {
  const storage = mockStorage();
  const older = {
    id: 'entry-older',
    createdAt: '2023-12-01T10:00:00.000Z',
    title: 'Ancienne',
    summary: 'Résumé',
    commitments: 'Action',
    participants: '',
    decisionType: '',
    tags: [],
  };
  const newer = { ...older, id: 'entry-newer', createdAt: '2023-12-02T10:00:00.000Z' };

  CommunityLog.persistEntries([older], storage);
  const entries = CommunityLog.addEntry(newer, storage);

  assert.strictEqual(entries[0].id, 'entry-newer');
  assert.strictEqual(entries[1].id, 'entry-older');
});

test('filterEntries returns matches for tag and search', () => {
  const entries = [
    {
      id: 'entry-1',
      createdAt: '2023-12-01T10:00:00.000Z',
      title: 'Décision',
      summary: 'Partage des notes',
      commitments: 'Envoyer le compte-rendu',
      participants: 'Collectif A',
      decisionType: 'consensus',
      tags: ['transparence'],
    },
    {
      id: 'entry-2',
      createdAt: '2023-12-02T10:00:00.000Z',
      title: 'Question ouverte',
      summary: 'Discussion sur la facilitation',
      commitments: 'Collecter des retours',
      participants: 'Collectif B',
      decisionType: 'consultation',
      tags: ['feedback'],
    },
  ];

  const filtered = CommunityLog.filterEntries(entries, { tag: 'transparence', search: 'compte' });
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].id, 'entry-1');
});

test('removeEntry deletes entry from storage', () => {
  const storage = mockStorage();
  const entries = [
    {
      id: 'entry-1',
      createdAt: '2023-12-01T10:00:00.000Z',
      title: 'Décision',
      summary: 'Partage des notes',
      commitments: 'Envoyer le compte-rendu',
      participants: 'Collectif A',
      decisionType: 'consensus',
      tags: ['transparence'],
    },
  ];

  CommunityLog.persistEntries(entries, storage);
  const remaining = CommunityLog.removeEntry('entry-1', storage);
  assert.strictEqual(remaining.length, 0);
});

test('loadEntries returns empty array for invalid JSON', () => {
  const storage = mockStorage();
  storage.setItem(CommunityLog.STORAGE_KEY, '{invalid json');
  const entries = CommunityLog.loadEntries(storage);
  assert.deepStrictEqual(entries, []);
});

test('createCommunityLog rejects invalid config', () => {
  assert.throws(
    () => CommunityLog.createCommunityLog({ storageKey: '', maxFieldLength: -1, requiredFields: [] }),
    /Configuration invalide/,
  );
});
