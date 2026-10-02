const API = "http://localhost:3000";
const estado = document.getElementById("estado");

function mostrarMensaje(texto, esError = false) {
  estado.textContent = texto;
  estado.className = esError ? "msg error" : "msg";
  setTimeout(() => (estado.textContent = ""), 3000);
}


async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const datos = await res.json();
  const tbody = document.querySelector("#tabla-categorias tbody");
  tbody.innerHTML = "";
  const select = document.getElementById("prod-categoria");
  select.innerHTML = "";
  datos.forEach(c => {
    tbody.innerHTML += `<tr>
      <td>${c.id}</td><td>${c.nombre}</td><td>${c.descripcion ?? ""}</td>
      <td>
        <div class="acciones">
          <button class="icon-btn" title="Editar" onclick='abrirModalEditar(${JSON.stringify(c)})'>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen" viewBox="0 0 16 16">
              <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z"/>
            </svg>
          </button>
          <button class="danger" onclick="eliminarCategoria(${c.id})">Eliminar</button>
        </div>
      </td>
    </tr>`;
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

const modalOverlay = document.getElementById("modal-overlay");

function abrirModalEditar(categoria) {
  document.getElementById("editar-cat-id").value = categoria.id;
  document.getElementById("editar-cat-nombre").value = categoria.nombre;
  document.getElementById("editar-cat-descripcion").value = categoria.descripcion ?? "";
  modalOverlay.classList.add("visible");
}

function cerrarModal() {
  modalOverlay.classList.remove("visible");
}

document.getElementById("cerrar-modal").addEventListener("click", cerrarModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) cerrarModal();
});

document.getElementById("form-editar-categoria").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editar-cat-id").value;
  const body = {
    nombre: document.getElementById("editar-cat-nombre").value,
    descripcion: document.getElementById("editar-cat-descripcion").value,
  };
  const res = await fetch(`${API}/categorias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    mostrarMensaje("Categoría actualizada");
    cerrarModal();
    cargarCategorias();
  } else {
    mostrarMensaje("Error al actualizar categoría", true);
  }
});

document.getElementById("form-categoria").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("cat-nombre").value;
  const descripcion = document.getElementById("cat-descripcion").value;
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
  const tbody = document.querySelector("#tabla-productos tbody");
  tbody.innerHTML = "";
  const select = document.getElementById("mov-producto");
  select.innerHTML = "";
  datos.forEach(p => {
    tbody.innerHTML += `<tr>
      <td>${p.id}</td><td>${p.nombre}</td><td>$${p.precio}</td><td>${p.stock}</td>
      <td>${p.categoria_nombre}</td>
      <td><button class="danger" onclick="eliminarProducto(${p.id})">Eliminar</button></td>
    </tr>`;
    select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
  });
}

document.getElementById("form-producto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    nombre: document.getElementById("prod-nombre").value,
    precio: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value),
    categoria_id: parseInt(document.getElementById("prod-categoria").value),
  };
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
      <td>${m.id}</td><td>${m.producto_nombre}</td><td>${m.tipo}</td>
      <td>${m.cantidad}</td><td>${new Date(m.fecha).toLocaleString()}</td>
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


cargarCategorias().then(cargarProductos).then(cargarMovimientos);