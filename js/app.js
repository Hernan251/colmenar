// js/app.js
// Arranque de la app:
//  1) verifica que haya conexión con la base de datos (SCRUM-36),
//  2) si hay una sesión guardada y vigente, entra directo (SCRUM-46),
//  3) si no, muestra la pantalla de ingreso (SCRUM-45),
//  4) ajusta la pantalla según el rol (SCRUM-49).

let eventosConectados = false;

function mensajeLogin(err) {
  switch (err && err.message) {
    case "CREDENCIALES": return "Correo o contraseña incorrectos.";
    case "NO_CONFIRMADO": return "Tu cuenta todavía no está confirmada. Pedile al administrador que la confirme.";
    case "DEMASIADOS": return "Demasiados intentos. Esperá un momento y probá de nuevo.";
    case "RED": return "No se pudo conectar. Revisá tu conexión a internet.";
    case "SIN_PERFIL": return "Tu cuenta todavía no tiene un rol asignado. Pedile al administrador que revise tu acceso.";
    default: return "No se pudo iniciar sesión. Intentá de nuevo.";
  }
}

// Pantalla de ingreso (con un mensaje opcional).
function mostrarLogin(mensaje) {
  document.getElementById("splash").style.display = "none";
  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "";
  const err = document.getElementById("login-error");
  err.textContent = mensaje || "";
  err.style.display = mensaje ? "" : "none";
  const btn = document.getElementById("login-btn");
  btn.disabled = false;
  btn.textContent = "Ingresar";
  document.getElementById("login-pass").value = "";
  if (typeof cerrarEditor === "function") cerrarEditor();
}

// SCRUM-49: mostrar solo lo que el rol permite.
function aplicarPermisosUI() {
  document.getElementById("usuario-email").textContent = sesion && sesion.user ? sesion.user.email : "";
  document.getElementById("usuario-rol").textContent = perfil ? NOMBRE_ROL[perfil.rol] || perfil.rol : "";
  const tabUsuarios = document.querySelector('.tab[data-vista="usuarios"]');
  if (tabUsuarios) tabUsuarios.style.display = puede("usuarios") ? "" : "none";
}

async function entrarALaApp() {
  document.getElementById("splash").style.display = "none";
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "";
  aplicarPermisosUI();
  mostrarVista("cajas");
  await cargarListado();
}

async function enviarLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value;
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Ingresando…";
  try {
    await iniciarSesion(email, pass);
    perfil = await obtenerPerfil();
    if (!perfil) {
      borrarSesion();
      throw new Error("SIN_PERFIL");
    }
    await entrarALaApp();
  } catch (err) {
    if (err.message === "SESION") return;
    borrarSesion();
    mostrarLogin(mensajeLogin(err));
  }
}

function conectarEventos() {
  if (eventosConectados) return;
  eventosConectados = true;

  document.getElementById("btn-agregar").addEventListener("click", agregarCaja);
  document.getElementById("form-login").addEventListener("submit", enviarLogin);
  document.getElementById("btn-salir").addEventListener("click", cerrarSesion);

  // SCRUM-17: buscar y filtrar cajas.
  document.getElementById("buscador").addEventListener("input", (e) => {
    busqueda = e.target.value;
    renderLista();
  });
  document.querySelectorAll(".chip-filtro").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-filtro").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtro = btn.dataset.f;
      renderLista();
    });
  });
}

async function init() {
  conectarEventos();

  const statusEl = document.getElementById("status");
  const badgeEl = document.getElementById("badge");
  const spinEl = document.getElementById("spin");

  const hayConexion = await checkDatabaseConnection();
  spinEl.style.display = "none";

  if (!hayConexion) {
    badgeEl.textContent = "No se pudo conectar";
    badgeEl.className = "status-badge error";
    statusEl.textContent = "Revisá la conexión a internet o que la base de datos esté activa en Supabase.";
    return;
  }

  if (await restaurarSesion()) {
    await entrarALaApp();
  } else {
    mostrarLogin();
  }
}

init();
