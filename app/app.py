import os
from flask import Flask, jsonify
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
            "GET /productos", "POST /productos", "PUT /productos/<id>", "DELETE /productos/<id>",
            "GET /movimientos", "POST /movimientos"
        ]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)