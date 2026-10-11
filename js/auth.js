// js/auth.js
// SCRUM-45: iniciar sesión con correo y contraseña.
// SCRUM-46: cerrar sesión y mantenerla iniciada en el celular.
// SCRUM-47: roles y permisos.
// Usa el servicio de autenticación de Supabase (GoTrue) directamente.

const CLAVE_SESION = "colmenapp_sesion";

// SCRUM-47: qué puede hacer cada rol.
const PERMISOS = {
  administrador: ["ver", "agregar", "editar", "eliminar", "usuarios"],
  apicultor: ["ver", "agregar", "editar"],
  lectura: ["ver"],
};
const NOMBRE_ROL = {
  administrador: "Administrador",
  apicultor: "Apicultor",
  lectura: "Solo lectura",
};

let sesion = null; // { access_token, refresh_token, expires_at, user: { id, email } }
let perfil = null; // { id, email, rol }

function puede(accion) {
  return !!perfil && (PERMISOS[perfil.rol] || []).includes(accion);
}

function tokenActual() {
  return sesion ? sesion.access_token : null;
}

// ---------- sesión guardada en el dispositivo ----------
function leerSesionGuardada() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE_SESION));
    return s && s.access_token && s.refresh_token ? s : null;
  } catch (e) {
    return null;
  }
}

function guardarSesion(s) {
  sesion = s;
  try { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch (e) { /* sin almacenamiento */ }
}

function borrarSesion() {
  sesion = null;
  perfil = null;
  try { localStorage.removeItem(CLAVE_SESION); } catch (e) { /* nada */ }
}

function normalizarSesion(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: { id: data.user && data.user.id, email: data.user && data.user.email },
  };
}

function authPost(ruta, cuerpo, token) {
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  return fetch(`${SUPABASE_BASE}/auth/v1/${ruta}`, { method: "POST", headers, body: JSON.stringify(cuerpo || {}) });
}

// ---------- ingresar / renovar / salir ----------
async function iniciarSesion(email, password) {
  let res;
  try {
    res = await authPost("token?grant_type=password", { email, password });
  } catch (e) {
    throw new Error("RED");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const codigo = data.error_code || data.code || "";
    if (res.status === 429) throw new Error("DEMASIADOS");
    if (codigo === "email_not_confirmed") throw new Error("NO_CONFIRMADO");
    if (res.status === 400 || res.status === 401) throw new Error("CREDENCIALES");
    throw new Error("OTRO");
  }
  guardarSesion(normalizarSesion(data));
}

let renovando = null;
function refrescarSesion() {
  if (!sesion) return Promise.resolve(false);
  if (renovando) return renovando; // si ya hay una renovación en curso, se comparte
  renovando = (async () => {
    try {
      const res = await authPost("token?grant_type=refresh_token", { refresh_token: sesion.refresh_token });
      if (!res.ok) return false;
      guardarSesion(normalizarSesion(await res.json()));
      return true;
    } catch (e) {
      return false;
    } finally {
      renovando = null;
    }
  })();
  return renovando;
}

// Renueva el token si vence en menos de 60 segundos.
async function asegurarSesionFresca() {
  if (sesion && sesion.expires_at - Math.floor(Date.now() / 1000) < 60) await refrescarSesion();
}

async function refrescarSiHaceFalta() {
  if (!sesion) return false;
  if (sesion.expires_at - Math.floor(Date.now() / 1000) >= 60) return true;
  return refrescarSesion();
}

// Trae el rol de la persona que inició sesión.
async function obtenerPerfil() {
  const res = await fetchAuth(
    `${SUPABASE_URL}/perfiles?id=eq.${sesion.user.id}&select=id,email,rol`,
    { headers: sbHeaders({ Accept: "application/json" }) }
  );
  if (!res.ok) throw new Error("HTTP " + res.status);
  const filas = await res.json();
  return filas.length ? filas[0] : null;
}

// Al abrir la app: ¿hay una sesión guardada que siga valiendo?
async function restaurarSesion() {
  sesion = leerSesionGuardada();
  if (!sesion) return false;
  if (!(await refrescarSiHaceFalta())) {
    borrarSesion();
    return false;
  }
  try {
    perfil = await obtenerPerfil();
  } catch (e) {
    perfil = null;
  }
  if (!perfil) {
    borrarSesion();
    return false;
  }
  return true;
}

async function cerrarSesion() {
  const token = tokenActual();
  borrarSesion();
  if (token) {
    try { await authPost("logout?scope=local", {}, token); } catch (e) { /* igual se cierra acá */ }
  }
  location.reload();
}

function sesionExpirada(mensaje) {
  borrarSesion();
  if (typeof mostrarLogin === "function") mostrarLogin(mensaje || "Tu sesión venció. Ingresá de nuevo.");
}
