// ==========================
// Config da API
// ==========================
const API_BASE_URL = 'https://localhost:7105/api';

// ==========================
// DOM refs
// ==========================
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const contentArea = document.getElementById('contentArea');

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginSpinner = document.getElementById('loginSpinner');
const loginErrorEl = document.getElementById('loginError');

const sidebarNav = document.getElementById('sidebarNav');
const logoutBtn = document.getElementById('logoutBtn');

// ==========================
// Storage helpers
// ==========================
function setAuthData(user, token) {
  try {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    if (token) localStorage.setItem('token', token);
    const empresaId =
      user?.empresaId ||
      user?.empresa_id ||
      user?.empresa?.id ||
      user?.empresaID ||
      null;
    if (empresaId) localStorage.setItem('empresaId', String(empresaId));
  } catch { }
}
function getAuthToken() {
  try { return localStorage.getItem('token'); } catch { return null; }
}
function getStoredUser() {
  try {
    const r = localStorage.getItem('user');
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}
function clearAuth() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('empresaId');
  } catch { }
}

// ==========================
// Fetch wrapper
// ==========================
async function apiRequest(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getAuthToken();
  const finalHeaders = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers: finalHeaders, body });
  let data = null;
  try { data = await res.clone().json(); } catch { }

  if (!res.ok) {
    const msg = (data && (data.title || data.message || data.error)) || `Erro ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return { ok: true, status: res.status, data, raw: res };
}

// ==========================
// UI helpers
// ==========================
function showLogin() {
  loginScreen.classList.add('active');
  mainScreen.classList.remove('active');
  contentArea.innerHTML = '';
  sidebarNav.innerHTML = '';
}
function showMain() {
  loginScreen.classList.remove('active');
  mainScreen.classList.add('active');
  updateUserInfo();
  buildMenu();
  loadDashboard();
}
function updateUserInfo() {
  const user = getStoredUser() || { nome: 'Usuário', perfil: 'Usuário' };
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = user.nome || 'Usuário';
  if (roleEl) roleEl.textContent = user.perfil || 'Usuário';
  if (avatarEl) avatarEl.textContent = (user.nome || 'U').charAt(0).toUpperCase();
}
function renderAlert(msg, type = 'success') {
  const color = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
  return `
    <div class="section" style="border-left:4px solid ${color}; margin-bottom:16px">
      <p style="margin:0; color:${color}; font-weight:600">${msg}</p>
    </div>
  `;
}
function clearErrors(container) {
  container.querySelectorAll('.field-error').forEach(e => e.remove());
  container.querySelectorAll('input,select,textarea').forEach(i => i.classList.remove('error'));
}
function setFieldError(input, message) {
  input.classList.add('error');
  const small = document.createElement('div');
  small.className = 'error-message show field-error';
  small.textContent = message;
  input.insertAdjacentElement('afterend', small);
}

// ==========================
// Menu / Navegação
// ==========================
function buildMenu() {
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
function navigateTo(page) {
  if (page === 'dashboard') loadDashboard();
  else if (page === 'motoristas') renderMotoristasPage();
  else contentArea.innerHTML = `<div class="section">Página ${page} em construção.</div>`;
}

// ==========================
// Login
// ==========================
async function login(email, senha) {
  const payload = { email, senha };
  const r = await apiRequest('/Usuario/autenticar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const d = r.data || {};
  const token = d.token || d.Token || d.accessToken || d.AccessToken || d.jwt || d.JWT;
  const user = d.user || d.usuario || d.User || { nome: 'Usuário', email, perfil: 'Usuário' };

  if (!token) throw new Error('Token não retornado pela API.');
  setAuthData(user, token);
  return { user, token };
}

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = (document.getElementById('email')?.value || '').trim();
    const senha = (document.getElementById('senha')?.value || '').trim();

    loginErrorEl.textContent = '';
    loginErrorEl.classList.remove('show');
    loginBtn.disabled = true;
    loginSpinner.classList.remove('hidden');
    loginBtnText.textContent = 'Entrando...';

    try {
      await login(email, senha);
      showMain();
    } catch (err) {
      const msg = err?.status === 401
        ? 'Sessão não autorizada. Verifique seu login.'
        : err?.message || 'Email ou senha inválidos';
      loginErrorEl.textContent = msg;
      loginErrorEl.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginSpinner.classList.add('hidden');
      loginBtnText.textContent = 'Entrar';
    }
  });

  const senhaInput = document.getElementById('senha');
  const toggleSenha = document.getElementById('toggleSenha');
  if (toggleSenha && senhaInput) {
    toggleSenha.addEventListener('click', () => {
      const isPassword = senhaInput.type === 'password';
      senhaInput.type = isPassword ? 'text' : 'password';
      const i = toggleSenha.querySelector('i');
      if (i) i.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearAuth();
    showLogin();
  });
}

// ===================================================
// ===============  DASHBOARD (API) ==================
// ===================================================
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
function toYMD(v) { if (!v) return null; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; return String(v).slice(0, 10); }
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
function loadDashboard() {
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
  function formatMesLabel(m) { if (/^\d{4}-\d{2}$/.test(m)) return `${m.slice(5, 7)}/${m.slice(0, 4)}`; return m || ''; }
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

    const de = new Date(Date.UTC(+deI.slice(0, 4), +deI.slice(5, 7) - 1, +deI.slice(8, 10), 0, 0, 0));
    const ate = new Date(Date.UTC(+ateI.slice(0, 4), +ateI.slice(5, 7) - 1, +ateI.slice(8, 10), 23, 59, 59));
    filtro = { de: de.toISOString(), ate: ate.toISOString() };
    atualizar();
  });

  document.querySelector('.dash-filters .btn-chip[data-range="30"]').click();
}

// ===================================================
// ===============  MOTORISTAS (API) =================
// ===================================================

// Fallback local (mantido)
const MOTORISTAS_STORE_KEY = 'motoristasDemo';
function getMotoristasFromStore() {
  try { const v = localStorage.getItem(MOTORISTAS_STORE_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function saveMotoristasToStore(list) {
  try { localStorage.setItem(MOTORISTAS_STORE_KEY, JSON.stringify(list || [])); } catch { }
}

// Helpers
function onlyDigits(v) { return (v || '').replace(/\D+/g, ''); }
function validateCPF(cpf) { return onlyDigits(cpf).length === 11; }
function validateCNH(cnh) { return onlyDigits(cnh).length === 11; }
function firstLetter(name) { return (name || 'U').trim().charAt(0).toUpperCase(); }
function formatCPF(cpf) { const d = onlyDigits(cpf).padEnd(11, ' '); return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`.trim(); }
function formatCNH(cnh) { const d = onlyDigits(cnh); return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || d; }

