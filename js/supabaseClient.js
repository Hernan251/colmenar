// js/supabaseClient.js
// Configuración de conexión a la base de datos (Supabase).
// SCRUM-36: conectar la app a una base de datos en la nube.
// SCRUM-45: todas las consultas viajan con el token de la persona que inició sesión.

const SUPABASE_BASE = "https://jxvqeqgigicdsubhfbny.supabase.co";
const SUPABASE_URL = SUPABASE_BASE + "/rest/v1";
const SUPABASE_KEY = "sb_publishable_a3Dg6N53DGLENGNkVqhnsg_xVrELvg-";
const TABLE_COLMENAS = "colmenas";

function sbHeaders(extra) {
  const token = typeof tokenActual === "function" ? tokenActual() : null;
  return Object.assign(
    {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + (token || SUPABASE_KEY),
      "Content-Type": "application/json",
    },
    extra || {}
  );
}

// fetch con sesión: renueva el token si está por vencer y, si el servidor
// responde 401 (token vencido), lo renueva y reintenta una vez.
// Si la sesión no se puede recuperar, vuelve a la pantalla de ingreso.
async function fetchAuth(url, opt) {
  opt = opt || {};
  if (typeof asegurarSesionFresca === "function") await asegurarSesionFresca();

  const intento = () =>
    fetch(url, Object.assign({}, opt, {
      headers: Object.assign({}, opt.headers, {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + ((typeof tokenActual === "function" && tokenActual()) || SUPABASE_KEY),
      }),
    }));

  let res = await intento();
  if (res.status === 401 && typeof refrescarSesion === "function" && typeof sesion !== "undefined" && sesion) {
    const renovada = await refrescarSesion();
    if (renovada) res = await intento();
    if (!renovada || res.status === 401) {
      sesionExpirada();
      throw new Error("SESION");
    }
  }
  return res;
}

// Prueba simple de conexión: ¿responde el servidor? (cualquier respuesta HTTP
// por debajo de 500 cuenta como "hay conexión"; la base pausada falla en la red).
async function checkDatabaseConnection() {
  try {
    const res = await fetch(`${SUPABASE_URL}/${TABLE_COLMENAS}?select=num&limit=1`, {
      headers: sbHeaders({ Accept: "application/json" }),
    });
    return res.status < 500;
  } catch (e) {
    console.error("Error de conexión con Supabase:", e);
    return false;
  }
}

async function fetchColmenas() {
  const res = await fetchAuth(`${SUPABASE_URL}/${TABLE_COLMENAS}?select=*&order=num.asc`, {
    headers: sbHeaders({ Accept: "application/json" }),
  });
  chequearRespuesta(res);
  return res.json();
}
