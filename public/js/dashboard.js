import { apiRequest, toYMD } from './api.js';
import { renderAlert } from './ui.js';

function renderDashShell() {
  return `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>🔥 Dashboard Combustível</h1>
        <p>Selecione um período e veja os indicadores em tempo real.</p>

        <div class="dash-filters">
          <div class="range-buttons">
            <button class="btn-chip" data-range="7">7 dias</button>
            <button class="btn-chip" data-range="30">30 dias</button>
            <button class="btn-chip" data-range="90">90 dias</button>
          </div>
          <div class="range-custom">
            <input type="date" id="dashDe"/>
            <span class="sep">—</span>
            <input type="date" id="dashAte"/>
            <button id="dashAplicar" class="btn-primary btn-apply">Aplicar</button>
          </div>
        </div>
      </div>

      <div class="stats-grid" id="dashCards">
        <div class="stat-card skeleton"><div class="stat-icon"></div><div class="stat-info"><div class="sk-bar"></div><div class="sk-bar small"></div></div></div>
        <div class="stat-card skeleton"><div class="stat-icon"></div><div class="stat-info"><div class="sk-bar"></div><div class="sk-bar small"></div></div></div>
        <div class="stat-card skeleton"><div class="stat-icon"></div><div class="stat-info"><div class="sk-bar"></div><div class="sk-bar small"></div></div></div>
        <div class="stat-card skeleton"><div class="stat-icon"></div><div class="stat-info"><div class="sk-bar"></div><div class="sk-bar small"></div></div></div>
      </div>

      <div class="kpi-grid" id="kpis">
        <div class="kpi-card skeleton"><div class="kpi-title sk-bar small"></div><div class="kpi-value sk-bar"></div></div>
        <div class="kpi-card skeleton"><div class="kpi-title sk-bar small"></div><div class="kpi-value sk-bar"></div></div>
        <div class="kpi-card skeleton"><div class="kpi-title sk-bar small"></div><div class="kpi-value sk-bar"></div></div>
      </div>

      <div class="section">
        <h3><i class="fa-regular fa-chart-bar"></i> Gastos por mês</h3>
        <div id="chartMensal" class="bars-wrap skeleton">
          <div class="bars"></div>
        </div>
      </div>

      <div class="section" id="dashRecentes">
        <h3><i class="fa-solid fa-fire"></i> Atividade Recente</h3>
        <div class="activity-list">
          <div class="activity-item skeleton"><div class="activity-icon"></div><span class="sk-bar wide"></span><span class="sk-bar small"></span></div>
          <div class="activity-item skeleton"><div class="activity-icon"></div><span class="sk-bar wide"></span><span class="sk-bar small"></span></div>
        </div>
      </div>
    </div>
  `;
}

