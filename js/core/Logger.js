// js/core/Logger.js
// A tiny, dependency-free logger with levels and optional buffering.

(function () {
  const LEVELS = /** @type {const} */ ({
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  });

  const DEFAULT_LEVEL =
    (typeof location !== 'undefined' &&
      /[?&]log=(silent|error|warn|info|debug)\b/i.exec(location.search)?.[1]?.toLowerCase()) ||
    'info';

  /** @type {keyof typeof LEVELS} */
  let level = /** @type {any} */ (DEFAULT_LEVEL in LEVELS ? DEFAULT_LEVEL : 'info');

  /** @type {Array<{ts:number, level:string, args:any[]}>} */
  const buffer = [];
  let bufferEnabled = true;
  const maxBuffer = 500;

  function nowTs() {
    return Date.now();
  }

  function shouldLog(lvl) {
    return LEVELS[lvl] <= LEVELS[level];
  }

  function pushBuffer(lvl, args) {
    if (!bufferEnabled) return;
    buffer.push({ ts: nowTs(), level: lvl, args: Array.from(args) });
    if (buffer.length > maxBuffer) buffer.splice(0, buffer.length - maxBuffer);
  }

  function prefix(lvl) {
    return `[${lvl.toUpperCase()}]`;
  }

  function callConsole(method, lvl, args) {
    try {
      // Keep original args (objects stay inspectable), but add a small prefix.
      // eslint-disable-next-line no-console
      (console[method] || console.log).apply(console, [prefix(lvl), ...Array.from(args)]);
    } catch {
      // ignore
    }
  }

  const Logger = {
    LEVELS,

    getLevel() {
      return level;
    },

    /** @param {keyof typeof LEVELS} next */
    setLevel(next) {
      if (!next || !(next in LEVELS)) return;
      level = next;
    },

    enableBuffer(enabled) {
      bufferEnabled = !!enabled;
    },

    getBuffer() {
      return buffer.slice();
    },

    clearBuffer() {
      buffer.length = 0;
    },

    debug() {
      pushBuffer('debug', arguments);
      if (!shouldLog('debug')) return;
      callConsole('log', 'debug', arguments);
    },

    info() {
      pushBuffer('info', arguments);
      if (!shouldLog('info')) return;
      callConsole('log', 'info', arguments);
    },

    warn() {
      pushBuffer('warn', arguments);
      if (!shouldLog('warn')) return;
      callConsole('warn', 'warn', arguments);
    },

    error() {
      pushBuffer('error', arguments);
      if (!shouldLog('error')) return;
      callConsole('error', 'error', arguments);
    },
  };

  // Expose globally (this project uses global singletons).
  window.Logger = Logger;
})();
