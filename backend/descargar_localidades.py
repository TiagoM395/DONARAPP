import requests
import json
import os

def descargar_localidades():
    print("Descargando localidades de Buenos Aires desde la API de Georef...")
    url = "https://apis.datos.gob.ar/georef/api/localidades"
    
    # provincia 06 es Buenos Aires. 'max=5000' asegura traer todas juntas (son ~1100).
    params = {
        "provincia": "06",
        "max": 5000,
        "campos": "nombre,centroide.lat,centroide.lon"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        datos = response.json()
        
        localidades_api = datos.get("localidades", [])
        print(f"Se encontraron {len(localidades_api)} localidades.")
        
        # Transformamos al formato deseado
        localidades_limpias = [
            {
                "nombre": loc["nombre"],
                "latitud": loc["centroide"]["lat"],
                "longitud": loc["centroide"]["lon"]
            }
            for loc in localidades_api if loc.get("centroide") and loc["centroide"]["lat"] is not None
        ]
        
        # Ordenamos alfabéticamente por nombre
        localidades_limpias.sort(key=lambda x: x["nombre"])
        
        # Construimos la ruta absoluta hacia la carpeta del frontend
        ruta_salida = os.path.join(os.path.dirname(__file__), "..", "frontend", "app", "lib", "localidades_ba.json")
        ruta_salida = os.path.abspath(ruta_salida)
        
        with open(ruta_salida, "w", encoding="utf-8") as f:
            json.dump(localidades_limpias, f, ensure_ascii=False, indent=4)
            
        print(f"¡Éxito! Archivo generado y guardado en:\n{ruta_salida}")
        
    except Exception as e:
        print(f"Error al descargar los datos: {e}")

if __name__ == "__main__":
    descargar_localidades()