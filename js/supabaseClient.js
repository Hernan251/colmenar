// js/supabaseClient.js
// Configuración de conexión a la base de datos (Supabase).
// SCRUM-36: Conectar la app a una base de datos en la nube.

const SUPABASE_URL = "https://jxvqeqgigicdsubhfbny.supabase.co/rest/v1";
const SUPABASE_KEY = "sb_publishable_a3Dg6N53DGLENGNkVqhnsg_xVrELvg-";
const TABLE_COLMENAS = "colmenas";

function sbHeaders(extra) {
  return Object.assign(
    {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    extra || {}
  );
}

// Prueba simple de conexión: pide 1 fila de la tabla colmenas.
// Devuelve true/false y no tira error para arriba, para que la
// pantalla de carga pueda mostrar un mensaje claro.
async function checkDatabaseConnection() {
  try {
    const res = await fetch(`${SUPABASE_URL}/${TABLE_COLMENAS}?select=num&limit=1`, {
      headers: sbHeaders({ Accept: "application/json" }),
    });
    return res.ok;
  } catch (e) {
    console.error("Error de conexión con Supabase:", e);
    return false;
  }
}

async function fetchColmenas() {
  const res = await fetch(`${SUPABASE_URL}/${TABLE_COLMENAS}?select=*&order=num.asc`, {
    headers: sbHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
