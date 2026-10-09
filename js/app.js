// js/app.js
// Al cargar: verifica conexión (SCRUM-36) y, si todo bien, muestra
// la pantalla principal con el listado de cajas (SCRUM-10/11/12).

async function init() {
  const splash = document.getElementById("splash");
  const app = document.getElementById("app");
  const statusEl = document.getElementById("status");
  const badgeEl = document.getElementById("badge");
  const spinEl = document.getElementById("spin");

  const ok = await checkDatabaseConnection();
  spinEl.style.display = "none";

  if (!ok) {
    badgeEl.textContent = "No se pudo conectar";
    badgeEl.className = "status-badge error";
    statusEl.textContent = "Revisá la conexión a internet o que la base de datos esté activa en Supabase.";
    return;
  }

  splash.style.display = "none";
  app.style.display = "";

  document.getElementById("btn-agregar").addEventListener("click", agregarCaja);

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

  await cargarListado();
}

init();
