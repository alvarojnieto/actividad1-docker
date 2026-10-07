const API = "http://localhost:3000";
const estado = document.getElementById("estado");

function mostrarMensaje(texto, esError = false) {
  estado.textContent = texto;
  estado.className = esError ? "msg error" : "msg";
    if (esError) estado.scrollIntoView({ behavior: "smooth", block: "center" }); // <-- NUEVA

  setTimeout(() => (estado.textContent = ""), 3000);
}
// ---------- Validaciones del lado del cliente ----------
function validarTexto(valor, campo, max) {
  const v = (valor ?? "").trim();
  if (!v) return `${campo} no puede estar vacío`;
  if (v.length > max) return `${campo} no puede superar ${max} caracteres`;
  return null;
}

function validarNumero(valor, campo, { min = 0, max = Infinity, entero = false } = {}) {
  if (typeof valor !== "number" || Number.isNaN(valor)) return `${campo} debe ser un número`;
  if (entero && !Number.isInteger(valor)) return `${campo} debe ser un número entero`;
  if (valor < min) return `${campo} no puede ser menor que ${min}`;
  if (valor > max) return `${campo} no puede ser mayor que ${max}`;
  return null;
}

function validarProducto({ nombre, precio, stock, categoria_id }) {
  return validarTexto(nombre, "El nombre", 150)
    || validarNumero(precio, "El precio", { min: 0, max: 99999999.99 })
    || validarNumero(stock, "El stock", { min: 0, max: 2147483647, entero: true })
    || (Number.isInteger(categoria_id) ? null : "Selecciona una categoría");
}

function validarMovimiento({ producto_id, tipo, cantidad }) {
  return (Number.isInteger(producto_id) ? null : "Selecciona un producto")
    || (["entrada", "salida"].includes(tipo) ? null : "El tipo debe ser entrada o salida")
    || validarNumero(cantidad, "La cantidad", { min: 1, max: 1000000, entero: true });
}
const modalOverlay = document.getElementById("modal-overlay");
const formModal = document.getElementById("form-modal");

function abrirModal({ titulo, id, campos, onGuardar }) {
  document.getElementById("modal-titulo").textContent = titulo;

  const contenedor = document.getElementById("modal-campos");
  contenedor.innerHTML = "";

  campos.forEach(campo => {
    const label = document.createElement("label");
    label.textContent = campo.label;
    contenedor.appendChild(label);

    let input;
    if (campo.type === "select") {
      input = document.createElement("select");
      campo.options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        if (String(opt.value) === String(campo.value)) option.selected = true;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = campo.type || "text";
      input.value = campo.value ?? "";
      if (campo.step) input.step = campo.step;
    }
    input.id = `modal-campo-${campo.key}`;
    input.required = campo.required !== false;
    contenedor.appendChild(input);
  });

  formModal.onsubmit = async (e) => {
    e.preventDefault();
    const valores = {};
    campos.forEach(campo => {
      const el = document.getElementById(`modal-campo-${campo.key}`);
      valores[campo.key] = campo.type === "number" ? parseFloat(el.value) : el.value;
    });
    await onGuardar(id, valores);
  };

  modalOverlay.classList.add("visible");
}

function cerrarModal() {
  modalOverlay.classList.remove("visible");
}

document.getElementById("cerrar-modal").addEventListener("click", cerrarModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) cerrarModal();
});

// La API devuelve las fechas en UTC sin zona horaria; sin la "Z" el navegador las toma como hora local
function formatearFecha(iso) {
  const conZona = /Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  return new Date(conZona).toLocaleString("es-CO");
}

// La API devuelve el precio como texto ("2500.00")
function formatearPrecio(precio) {
  return Number(precio).toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

// Escapa texto antes de meterlo en la tabla (evita que comillas o < > rompan el HTML)
function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Ultimos datos cargados, para abrir el modal de edicion por id
let categoriasCargadas = [];
let productosCargados = [];

async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const datos = await res.json();
  categoriasCargadas = datos;
  const tbody = document.querySelector("#tabla-categorias tbody");
  tbody.innerHTML = "";
  const select = document.getElementById("prod-categoria");
  select.innerHTML = "";
  datos.forEach(c => {
    tbody.innerHTML += `<tr>
      <td>${c.id}</td><td>${escaparHTML(c.nombre)}</td><td>${escaparHTML(c.descripcion)}</td>
      <td>
        <div class="acciones">
          <button class="icon-btn" title="Editar" onclick="abrirModalEditarCategoria(categoriasCargadas.find(x => x.id === ${c.id}))">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen" viewBox="0 0 16 16">
              <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z"/>
            </svg>
          </button>
          <button class="danger" onclick="eliminarCategoria(${c.id})">Eliminar</button>
        </div>
      </td>
    </tr>`;
    select.innerHTML += `<option value="${c.id}">${escaparHTML(c.nombre)}</option>`;
  });
}

function abrirModalEditarCategoria(categoria) {
  abrirModal({
    titulo: "Editar categoría",
    id: categoria.id,
    campos: [
      { key: "nombre", label: "Nombre", value: categoria.nombre },
      { key: "descripcion", label: "Descripción", value: categoria.descripcion ?? "", required: false },
    ],
    onGuardar: async (id, valores) => {
      const res = await fetch(`${API}/categorias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      if (res.ok) {
        mostrarMensaje("Categoría actualizada");
        cerrarModal();
        // Los productos muestran el nombre de la categoria
        cargarCategorias().then(cargarProductos);
      } else {
        mostrarMensaje("Error al actualizar categoría", true);
      }
    },
  });
}

document.getElementById("form-categoria").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("cat-nombre").value.trim();
  const descripcion = document.getElementById("cat-descripcion").value.trim();
  const res = await fetch(`${API}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion }),
  });
  if (res.ok) {
    mostrarMensaje("Categoría creada");
    e.target.reset();
    cargarCategorias();
  } else {
    mostrarMensaje("Error al crear categoría", true);
  }
});