function buildDashQuery({ de, ate }) {
  const qs = new URLSearchParams();
  const empresaId = localStorage.getItem('empresaId');
  if (empresaId) qs.set('empresaId', empresaId);
  const d = toYMD(de);
  const a = toYMD(ate);
  if (d) qs.set('de', d);
  if (a) qs.set('ate', a);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function loadDashboardData({ de, ate }) {
  const query = buildDashQuery({ de, ate });
  const { data } = await apiRequest(`/Dashboard${query}`, { method: 'GET' });
  return {
    empresasAtivas: data?.empresasAtivas ?? data?.empresas ?? 0,
    totalMotoristas: data?.totalMotoristas ?? data?.motoristas ?? 0,
    totalVeiculos: data?.totalVeiculos ?? data?.veiculos ?? 0,
    totalAbastecimentos: data?.totalAbastecimentos ?? data?.abastecimentos ?? 0,
    totalCusto: data?.totalCusto ?? data?.custoTotal ?? 0,
    totalLitros: data?.totalLitros ?? data?.litrosTotal ?? 0,
    recentes: Array.isArray(data?.recentes) ? data.recentes : [],
  };
}

async function loadMensalData({ de, ate }) {
  const query = buildDashQuery({ de, ate });
  const { data } = await apiRequest(`/Dashboard/mensal${query}`, { method: 'GET' });
  const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return arr.map(x => ({
    mes: x.mes ?? x.label ?? '',
    totalCusto: Number(x.totalCusto ?? x.custo ?? 0),
    totalLitros: Number(x.totalLitros ?? x.litros ?? 0),
  }));
}

export function loadDashboard() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = renderDashShell();

  const cards = document.getElementById('dashCards');
  const kpisEl = document.getElementById('kpis');
  const recentesEl = document.getElementById('dashRecentes').querySelector('.activity-list');
  const chartWrap = document.getElementById('chartMensal');

  function renderCards(d) {
    cards.innerHTML = `
      <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-building"></i></div>
        <div class="stat-info"><div class="stat-number">${d.empresasAtivas}</div><div class="stat-label">Empresas Ativas</div></div>
      </div>
      <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-users"></i></div>
        <div class="stat-info"><div class="stat-number">${d.totalMotoristas}</div><div class="stat-label">Motoristas</div></div>
      </div>
      <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-car"></i></div>
        <div class="stat-info"><div class="stat-number">${d.totalVeiculos}</div><div class="stat-label">Veículos</div></div>
      </div>
      <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-gas-pump"></i></div>
        <div class="stat-info"><div class="stat-number">${d.totalAbastecimentos}</div><div class="stat-label">Abastecimentos</div></div>
      </div>`;
  }

  function renderKPIs(d) {
    const custoLitro = d.totalLitros ? d.totalCusto / d.totalLitros : 0;
    const custoAbast = d.totalAbastecimentos ? d.totalCusto / d.totalAbastecimentos : 0;
    const litrosAbast = d.totalAbastecimentos ? d.totalLitros / d.totalAbastecimentos : 0;
    kpisEl.innerHTML = `
      <div class="kpi-card"><div class="kpi-title">Custo médio / L</div><div class="kpi-value">R$ ${custoLitro.toFixed(2)}</div></div>
      <div class="kpi-card"><div class="kpi-title">Custo médio / Abast.</div><div class="kpi-value">R$ ${custoAbast.toFixed(2)}</div></div>
      <div class="kpi-card"><div class="kpi-title">Média L / Abast.</div><div class="kpi-value">${litrosAbast.toFixed(2)} L</div></div>`;
  }

  function formatMesLabel(m) { if (/^\d{4}-\d{2}$/.test(m)) return `${m.slice(5,7)}/${m.slice(0,4)}`; return m || ''; }

  function renderMensal(mensal) {
    const max = Math.max(1, ...mensal.map(m => m.totalCusto));
    const bars = mensal.map(m => {
      const h = Math.round((m.totalCusto / max) * 160) + 6;
      const label = formatMesLabel(m.mes);
      return `
        <div class="bar">
          <div class="bar-fill" style="height:${h}px" title="R$ ${m.totalCusto.toFixed(2)}"></div>
          <div class="bar-x">${label}</div>
        </div>`;
    }).join('');
    chartWrap.classList.remove('skeleton');
    chartWrap.querySelector('.bars').innerHTML = bars || '<div class="empty-barchart">Sem dados mensais.</div>';
  }

  function renderRecentes(list) {
    if (!list.length) {
      recentesEl.innerHTML = `
        <div class="activity-item">
          <div class="activity-icon"><i class="fa-regular fa-clock"></i></div>
          <span class="activity-text">Sem atividades no período selecionado.</span>
        </div>`;
      return;
    }
    recentesEl.innerHTML = list.slice(0, 6).map(r => `
      <div class="activity-item">
        <div class="activity-icon"><i class="fa-solid fa-gas-pump"></i></div>
        <span class="activity-text">${r.descricao || 'Registro de abastecimento'}</span>
        <span class="activity-time">${r.quando || ''}</span>
      </div>`).join('');
  }

  let filtro = { de: null, ate: null };

  async function atualizar() {
    try {
      const dados = await loadDashboardData(filtro);
      renderCards(dados);
      renderKPIs(dados);
      renderRecentes(dados.recentes || []);
      const mensal = await loadMensalData(filtro);
      renderMensal(mensal);
    } catch (e) {
      const msg = e?.status === 401 ? 'Não autorizado. Faça login novamente.' : e?.message || 'Falha ao carregar o dashboard';
      cards.innerHTML = renderAlert(msg, 'error');
      kpisEl.innerHTML = '';
      chartWrap.querySelector('.bars').innerHTML = '';
      recentesEl.innerHTML = '';
    }
  }

  document.querySelectorAll('.dash-filters .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const dias = Number(btn.dataset.range || 7);
      const ate = new Date();
      const de = new Date();
      de.setDate(ate.getDate() - dias);

      const isoDe = new Date(Date.UTC(de.getFullYear(), de.getMonth(), de.getDate(), 0, 0, 0)).toISOString();
      const isoAte = new Date(Date.UTC(ate.getFullYear(), ate.getMonth(), ate.getDate(), 23, 59, 59)).toISOString();

      document.getElementById('dashDe').value = isoDe.slice(0, 10);
      document.getElementById('dashAte').value = isoAte.slice(0, 10);

      filtro = { de: isoDe, ate: isoAte };
      atualizar();
    });
  });

  document.getElementById('dashAplicar').addEventListener('click', () => {
    const deI = document.getElementById('dashDe').value;
    const ateI = document.getElementById('dashAte').value;
    if (!deI || !ateI) return;

    const de = new Date(Date.UTC(+deI.slice(0,4), +deI.slice(5,7)-1, +deI.slice(8,10), 0,0,0));
    const ate = new Date(Date.UTC(+ateI.slice(0,4), +ateI.slice(5,7)-1, +ateI.slice(8,10), 23,59,59));
    filtro = { de: de.toISOString(), ate: ate.toISOString() };
    atualizar();
  });

  document.querySelector('.dash-filters .btn-chip[data-range="30"]').click();
}
