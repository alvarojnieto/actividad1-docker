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
            "GET /movimientos", "POST /movimientos"
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)