import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)

def get_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"),
        dbname=os.environ.get("POSTGRES_DB"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        cursor_factory=RealDictCursor,
    )

@app.route("/")
def index():
    return jsonify({
        "mensaje": "API de inventario de productos",
        "endpoints": [
            "GET /categorias", "POST /categorias",
            "PUT /categorias/<id>", "DELETE /categorias/<id>",
            "GET /productos", "POST /productos",
            "PUT /productos/<id>", "DELETE /productos/<id>",
            "GET /movimientos", "POST /movimientos",
            "PUT /movimientos/<id>", "DELETE /movimientos/<id>"
        ]
    })

@app.route("/categorias", methods=["GET"])
def listar_categorias():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM categorias ORDER BY id;")
    datos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(datos)

@app.route("/categorias", methods=["POST"])
def crear_categoria():
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO categorias (nombre, descripcion) VALUES (%s, %s) RETURNING *;",
        (body["nombre"], body.get("descripcion")),
    )
    nueva = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(nueva), 201

@app.route("/categorias/<int:id>", methods=["PUT"])
def actualizar_categoria(id):
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE categorias SET nombre=%s, descripcion=%s WHERE id=%s RETURNING *;",
        (body["nombre"], body.get("descripcion"), id),
    )
    actualizada = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if actualizada is None:
        return jsonify({"error": "Categoría no encontrada"}), 404
    return jsonify(actualizada)

@app.route("/categorias/<int:id>", methods=["DELETE"])
def eliminar_categoria(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM categorias WHERE id=%s RETURNING id;", (id,))
    eliminada = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if eliminada is None:
        return jsonify({"error": "Categoría no encontrada"}), 404
    return jsonify({"mensaje": "Categoría eliminada"})

@app.route("/productos", methods=["GET"])
def listar_productos():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.*, c.nombre AS categoria_nombre
        FROM productos p
        JOIN categorias c ON p.categoria_id = c.id
        ORDER BY p.id;
    """)
    datos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(datos)

@app.route("/productos", methods=["POST"])
def crear_producto():
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO productos (nombre, precio, stock, categoria_id) "
        "VALUES (%s, %s, %s, %s) RETURNING *;",
        (body["nombre"], body["precio"], body.get("stock", 0), body["categoria_id"]),
    )
    nuevo = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(nuevo), 201

@app.route("/productos/<int:id>", methods=["PUT"])
def actualizar_producto(id):
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE productos SET nombre=%s, precio=%s, stock=%s, categoria_id=%s "
        "WHERE id=%s RETURNING *;",
        (body["nombre"], body["precio"], body["stock"], body["categoria_id"], id),
    )
    actualizado = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if actualizado is None:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify(actualizado)

@app.route("/productos/<int:id>", methods=["DELETE"])
def eliminar_producto(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM productos WHERE id=%s RETURNING id;", (id,))
    eliminado = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if eliminado is None:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify({"mensaje": "Producto eliminado"})

@app.route("/movimientos", methods=["GET"])
def listar_movimientos():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT m.*, p.nombre AS producto_nombre
        FROM movimientos m
        JOIN productos p ON m.producto_id = p.id
        ORDER BY m.fecha DESC;
    """)
    datos = cur.fetchall()
    for d in datos:
        d["fecha"] = d["fecha"].isoformat()
    cur.close()
    conn.close()
    return jsonify(datos)

@app.route("/movimientos", methods=["POST"])
def crear_movimiento():
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO movimientos (producto_id, tipo, cantidad) "
        "VALUES (%s, %s, %s) RETURNING *;",
        (body["producto_id"], body["tipo"], body["cantidad"]),
    )
    nuevo = cur.fetchone()
    nuevo["fecha"] = nuevo["fecha"].isoformat()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(nuevo), 201

@app.route("/movimientos/<int:id>", methods=["PUT"])
def actualizar_movimiento(id):
    body = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE movimientos SET producto_id=%s, tipo=%s, cantidad=%s "
        "WHERE id=%s RETURNING *;",
        (body["producto_id"], body["tipo"], body["cantidad"], id),
    )
    actualizado = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if actualizado is None:
        return jsonify({"error": "Movimiento no encontrado"}), 404
    actualizado["fecha"] = actualizado["fecha"].isoformat()
    return jsonify(actualizado)

@app.route("/movimientos/<int:id>", methods=["DELETE"])
def eliminar_movimiento(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM movimientos WHERE id=%s RETURNING id;", (id,))
    eliminado = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if eliminado is None:
        return jsonify({"error": "Movimiento no encontrado"}), 404
    return jsonify({"mensaje": "Movimiento eliminado"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)