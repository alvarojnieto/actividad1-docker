CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id)
);

CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);


INSERT INTO categorias (nombre, descripcion) VALUES
    ('Bebidas', 'Bebidas frías y calientes'),
    ('Snacks', 'Pasabocas y dulces'),
    ('Licores', 'Bebidas alcohólicas'),
    ('Aseo', 'Productos de limpieza'),
    ('Oficina', 'Insumos de oficina');

INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES
    ('Agua 500ml', 2500, 100, 1),
    ('Gaseosa Cola', 3500, 80, 1),
    ('Papas fritas', 4000, 50, 2),
    ('Chocolatina', 2000, 60, 2),
    ('Cerveza', 6000, 40, 3);

INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES
    (1, 'entrada', 100),
    (2, 'entrada', 80),
    (3, 'salida', 10),
    (4, 'entrada', 60),
    (5, 'salida', 5);