async function eliminarCategoria(id) {
  const res = await fetch(`${API}/categorias/${id}`, { method: "DELETE" });
  if (res.ok) { mostrarMensaje("Categoría eliminada"); cargarCategorias(); }
  else { mostrarMensaje("No se pudo eliminar (¿tiene productos asociados?)", true); }
}

async function cargarProductos() {
  const res = await fetch(`${API}/productos`);
  const datos = await res.json();
  productosCargados = datos;
  const tbody = document.querySelector("#tabla-productos tbody");
  tbody.innerHTML = "";
  const select = document.getElementById("mov-producto");
  select.innerHTML = "";
  datos.forEach(p => {
    tbody.innerHTML += `<tr>
      <td>${p.id}</td><td>${escaparHTML(p.nombre)}</td><td>$${formatearPrecio(p.precio)}</td><td>${p.stock}</td>
      <td>${escaparHTML(p.categoria_nombre)}</td>
      <td>
        <div class="acciones">
          <button class="icon-btn" title="Editar" onclick="abrirModalEditarProducto(productosCargados.find(x => x.id === ${p.id}))">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen" viewBox="0 0 16 16">
              <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z"/>
            </svg>
          </button>
          <button class="danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
        </div>
      </td>
    </tr>`;
    select.innerHTML += `<option value="${p.id}">${escaparHTML(p.nombre)}</option>`;
  });
  // Mantener el filtro de busqueda al recargar la tabla
  aplicarFiltroProductos();
}

async function abrirModalEditarProducto(producto) {
  const resCat = await fetch(`${API}/categorias`);
  const categorias = await resCat.json();
  const categoriaActual = categorias.find(c => c.nombre === producto.categoria_nombre);

  abrirModal({
    titulo: "Editar producto",
    id: producto.id,
    campos: [
      { key: "nombre", label: "Nombre", value: producto.nombre },
      { key: "precio", label: "Precio", type: "number", step: "0.01", value: producto.precio },
      { key: "stock", label: "Stock", type: "number", value: producto.stock },
      {
        key: "categoria_id", label: "Categoría", type: "select",
        value: categoriaActual?.id,
        options: categorias.map(c => ({ value: c.id, text: c.nombre })),
      },
    ],
    onGuardar: async (id, valores) => {
      valores.categoria_id = parseInt(valores.categoria_id);
      valores.precio = parseFloat(valores.precio);
      valores.stock = parseInt(valores.stock);
      const res = await fetch(`${API}/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      if (res.ok) {
        mostrarMensaje("Producto actualizado");
        cerrarModal();
        cargarProductos().then(cargarMovimientos);
      } else {
        mostrarMensaje("Error al actualizar producto", true);
      }
    },
  });
}

document.getElementById("form-producto").addEventListener("submit", async (e) => {
  e.preventDefault();
    const body = {
    nombre: document.getElementById("prod-nombre").value.trim(),
    precio: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value),
    categoria_id: parseInt(document.getElementById("prod-categoria").value),
  };
  const errorValidacion = validarProducto(body);
  if (errorValidacion) { mostrarMensaje(errorValidacion, true); return; }
  const res = await fetch(`${API}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    mostrarMensaje("Producto creado");
    e.target.reset();
    cargarProductos();
  } else {
    mostrarMensaje("Error al crear producto", true);
  }
});

async function eliminarProducto(id) {
  const res = await fetch(`${API}/productos/${id}`, { method: "DELETE" });
  if (res.ok) { mostrarMensaje("Producto eliminado"); cargarProductos(); }
  else { mostrarMensaje("No se pudo eliminar", true); }
}

async function cargarMovimientos() {
  const res = await fetch(`${API}/movimientos`);
  const datos = await res.json();
  const tbody = document.querySelector("#tabla-movimientos tbody");
  tbody.innerHTML = "";
  datos.forEach(m => {
    tbody.innerHTML += `<tr>
      <td>${m.id}</td><td>${escaparHTML(m.producto_nombre)}</td><td>${m.tipo}</td>
      <td>${m.cantidad}</td><td>${formatearFecha(m.fecha)}</td>
    </tr>`;
  });
}

document.getElementById("form-movimiento").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    producto_id: parseInt(document.getElementById("mov-producto").value),
    tipo: document.getElementById("mov-tipo").value,
    cantidad: parseInt(document.getElementById("mov-cantidad").value),
  };
  const errorValidacion = validarMovimiento(body);
  if (errorValidacion) { mostrarMensaje(errorValidacion, true); return; }

  const res = await fetch(`${API}/movimientos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    mostrarMensaje("Movimiento registrado");
    e.target.reset();
    cargarMovimientos();
    cargarProductos();
  } else {
    mostrarMensaje("Error al registrar movimiento", true);
  }
});
function aplicarFiltroProductos() {
  const texto = document.getElementById("filtro-productos").value.trim().toLowerCase();
  document.querySelectorAll("#tabla-productos tbody tr").forEach(fila => {
    const nombre = fila.children[1].textContent.toLowerCase();
    fila.style.display = nombre.includes(texto) ? "" : "none";
  });
}

document.getElementById("filtro-productos").addEventListener("input", aplicarFiltroProductos);

cargarCategorias()
  .then(cargarProductos)
  .then(cargarMovimientos)
  .catch(() => {
    // El aviso se queda visible hasta recargar la pagina
    estado.textContent = `No se pudo conectar con la API en ${API}. Verifica que el servicio "web" este corriendo (docker compose ps) y recarga la pagina.`;
    estado.className = "msg error";
  });