from flask import Flask, request, jsonify, g
import sqlite3, os, traceback
from datetime import datetime
from flask_cors import CORS

DB_PATH = os.path.join(os.path.dirname(__file__), "typing_speed.db")

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH, check_same_thread=False)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    cur = db.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    rating INTEGER,
                    comment TEXT,
                    created_at TEXT
                )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    name TEXT,
                    description TEXT,
                    latitude REAL,
                    longitude REAL,
                    created_at TEXT
                )""")
    db.commit()

app = Flask(__name__)
CORS(app)  # allow cross origin for local setups

@app.before_first_request
def startup():
    try:
        init_db()
    except Exception:
        traceback.print_exc()

@app.teardown_appcontext
def close_conn(exc):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

# simple root
@app.route("/")
def index():
    return "Typing speed backend (patched)."

if __name__ == "__main__":
    app.run(debug=True)
