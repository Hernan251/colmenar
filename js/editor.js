// js/editor.js
// SCRUM-13: cantidad de alzas.
// SCRUM-14: melado y cantidad de miel.
// SCRUM-15: fecha de última revisión.
// SCRUM-16: observaciones libres.

let editando = null;

function hoyISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function abrirEditor(caja) {
  editando = JSON.parse(JSON.stringify(caja));
  document.getElementById("sheet-title").textContent = `Caja ${pad2(caja.num)}`;
  renderEditor();
  document.getElementById("backdrop").classList.add("open");
  document.getElementById("sheet").classList.add("open");
}

function cerrarEditor() {
  document.getElementById("backdrop").classList.remove("open");
  document.getElementById("sheet").classList.remove("open");
  editando = null;
}

function renderEditor() {
  const c = editando;
  const sinAbejas = c.estado === "Sin abejas";
  const mielBloqueada = c.melado !== "Sí";

  document.getElementById("sheet-body").innerHTML = `
    <div class="campo ${sinAbejas ? "bloqueado" : ""}">
      <label>Cantidad de alzas</label>
      <div class="stepper">
        <button type="button" id="alzas-menos" ${sinAbejas ? "disabled" : ""}>−</button>
        <div class="stepper-val" id="alzas-val">${sinAbejas ? 0 : c.alzas}</div>
        <button type="button" id="alzas-mas" ${sinAbejas ? "disabled" : ""}>+</button>
      </div>
      ${sinAbejas ? `<div class="nota">🔒 Se bloquea en 0 porque la caja está "Sin abejas".</div>` : ""}
    </div>

    <div class="campo ${sinAbejas ? "bloqueado" : ""}">
      <label>¿Ya se meló?</label>
      <div class="seg">
        <button type="button" class="seg-btn ${c.melado === "Sí" ? "active" : ""}" data-melado="Sí" ${sinAbejas ? "disabled" : ""}>Sí</button>
        <button type="button" class="seg-btn ${c.melado !== "Sí" ? "active" : ""}" data-melado="No" ${sinAbejas ? "disabled" : ""}>No</button>
      </div>
    </div>

    <div class="campo ${mielBloqueada ? "bloqueado" : ""}">
      <label>Cantidad de miel (kg)</label>
      <input type="text" inputmode="decimal" id="f-miel" value="${mielBloqueada ? "0" : c.miel}" ${mielBloqueada ? "disabled" : ""}>
      ${mielBloqueada ? `<div class="nota">🔒 Se habilita al marcar "¿Ya se meló?" = Sí.</div>` : ""}
    </div>

    <div class="campo">
      <label>Fecha de última revisión</label>
      <input type="date" id="f-revision" value="${c.fechaRevision || ""}" max="${hoyISO()}">
    </div>

    <div class="campo">
      <label>Observaciones</label>
      <textarea id="f-obs" placeholder="Reina nueva, colonia débil, se agregó alimento…">${c.observaciones || ""}</textarea>
    </div>
  `;

  if (!sinAbejas) {
    document.getElementById("alzas-menos").addEventListener("click", () => {
      editando.alzas = Math.max(0, (Number(editando.alzas) || 0) - 1);
      document.getElementById("alzas-val").textContent = editando.alzas;
    });
    document.getElementById("alzas-mas").addEventListener("click", () => {
      editando.alzas = (Number(editando.alzas) || 0) + 1;
      document.getElementById("alzas-val").textContent = editando.alzas;
    });
  }

  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      if (sinAbejas) return;
      editando.melado = b.dataset.melado;
      if (editando.melado !== "Sí") editando.miel = 0;
      renderEditor();
    })
  );

  if (!mielBloqueada) {
    document.getElementById("f-miel").addEventListener("input", (e) => {
      const v = e.target.value.replace(",", ".");
      editando.miel = v === "" ? 0 : Number(v);
    });
  }
  document.getElementById("f-revision").addEventListener("change", (e) => (editando.fechaRevision = e.target.value));
  document.getElementById("f-obs").addEventListener("input", (e) => (editando.observaciones = e.target.value));
}

async function guardarEditor() {
  const c = editando;
  if (!c) return;

  // Una caja sin abejas no tiene alzas ni miel.
  if (c.estado === "Sin abejas") {
    c.alzas = 0;
    c.melado = "No";
    c.miel = 0;
  }
  if (Number.isNaN(Number(c.miel)) || Number(c.miel) < 0) {
    alert("La cantidad de miel tiene que ser un número válido (por ejemplo 2.5).");
    return;
  }

  const btn = document.getElementById("sheet-save");
  btn.disabled = true;
  try {
    const guardada = await guardarCaja(c);
    const i = cajas.findIndex((x) => x.num === guardada.num);
    if (i !== -1) cajas[i] = guardada;
    cerrarEditor();
    renderLista();
  } catch (e) {
    console.error("No se pudo guardar la caja", e);
    alert("No se pudo guardar. Revisá tu conexión e intentá de nuevo.");
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("sheet-close").addEventListener("click", cerrarEditor);
document.getElementById("sheet-cancel").addEventListener("click", cerrarEditor);
document.getElementById("backdrop").addEventListener("click", cerrarEditor);
document.getElementById("sheet-save").addEventListener("click", guardarEditor);
