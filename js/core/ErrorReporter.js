// js/core/ErrorReporter.js
// Global error hooks -> Logger (and keeps default console behavior).

(function () {
  const Logger = window.Logger || {
    error: function () {},
    warn: function () {},
  };

  // Avoid double-install (hot reload / accidental double script include)
  if (window.__ErrorReporterInstalled) return;
  window.__ErrorReporterInstalled = true;

  window.addEventListener('error', (event) => {
    try {
      const err = event.error;
      Logger.error('Unhandled error event', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: err && err.stack ? String(err.stack) : undefined,
      });
    } catch {
      // ignore
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      Logger.error('Unhandled promise rejection', {
        reason:
          reason instanceof Error
            ? { message: reason.message, stack: reason.stack }
            : reason,
      });
    } catch {
      // ignore
    }
  });

  // Optional: surface a hint for debugging in production builds
  Logger.info?.('ErrorReporter installed');
})();

