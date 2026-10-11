// js/usuarios.js
// SCRUM-48: el administrador ve los usuarios y les asigna un rol.
// Las cuentas nuevas se crean en Supabase (Authentication > Users > Add user);
// apenas existen aparecen acá con el rol "Solo lectura" hasta que se les cambie.

let usuarios = [];

async function cargarUsuarios() {
  const cont = document.getElementById("view-usuarios");
  if (!puede("usuarios")) {
    cont.innerHTML = "";
    return;
  }
  cont.innerHTML = `<p class="muted">Cargando usuarios…</p>`;
  try {
    const res = await fetchAuth(`${SUPABASE_URL}/perfiles?select=id,email,rol&order=email.asc`, {
      headers: sbHeaders({ Accept: "application/json" }),
    });
    chequearRespuesta(res);
    usuarios = await res.json();
    renderUsuarios();
  } catch (e) {
    if (e.message === "SESION") return;
    console.error("No se pudo cargar la lista de usuarios", e);
    cont.innerHTML = `<p class="muted">No se pudo cargar la lista de usuarios. Revisá tu conexión e intentá de nuevo.</p>`;
  }
}

function renderUsuarios() {
  const cont = document.getElementById("view-usuarios");
  const miId = perfil ? perfil.id : null;

  cont.innerHTML = `
    <div class="panel nota-usuarios">
      <h3>Usuarios y roles</h3>
      <p class="muted">Para dar de alta a una persona nueva: en Supabase andá a <b>Authentication → Users → Add user</b> (con <b>Auto Confirm User</b> marcado). Apenas se crea aparece acá como <b>Solo lectura</b>, y desde acá le cambiás el rol.</p>
      <button type="button" id="btn-actualizar-usuarios" class="btn-mapa">Actualizar lista</button>
    </div>
    <div class="lista-usuarios">
      ${usuarios
        .map((u) => `
          <div class="usuario-card">
            <div class="usuario-datos">
              <div class="usuario-email">${escaparHTML(u.email || "(sin correo)")}${u.id === miId ? ` <span class="pill pill-honey">Vos</span>` : ""}</div>
              ${u.id === miId ? `<div class="nota">Tu propio rol no se puede cambiar desde acá, para no quedarte sin acceso de administrador.</div>` : ""}
            </div>
            <select class="select-rol" data-id="${u.id}" ${u.id === miId ? "disabled" : ""}>
              ${Object.keys(NOMBRE_ROL)
                .map((r) => `<option value="${r}" ${u.rol === r ? "selected" : ""}>${NOMBRE_ROL[r]}</option>`)
                .join("")}
            </select>
          </div>`)
        .join("")}
    </div>`;

  document.getElementById("btn-actualizar-usuarios").addEventListener("click", cargarUsuarios);
  cont.querySelectorAll(".select-rol").forEach((sel) =>
    sel.addEventListener("change", () => cambiarRol(sel.dataset.id, sel.value))
  );
}

function escaparHTML(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function cambiarRol(id, rol) {
  const u = usuarios.find((x) => x.id === id);
  if (!u || u.rol === rol || !puede("usuarios")) return;
  const anterior = u.rol;
  try {
    const res = await fetchAuth(`${SUPABASE_URL}/perfiles?id=eq.${id}`, {
      method: "PATCH",
      headers: sbHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({ rol }),
    });
    chequearRespuesta(res);
    const data = await res.json();
    if (!data.length) throw new Error("SIN_PERMISO_O_INEXISTENTE");
    u.rol = rol;
    avisar(`Ahora ${u.email} tiene el rol de ${NOMBRE_ROL[rol]}.`, "Rol actualizado");
  } catch (e) {
    console.error("No se pudo cambiar el rol", e);
    u.rol = anterior;
    renderUsuarios();
    avisarError(e, "No se pudo cambiar el rol. Revisá tu conexión e intentá de nuevo.", "No se pudo guardar");
  }
}
