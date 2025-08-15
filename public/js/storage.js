// js/storage.js

const AUTH_KEY = "mc_auth";

export const session = {
  get() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(data) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data || {}));
  },
  clear() {
    localStorage.removeItem(AUTH_KEY);
  },
};

export function setAuthData(user, accessToken) {
  session.set({ user: user || {}, accessToken: accessToken || "" });
}

export function getStoredUser() {
  const s = session.get();
  return s && s.user ? s.user : null;
}

export const roles = {
  _tipo() {
    const u = getStoredUser();
    const t =
      (u && (u.perfil || u.tipoUsuario || u.role || u.papel)) || "usuario";
    return String(t).toLowerCase();
  },
  isAdmin() {
    const t = this._tipo();
    return t === "admin" || t === "administrador";
  },
  isGestor() {
    const t = this._tipo();
    return t === "gestor" || t === "manager";
  },
  isMotorista() {
    const t = this._tipo();
    return t === "motorista" || t === "driver";
  },
};