// API helpers Motorista
async function fetchMotoristasFromApi() {
  const basePath = '/Motorista/Buscar%20varios';
  const empresaId = localStorage.getItem('empresaId');
  let data = [];

  if (empresaId) {
    try {
      const r1 = await apiRequest(`${basePath}?empresaId=${encodeURIComponent(empresaId)}`, { method: 'GET' });
      data = Array.isArray(r1.data) ? r1.data : [];
      if (data.length === 0) {
        // tenta sem filtro (pode haver motorista sem empresa)
        const r2 = await apiRequest(basePath, { method: 'GET' });
        data = Array.isArray(r2.data) ? r2.data : [];
      }
    } catch (e) {
      // se der erro real, propaga
      throw e;
    }
  } else {
    const r = await apiRequest(basePath, { method: 'GET' });
    data = Array.isArray(r.data) ? r.data : [];
  }

  return data.map(m => ({
    id: m.id,
    nome: m.nome,
    cpf: m.cpf,
    email: m.email,
    numeroCnh: m.numeroCnh,
    validadeCnh: (m.validadeCnh || '').slice(0, 10),
    categoriaCnh: m.categoriaCnh,
    status: 'ativo'
  }));
}

let motoristasCache = []; // fonte para filtros/render

function renderMotoristasPage() {
  contentArea.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header motoristas-header">
        <div>
          <h1><i class="fa-solid fa-id-card"></i> Motoristas</h1>
          <p>Gerencie seus motoristas vinculados à empresa (ou cadastre independentes).</p>
        </div>
        <button id="btnMostrarFormulario" class="btn-primary" style="width:auto;max-width:260px;">
          <i class="fa-solid fa-user-plus"></i> Cadastrar Motorista
        </button>
      </div>

      <div id="motoristasFeedback"></div>

      <div class="section motoristas-filtros">
        <div class="filters-row">
          <div class="form-group">
            <label>Buscar</label>
            <input id="filtroBusca" type="text" placeholder="Nome ou CPF" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="filtroStatus">
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div class="filters-actions">
            <button id="btnAplicarFiltros" class="btn-primary" style="width:auto;min-width:150px;"><i class="fa-solid fa-filter"></i> Filtrar</button>
            <button id="btnLimparFiltros" class="logout-btn" style="width:auto;min-width:150px;"><i class="fa-solid fa-eraser"></i> Limpar</button>
          </div>
        </div>
      </div>

      <div id="listaMotoristas" class="section">
        <h3><i class="fa-solid fa-list"></i> Motoristas da Empresa</h3>
        <div id="listaConteudo" class="motoristas-list">${renderEmptyState()}</div>
      </div>

      <div id="formularioMotorista" class="section" style="display:none;">
        <h3><i class="fa-solid fa-user-plus"></i> Cadastrar Motorista</h3>

        <form id="formMotorista" novalidate>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Nome *</label>
              <input id="mNome" type="text" placeholder="Nome completo" required />
            </div>
            <div class="form-group">
              <label>CPF *</label>
              <input id="mCpf" type="text" inputmode="numeric" placeholder="Somente números" maxlength="11" required />
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Email *</label>
              <input id="mEmail" type="email" placeholder="email@exemplo.com" required />
            </div>
            <div class="form-group">
              <label>Senha *</label>
              <input id="mSenha" type="password" placeholder="••••••" required />
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Número CNH *</label>
              <input id="mCnh" type="text" inputmode="numeric" placeholder="11 dígitos" maxlength="11" required />
            </div>
            <div class="form-group">
              <label>Validade CNH *</label>
              <input id="mValidade" type="date" required />
            </div>
            <div class="form-group">
              <label>Categoria CNH *</label>
              <input id="mCategoria" type="text" placeholder="Ex.: A, B, C, D, E" required />
            </div>
          </div>

          <div class="form-row buttons">
            <button type="submit" class="btn-primary" style="min-width:160px;height:42px;display:flex;align-items:center;gap:6px;justify-content:center;">
              <i class="fa-solid fa-floppy-disk"></i> Cadastrar
            </button>
            <button type="button" id="btnCancelarMotorista" class="logout-btn" style="min-width:160px;height:42px;display:flex;align-items:center;gap:6px;justify-content:center;border-color:#6b7280;color:#374151;">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const btnMostrar = document.getElementById('btnMostrarFormulario');
  const formWrap = document.getElementById('formularioMotorista');
  const listaWrap = document.getElementById('listaMotoristas');
  const feedback = document.getElementById('motoristasFeedback');
  const btnCancel = document.getElementById('btnCancelarMotorista');
  const form = document.getElementById('formMotorista');

  const filtroBusca = document.getElementById('filtroBusca');
  const filtroStatus = document.getElementById('filtroStatus');
  const btnAplicar = document.getElementById('btnAplicarFiltros');
  const btnLimpar = document.getElementById('btnLimparFiltros');

  btnMostrar.addEventListener('click', () => {
    listaWrap.style.display = 'none';
    formWrap.style.display = 'block';
    feedback.innerHTML = '';
  });
  btnCancel.addEventListener('click', () => {
    form.reset();
    clearErrors(formWrap);
    formWrap.style.display = 'none';
    listaWrap.style.display = 'block';
    feedback.innerHTML = '';
  });
  form.addEventListener('submit', onSubmitMotorista);

  function aplicarFiltros() {
    const q = (filtroBusca.value || '').toLowerCase().trim();
    const st = filtroStatus.value;
    const base = motoristasCache.length ? motoristasCache : getMotoristasFromStore();

    const filtrados = base.filter(m => {
      const matchQ = !q || (m.nome || '').toLowerCase().includes(q) || onlyDigits(m.cpf).includes(onlyDigits(q));
      const matchS = st === 'todos' || (m.status || 'ativo') === st;
      return matchQ && matchS;
    });
    renderMotoristasList(filtrados);
  }
  btnAplicar.addEventListener('click', aplicarFiltros);
  btnLimpar.addEventListener('click', () => {
    filtroBusca.value = '';
    filtroStatus.value = 'todos';
    aplicarFiltros();
  });

  // carrega da API (sem tratar "vazio" como erro). Só mostra banner se de fato der erro.
  (async () => {
    try {
      motoristasCache = await fetchMotoristasFromApi();
      renderMotoristasList(motoristasCache);
    } catch (err) {
      renderMotoristasList(getMotoristasFromStore());
      feedback.innerHTML = renderAlert('Não foi possível comunicar com a API. Exibindo dados locais.', 'info');
    }
  })();
}

