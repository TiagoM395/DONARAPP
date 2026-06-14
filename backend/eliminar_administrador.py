import os
import sqlite3

def eliminar_administrador(username):
    db_path = os.path.join(os.path.dirname(__file__), "donar.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ejecutamos el borrado
    cursor.execute("DELETE FROM usuarios WHERE username = ?", (username,))
    
    # Comprobamos si realmente se borró alguna fila
    if cursor.rowcount > 0:
        print(f"✅ Administrador '{username}' eliminado exitosamente.")
    else:
        print(f"⚠️ No se encontró ningún administrador con el nombre '{username}'.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    print("--- ELIMINAR ADMINISTRADOR ---")
    u = input("👤 Ingresa el nombre del administrador a eliminar: ")
    
    confirmacion = input(f"⚠️ ¿Estás seguro de que deseas eliminar a '{u}'? (s/n): ")
    if confirmacion.lower() == 's':
        eliminar_administrador(u)
    else:
        print("❌ Operación cancelada.")