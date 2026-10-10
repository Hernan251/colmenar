// js/modal.js
// SCRUM-51: ventanas emergentes propias (centradas y con el estilo de la app)
// que reemplazan a los cuadros del navegador (alert / confirm).
// SCRUM-42: también sirve para pedir un número (al agregar una caja).

// Opciones:
//   titulo, mensaje          textos de la ventana
//   confirmar                texto del botón principal (por defecto "Aceptar")
//   cancelar                 texto del botón secundario; false = ventana de aviso (un solo botón)
//   peligro                  true = botón principal en rojo (acciones que borran)
//   campoNumero: { valor }   agrega un campo para escribir un número
//   validar(n)               devuelve un texto de error o null si el número es válido
// Devuelve una promesa:
//   - sin campoNumero: true (confirmó) / false (canceló)
//   - con campoNumero: el número escrito / null (canceló)
function abrirModal(op) {
  return new Promise((resolve) => {
    const conCampo = !!op.campoNumero;
    const esAviso = op.cancelar === false;
    const previo = document.activeElement;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <h3 class="modal-titulo"></h3>
        <p class="modal-mensaje"></p>
        ${conCampo ? `<input class="modal-input" type="number" inputmode="numeric" min="1" step="1">` : ""}
        <div class="modal-error"></div>
        <div class="modal-botones">
          ${esAviso ? "" : `<button type="button" class="modal-btn modal-cancelar"></button>`}
          <button type="button" class="modal-btn modal-ok ${op.peligro ? "peligro" : ""}"></button>
        </div>
      </div>`;

    // textContent evita que el texto se interprete como HTML.
    overlay.querySelector(".modal-titulo").textContent = op.titulo || "Aviso";
    overlay.querySelector(".modal-mensaje").textContent = op.mensaje || "";
    overlay.querySelector(".modal-ok").textContent = op.confirmar || "Aceptar";
    const btnCancelar = overlay.querySelector(".modal-cancelar");
    if (btnCancelar) btnCancelar.textContent = op.cancelar || "Cancelar";

    const input = overlay.querySelector(".modal-input");
    const errorEl = overlay.querySelector(".modal-error");
    if (input) input.value = op.campoNumero.valor != null ? op.campoNumero.valor : "";

    function cerrar(valor) {
      document.removeEventListener("keydown", teclado, true);
      overlay.remove();
      if (previo && previo.focus) previo.focus();
      resolve(valor);
    }

    function aceptar() {
      if (!conCampo) return cerrar(true);
      const n = Number(input.value);
      const vacio = input.value.trim() === "";
      let error = vacio ? "Escribí un número." : null;
      if (!error && op.validar) error = op.validar(n);
      if (error) {
        errorEl.textContent = error;
        input.focus();
        input.select();
        return;
      }
      cerrar(n);
    }

    function cancelar() {
      if (esAviso) return cerrar(true);
      cerrar(conCampo ? null : false);
    }

    function teclado(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelar();
      } else if (e.key === "Enter" && conCampo && document.activeElement === input) {
        e.preventDefault();
        aceptar();
      }
    }

    overlay.querySelector(".modal-ok").addEventListener("click", aceptar);
    if (btnCancelar) btnCancelar.addEventListener("click", cancelar);
    // Tocar afuera de la ventana cancela (o cierra el aviso).
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) cancelar();
    });
    document.addEventListener("keydown", teclado, true);

    document.body.appendChild(overlay);

    // En acciones peligrosas el foco empieza en "Cancelar", para no borrar por error.
    if (input) {
      input.focus();
      input.select();
    } else if (op.peligro && btnCancelar) {
      btnCancelar.focus();
    } else {
      overlay.querySelector(".modal-ok").focus();
    }
  });
}

// Atajos de uso.
function confirmarModal(titulo, mensaje, textoConfirmar, peligro) {
  return abrirModal({ titulo, mensaje, confirmar: textoConfirmar, cancelar: "Cancelar", peligro: !!peligro });
}

function avisar(mensaje, titulo) {
  return abrirModal({ titulo: titulo || "Aviso", mensaje, confirmar: "Entendido", cancelar: false });
}
