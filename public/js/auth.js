// js/auth.js
import { api } from "./api.js";
import { setAuthData, getStoredUser } from "./storage.js";

export async function login(email, senha) {
  const auth = await api.signIn(email, senha);

  if (!auth?.accessToken) {
    throw new Error("Token não retornado pela API.");
  }

  // salva usuário + token no storage
  setAuthData(auth.user || {}, auth.accessToken);

 
  const empresaId =
    auth.user?.empresaId ??
    auth.empresaId ??
    null;

  if (empresaId) {
    localStorage.setItem("empresaId", String(empresaId));
  } else {
    localStorage.removeItem("empresaId");
  }

  return { user: auth.user, token: auth.accessToken };
}

export function updateUserInfo() {
  const user = getStoredUser() || { nome: "Usuário", perfil: "Usuário" };
  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");
  const avatarEl = document.getElementById("userAvatar");

  if (nameEl) nameEl.textContent = user.nome || "Usuário";
  if (roleEl) roleEl.textContent = user.perfil || user.tipoUsuario || "Usuário";
  if (avatarEl) avatarEl.textContent = (user.nome || "U").charAt(0).toUpperCase();
}
