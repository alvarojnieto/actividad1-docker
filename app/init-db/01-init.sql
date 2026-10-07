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
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION actualizar_stock_producto()
RETURNS TRIGGER AS $$
DECLARE
    stock_actual INTEGER;
BEGIN
    IF NEW.tipo = 'entrada' THEN
        UPDATE productos SET stock = stock + NEW.cantidad WHERE id = NEW.producto_id;

    ELSIF NEW.tipo = 'salida' THEN
        SELECT stock INTO stock_actual FROM productos WHERE id = NEW.producto_id;

        IF stock_actual IS NULL THEN
            RAISE EXCEPTION 'El producto % no existe', NEW.producto_id;
        END IF;

        IF NEW.cantidad > stock_actual THEN
            RAISE EXCEPTION 'Stock insuficiente: hay % unidades y se intentaron sacar %',
                stock_actual, NEW.cantidad;
        END IF;

        UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON movimientos
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_producto();


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