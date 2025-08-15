// public/js/main.js
import { api } from "./api.js";
import { session } from "./storage.js";
import { updateUserInfo } from "./auth.js";
import { renderDashboard } from "./dashboard.js";
import { motoristasInit } from "./motoristas.js";
import { toast } from "./ui.js";

const screens = {
  login: document.getElementById("loginScreen"),
  main: document.getElementById("mainScreen"),
  content: document.getElementById("contentArea"),
  sidebar: document.getElementById("sidebar"),
  nav: document.getElementById("sidebarNav"),
};

function show(id) {
  screens.login.classList.toggle("active", id === "login");
  screens.main.classList.toggle("active", id === "main");
}

function renderMenu(role = "Usuário") {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line" },
    { key: "motoristas", label: "Motoristas", icon: "fa-solid fa-id-card-clip" },
  ];
  const html = items
    .map(
      i => `
      <div class="nav-item" data-route="${i.key}">
        <i class="nav-icon ${i.icon}"></i>
        <span>${i.label}</span>
      </div>`
    )
    .join("");
  screens.nav.innerHTML = html;
  screens.nav.addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (!item) return;
    go(item.dataset.route);
    screens.nav.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    item.classList.add("active");
  });
}

function go(route) {
  if (route === "dashboard") {
    screens.content.innerHTML = "";
    renderDashboard();
    return;
  }
  if (route === "motoristas") {
    screens.content.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header motoristas-header">
          <h1><i class="fa-solid fa-id-card-clip"></i> Motoristas</h1>
          <button id="btn-cadastrar-motorista" class="btn-primary"><i class="fa-solid fa-user-plus"></i> Cadastrar Motorista</button>
        </div>

        <div class="section motoristas-filtros">
          <div class="filters-row">
            <div class="form-group">
              <label>Buscar</label>
              <input id="motoristas-search" type="text" placeholder="Nome ou CPF" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="motoristas-status">
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div class="filters-actions">
              <button id="motoristas-filtrar" class="btn-primary">Filtrar</button>
              <button id="motoristas-limpar" class="logout-btn">Limpar</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div id="motoristas-list" class="motoristas-list"></div>
        </div>
      </div>
    `;
    motoristasInit();
    return;
  }
}

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const btn = document.getElementById("loginBtn");
  const span = document.getElementById("loginBtnText");
  const spinner = document.getElementById("loginSpinner");
  const errBox = document.getElementById("loginError");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errBox.textContent = "";
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {
      btn.disabled = true;
      spinner.classList.remove("hidden");
      span.textContent = "Autenticando...";

      const auth = await api.signIn(email, senha);
      session.set(auth);

      toast("Bem-vindo!");
      location.reload();
    } catch (e) {
      errBox.textContent = e.message || "Falha ao autenticar.";
      errBox.classList.add("show");
    } finally {
      btn.disabled = false;
      spinner.classList.add("hidden");
      span.textContent = "Entrar";
    }
  });
}

function initApp() {
  show("main");
  updateUserInfo();
  renderMenu();
  go("dashboard");
}

document.addEventListener("DOMContentLoaded", () => {
  const auth = session.get();
  if (!auth?.accessToken && !auth?.token) {
    show("login");
    bindLoginForm();
    return;
  }
  initApp();
});
