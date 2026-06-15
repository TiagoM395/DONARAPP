# backend/crear_usuarios.py
import os
import sqlite3
import bcrypt

def init_db():
    db_path = os.path.join(os.path.dirname(__file__), "donar.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Crear tabla usuarios si no existe
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        rol TEXT
    )
    """)
    
    # 2. Insertar usuario administrador por defecto
    usuarios = [
        ("admin", bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'), "admin")
    ]
    
    for u in usuarios:
        try:
            cursor.execute("INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)", u)
            print(f"✅ Administrador '{u[0]}' creado exitosamente. Contraseña por defecto: 'admin123'")
        except sqlite3.IntegrityError:
            print(f"⚠️ El usuario '{u[0]}' ya existe en la base de datos.")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