function renderEmptyState() {
  return `
    <div class="motoristas-empty">
      <i class="fa-solid fa-user-large"></i>
      <h4>Nenhum motorista cadastrado</h4>
      <p>Comece clicando no botão <b>Cadastrar Motorista</b> no topo.</p>
    </div>`;
}
function renderMotoristasList(items) {
  const el = document.getElementById('listaConteudo');
  if (!items || !items.length) { el.innerHTML = renderEmptyState(); return; }

  el.innerHTML = items.map((m, idx) => `
    <div class="motorista-card" data-index="${idx}">
      <div class="motorista-avatar">${firstLetter(m.nome)}</div>
      <div class="motorista-info">
        <div class="motorista-name">${m.nome}</div>
        <div class="motorista-meta">
          <span><i class="fa-regular fa-id-card"></i> CPF: ${formatCPF(m.cpf)}</span>
          <span><i class="fa-solid fa-id-card-clip"></i> CNH: ${formatCNH(m.numeroCnh)}</span>
          <span><i class="fa-regular fa-calendar"></i> Validade: ${m.validadeCnh}</span>
          <span><i class="fa-solid fa-a"></i> Categoria: ${m.categoriaCnh}</span>
        </div>
      </div>
      <div class="motorista-status ${m.status === 'inativo' ? 'off' : 'on'}">
        ${m.status === 'inativo' ? 'Inativo' : 'Ativo'}
      </div>
      <div class="motorista-actions">
        <button class="btn-edit"   title="Editar"  disabled><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="btn-remove" title="Excluir" disabled><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>`).join('');
}

