// Shared UI helpers: escaping, confirm dialog, toast.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Build a view container with the given class and inner HTML. */
export function createView(className, html = '') {
  const node = document.createElement('div');
  node.className = `view ${className}`;
  node.innerHTML = html;
  return node;
}

/**
 * Show the shared confirm dialog.
 * @returns {Promise<boolean>} true if confirmed.
 */
export function confirmDialog({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel' }) {
  const dialog = document.getElementById('confirm-dialog');
  dialog.querySelector('[data-title]').textContent = title;
  dialog.querySelector('[data-message]').textContent = message;
  dialog.querySelector('[data-confirm]').textContent = confirmLabel;
  dialog.querySelector('[data-cancel]').textContent = cancelLabel;

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
    dialog.returnValue = '';
    dialog.showModal();
    dialog.querySelector('[data-cancel]').focus();
  });
}

let toastTimer = null;

/**
 * Show a short message at the bottom of the screen.
 * @param {string} message
 * @param {{actionLabel?: string, onAction?: () => void, duration?: number}} [options]
 *   duration of 0 keeps the toast until the action is tapped.
 */
export function showToast(message, { actionLabel, onAction, duration = 3000 } = {}) {
  const toast = document.getElementById('toast');
  const text = toast.querySelector('[data-toast-message]');
  const action = toast.querySelector('[data-toast-action]');

  clearTimeout(toastTimer);
  text.textContent = message;

  if (actionLabel && onAction) {
    action.textContent = actionLabel;
    action.hidden = false;
    action.onclick = () => {
      toast.hidden = true;
      onAction();
    };
  } else {
    action.hidden = true;
    action.onclick = null;
  }

  // Restart the entry animation.
  toast.hidden = true;
  void toast.offsetWidth;
  toast.hidden = false;

  if (duration > 0) {
    toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
  }
}

export function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}
