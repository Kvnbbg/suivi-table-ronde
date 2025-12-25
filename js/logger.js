(function (global) {
  'use strict';

  const defaultConsole = typeof console !== 'undefined'
    ? console
    : { log: () => {}, info: () => {}, warn: () => {}, error: () => {} };

  function createLogger(options = {}) {
    const namespace = options.namespace || 'suivi-table-ronde';
    const targetConsole = options.console || defaultConsole;

    function log(level, event, context = {}) {
      const payload = {
        timestamp: new Date().toISOString(),
        namespace,
        level,
        event,
        ...context,
      };
      const method = targetConsole[level] || targetConsole.log;
      method.call(targetConsole, payload);
    }

    return {
      info: (event, context) => log('info', event, context),
      warn: (event, context) => log('warn', event, context),
      error: (event, context) => log('error', event, context),
    };
  }

  const api = {
    createLogger,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.SuiviLogger = api;
})(typeof window !== 'undefined' ? window : globalThis);
