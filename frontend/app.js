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
      <td><button class="danger" onclick="eliminarCategoria(${c.id})">Eliminar</button></td>
    </tr>`;
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

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