// Cadastrar via API (fallback salva local)
async function onSubmitMotorista(e) {
  e.preventDefault();

  const formWrap = document.getElementById('formularioMotorista');
  const feedback = document.getElementById('motoristasFeedback');
  clearErrors(formWrap);
  feedback.innerHTML = '';

  const nome = document.getElementById('mNome');
  const cpf = document.getElementById('mCpf');
  const email = document.getElementById('mEmail');
  const senha = document.getElementById('mSenha');
  const cnh = document.getElementById('mCnh');
  const validade = document.getElementById('mValidade');
  const categoria = document.getElementById('mCategoria');

  let ok = true;
  if (!nome.value.trim()) { setFieldError(nome, 'Informe o nome.'); ok = false; }
  if (!validateCPF(cpf.value)) { setFieldError(cpf, 'CPF precisa ter 11 dígitos numéricos.'); ok = false; }
  if (!email.value.trim()) { setFieldError(email, 'Informe o email.'); ok = false; }
  if (!senha.value.trim()) { setFieldError(senha, 'Informe a senha.'); ok = false; }
  if (!validateCNH(cnh.value)) { setFieldError(cnh, 'CNH precisa ter 11 dígitos numéricos.'); ok = false; }
  if (!validade.value) { setFieldError(validade, 'Informe a validade.'); ok = false; }
  if (!categoria.value.trim()) { setFieldError(categoria, 'Informe a categoria.'); ok = false; }
  if (!ok) return;

  const empresaId = localStorage.getItem('empresaId') || null;
  const payload = {
    nome: nome.value.trim(),
    cpf: onlyDigits(cpf.value),
    email: email.value.trim(),
    senha: senha.value.trim(),
    numeroCnh: onlyDigits(cnh.value),
    validadeCnh: new Date(`${validade.value}T00:00:00Z`).toISOString(),
    categoriaCnh: categoria.value.trim(),
    empresaId
  };

  try {
    await apiRequest('/Motorista/Registrar%20Sem%20empresa', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    feedback.innerHTML = renderAlert('Motorista cadastrado com sucesso!', 'success');
    e.target.reset();

    // recarrega da API (agora SEM tratar "vazio" como erro)
    try {
      motoristasCache = await fetchMotoristasFromApi();
      renderMotoristasList(motoristasCache);
    } catch { }

    document.getElementById('formularioMotorista').style.display = 'none';
    document.getElementById('listaMotoristas').style.display = 'block';
  } catch (err) {
    // fallback local
    const list = getMotoristasFromStore();
    list.push({
      nome: payload.nome,
      cpf: payload.cpf,
      email: payload.email,
      senha: payload.senha,
      numeroCnh: payload.numeroCnh,
      validadeCnh: validade.value,
      categoriaCnh: payload.categoriaCnh,
      status: 'ativo'
    });
    saveMotoristasToStore(list);
    renderMotoristasList(list);

    feedback.innerHTML = renderAlert('API indisponível; salvo localmente para testes.', 'info');
    document.getElementById('formularioMotorista').style.display = 'none';
    document.getElementById('listaMotoristas').style.display = 'block';
  }
}

// ==========================
// Bootstrap
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  if (loginSpinner) loginSpinner.classList.add('hidden');
  const token = getAuthToken();
  if (token) showMain(); else showLogin();
});
