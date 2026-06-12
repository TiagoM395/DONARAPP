import os
import sqlite3
import bcrypt

def guardar_usuario(username, password, rol):
    db_path = os.path.join(os.path.dirname(__file__), "donar.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Encriptamos la contraseña en texto plano que nos pasan
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        # Intentamos crear un usuario nuevo
        cursor.execute("INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)", (username, password_hash, rol))
        print(f"✅ Usuario '{username}' creado exitosamente con el rol '{rol}'.")
    except sqlite3.IntegrityError:
        # Si tira error es porque el usuario ya existe, entonces lo actualizamos
        cursor.execute("UPDATE usuarios SET password_hash = ?, rol = ? WHERE username = ?", (password_hash, rol, username))
        print(f"🔄 Contraseña y rol actualizados para el usuario '{username}'.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    u = input("👤 Ingresa el nombre de usuario: ")
    p = input("🔑 Ingresa la contraseña en texto plano: ")
    r = input("🛡️ Ingresa el rol (admin / usuario): ")
    guardar_usuario(u, p, r)