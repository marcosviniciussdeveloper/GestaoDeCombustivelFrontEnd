import { renderMotoristasPage } from './motoristas.js';
import { loadDashboard } from './dashboard.js';

// Monta o menu lateral
export function buildMenu() {
  const sidebarNav = document.getElementById('sidebarNav');
  const items = [
    { icon: 'fa-solid fa-chart-line', label: 'Dashboard', page: 'dashboard' },
    { icon: 'fa-solid fa-id-card', label: 'Motoristas', page: 'motoristas' },
  ];

  sidebarNav.innerHTML = items.map(it => `
    <div class="nav-item" data-page="${it.page}">
      <i class="${it.icon} nav-icon"></i>${it.label}
    </div>
  `).join('');

  sidebarNav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebarNav.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      navigateTo(el.dataset.page);
    });
  });

  const first = sidebarNav.querySelector('.nav-item');
  if (first) first.classList.add('active');
}

export function navigateTo(page) {
  if (page === 'dashboard') loadDashboard();
  else if (page === 'motoristas') renderMotoristasPage();
  else document.getElementById('contentArea').innerHTML = `<div class="section">Página ${page} em construção.</div>`;
}
