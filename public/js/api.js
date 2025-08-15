// js/api.js
import { session } from "./storage.js";

const API_BASE =
  localStorage.getItem("mc_api") ||
  "https://localhost:7105";

function authHeaders() {
  const s = session.get();
  const token = s?.accessToken || s?.jwt;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

/* ====== EXPORTS QUE FALTAVAM EM OUTROS ARQUIVOS ====== */

// Alguns módulos importam { apiRequest } de './api.js'
export const apiRequest = request;

// Alguns módulos importam { toYMD } de './api.js'
export function toYMD(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* ============== API “bonitinha” usada no front ============== */

export const api = {
  async signIn(email, senha) {
    const data = await request(`/api/Usuario/autenticar`, {
      method: "POST",
      body: { email, senha },
    });

    return {
      accessToken: data?.accessToken || data?.token || "",
      user: {
        nome: data?.usuario?.nome || data?.usuario?.Nome || "Usuário",
        tipoUsuario: data?.usuario?.tipoUsuario || data?.usuario?.TipoUsuario || "usuario",
        empresaId:
          data?.usuario?.empresaId ||
          data?.usuario?.EmpresaId ||
          data?.empresaId ||
          null,
      },
    };
  },

  async listarMotoristasPorEmpresa(empresaId, { page, pageSize, status, q } = {}) {
    const url = new URL(`${API_BASE}/api/empresa-motoristas/${empresaId}/lista`);
    if (page) url.searchParams.set("page", page);
    if (pageSize) url.searchParams.set("pageSize", pageSize);
    if (status && status !== "todos") url.searchParams.set("status", status);
    if (q) url.searchParams.set("q", q);

    const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.message || data?.error || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data;
  },

  async desvincular(empresaId, motoristaUsuarioId) {
    return request(`/api/empresa-motoristas/${empresaId}/${motoristaUsuarioId}`, {
      method: "DELETE",
    });
  },
};
