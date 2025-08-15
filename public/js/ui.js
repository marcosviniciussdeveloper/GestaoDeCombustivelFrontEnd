// js/ui.js
export function renderAlert(container, {
  type = 'info',       // 'success' | 'warning' | 'error' | 'info'
  title = '',
  message = ''
} = {}) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!el) return;

  const colors = {
    success: '#16a34a',
    warning: '#b45309',
    error:   '#dc2626',
    info:    '#2563eb'
  };

  el.innerHTML = `
    <div class="alert-box" style="
      border:1px solid #e5e7eb;
      background:#fff;
      border-radius:10px;
      padding:14px 16px;
      display:flex; gap:10px; align-items:flex-start">
      <div style="width:8px;height:8px;border-radius:50%;margin-top:6px;background:${colors[type] ?? colors.info}"></div>
      <div>
        ${title ? `<div style="font-weight:700;margin-bottom:4px">${title}</div>` : ''}
        <div>${message}</div>
      </div>
    </div>`;
}
