// js/motoristas.js
import { api } from "./api.js";
import { session, roles } from "./storage.js";
import { toast, showSkeletonList, showBannerOffline } from "./ui.js";

const state = {
  empresaId: null,
  page: 1,
  pageSize: 20,
  status: "todos",
  q: "",
  loading: false,
  ended: false,
  current: [],
};

const els = {
  list: document.getElementById("motoristas-list"),
  inputSearch: document.getElementById("motoristas-search"),
  selectStatus: document.getElementById("motoristas-status"),
  btnFiltrar: document.getElementById("motoristas-filtrar"),
  btnLimpar: document.getElementById("motoristas-limpar"),
  btnLoadMore: document.getElementById("motoristas-loadmore"),
  btnCadastrar: document.getElementById("btn-cadastrar-motorista"),
};

function getEmpresaIdDoUsuario() {
  const s = session.get();
  return s?.user?.empresaId || s?.empresaId || null;
}

function canManage() {
  return roles.isAdmin() || roles.isGestor();
}

function debounce(fn, ms = 350) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString();
}

function motoristaCardTemplate(m) {
  const iniciais = (m.nome || m.Nome || "?").trim().charAt(0).toUpperCase();
  const nome = m.nome || m.Nome || "—";
  const cpf = m.cpf || m.Cpf || "—";
  const numeroCnh = m.numeroCnh || m.NumeroCnh || "—";
  const validade = m.validadeCnh || m.ValidadeCnh || "—";
  const categoria = m.categoriaCnh || m.CategoriaCnh || "—";
  const statusOn = (m.status || m.Status || "").toLowerCase() === "ativo";

  return `
  <div class="motorista-card" data-id="${m.motoristaId || m.MotoristaId || ""}" data-userid="${m.motoristaUsuarioId || ""}">
    <div class="motorista-avatar">${iniciais}</div>
    <div class="motorista-info">
      <div class="motorista-name" title="${nome}">${nome}</div>
      <div class="motorista-meta">
        <span><i class="ph ph-identification-card"></i>CPF: ${cpf}</span>
        <span><i class="ph ph-credit-card"></i>CNH: ${numeroCnh}</span>
        <span><i class="ph ph-calendar-blank"></i>Validade: ${formatDate(validade)}</span>
        <span><i class="ph ph-traffic-signal"></i>Categoria: ${categoria}</span>
      </div>
    </div>
    <div class="motorista-status ${statusOn ? "on" : "off"}">${statusOn ? "ATIVO" : "INATIVO"}</div>
    <div class="motorista-actions">
      ${canManage() ? `
        <button class="btn-edit" title="Editar"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn-del" title="Excluir"><i class="ph ph-trash"></i></button>
      ` : ``}
    </div>
  </div>`;
}

async function load(reset = false) {
  if (state.loading) return;
  if (reset) {
    state.page = 1; state.ended = false; state.current = [];
    els.list && (els.list.innerHTML = "");
  }
  state.loading = true;
  showBannerOffline(false);
  if (els.list) showSkeletonList(els.list, reset ? 2 : 1);

  try {
    const data = await api.listarMotoristasPorEmpresa(state.empresaId, {
      page: state.page,
      pageSize: state.pageSize,
      status: state.status,
      q: state.q
    });

    const items = Array.isArray(data) ? data : (data?.items || []);
    if (items.length < state.pageSize) state.ended = true;

    state.current = reset ? items : state.current.concat(items);
    renderList(state.current);
    state.page += 1;
  } catch (err) {
    console.error(err);
    showBannerOffline(true);
    renderList([]);
    toast("Falha ao carregar motoristas", "error");
  } finally {
    state.loading = false;
  }
}

function renderList(items) {
  if (!els.list) return;
  if (!items.length) {
    els.list.innerHTML = `
      <div class="motoristas-empty">
        <i class="ph ph-user-list"></i>
        Nenhum motorista encontrado.
      </div>`;
    toggleLoadMore(false);
    return;
  }
  els.list.innerHTML = items.map(motoristaCardTemplate).join("");
  toggleLoadMore(!state.ended);

  if (canManage()) {
    els.list.querySelectorAll(".btn-del").forEach(btn => btn.addEventListener("click", onDelete));
    els.list.querySelectorAll(".btn-edit").forEach(btn => btn.addEventListener("click", onEdit));
  }
}

function toggleLoadMore(show) {
  els.btnLoadMore?.classList.toggle("hidden", !show);
}

async function onDelete(ev) {
  const card = ev.currentTarget.closest(".motorista-card");
  const empresaId = state.empresaId;
  const motoristaUsuarioId = card.dataset.userid;
  if (!empresaId || !motoristaUsuarioId) return;

  if (!confirm("Confirma desvincular/excluir este motorista da empresa?")) return;

  const backup = card.outerHTML;
  card.style.opacity = .5;

  try {
    await api.desvincular(empresaId, motoristaUsuarioId);
    card.remove();
    toast("Motorista desvinculado.");
  } catch (e) {
    card.outerHTML = backup;
    toast("Erro ao desvincular.", "error");
  }
}

function onEdit() {
  toast("Abrir modal de edição (em breve).");
}

const doFilter = debounce(() => load(true), 350);

function bindEvents() {
  els.inputSearch?.addEventListener("input", e => {
    state.q = e.target.value; doFilter();
  });
  els.selectStatus?.addEventListener("change", e => {
    state.status = e.target.value || "todos"; load(true);
  });
  els.btnFiltrar?.addEventListener("click", () => load(true));
  els.btnLimpar?.addEventListener("click", () => {
    state.q = ""; state.status = "todos";
    if (els.inputSearch) els.inputSearch.value = "";
    if (els.selectStatus) els.selectStatus.value = "todos";
    load(true);
  });
  els.btnLoadMore?.addEventListener("click", () => load(false));
  if (els.btnCadastrar && !canManage()) els.btnCadastrar.classList.add("hidden");
}

function motoristasInit() {
  state.empresaId = getEmpresaIdDoUsuario();
  if (!state.empresaId) {
    toast("Empresa do usuário não encontrada.", "error");
    return;
  }
  bindEvents();
  load(true);
}

// ✅ exportação nomeada obrigatória
export { motoristasInit };
