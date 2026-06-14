import os
import sqlite3
import bcrypt

def guardar_administrador(username, password):
    db_path = os.path.join(os.path.dirname(__file__), "donar.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    rol = "admin"
    # Encriptamos la contraseña en texto plano que nos pasan
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        # Intentamos crear un usuario nuevo
        cursor.execute("INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)", (username, password_hash, rol))
        print(f"✅ Administrador '{username}' creado exitosamente.")
    except sqlite3.IntegrityError:
        # Si tira error es porque el usuario ya existe, entonces lo actualizamos
        cursor.execute("UPDATE usuarios SET password_hash = ?, rol = ? WHERE username = ?", (password_hash, rol, username))
        print(f"🔄 Contraseña actualizada para el administrador '{username}'.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    u = input("👤 Ingresa el nombre del administrador: ")
    p = input("🔑 Ingresa la contraseña en texto plano: ")
    guardar_administrador(u, p)