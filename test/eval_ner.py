import os
import sys

# Configurar el path para poder importar módulos desde la carpeta 'backend'
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
backend_dir = os.path.join(project_root, 'backend')

sys.path.append(project_root)
sys.path.append(backend_dir)

try:
    # Intentamos importar la clase del módulo nlp
    from nlp import NLPProcessor
except ImportError as e1:
    try:
        from backend.nlp import NLPProcessor
    except ImportError as e2:
        print("❌ Error: No se pudo importar 'NLPProcessor'. Revisa los paths.")
        print(f"Detalles técnicos:\n - {e1}\n - {e2}")
        sys.exit(1)

# Conjunto de 20 ejemplos anotados manualmente.
# Formato: (Texto de entrada del usuario, {Tipo_Entidad: [Valores esperados]})
# Los valores esperados deben estar en el texto como se espera que el NER los detecte.
DATASET_EVALUACION = [
    ("Tengo 35 años y quiero donar sangre", {"EDAD": 35}),
    ("Peso 65 kg y estoy sano", {"PESO": 65}),
    ("Ayer tomé ibuprofeno por un dolor de cabeza", {"TIPO": "medicamento"}),
    ("Me hice un tatuaje hace 3 meses", {"TIPO": "tatuaje", "TIEMPO": 3}),
    ("Tuve hepatitis a los 10 años", {"TIPO": "enfermedad", "EDAD": 10}),
    ("Tomo levotiroxina todos los días", {"TIPO": "medicamento"}),
    ("Peso 48 kilos, ¿puedo donar?", {"PESO": 48}),
    ("Tengo 17 años", {"EDAD": 17}),
    ("Me operaron de apendicitis hace 1 año", {"TIPO": "cirugia", "TIEMPO": 12}),
    ("Estoy tomando amoxicilina", {"TIPO": "medicamento"}),
    ("Tuve sifilis hace mucho", {"TIPO": "sifilis", "TIEMPO": 13}),
    ("Hace 6 meses tuve dengue", {"TIEMPO": 6, "TIPO": "enfermedad"}),
    ("Tomo enalapril para la presión alta", {"TIPO": "medicamento"}),
    ("Me puse un piercing ayer", {"TIPO": "piercing", "TIEMPO": 0.03}),
    ("Peso 80 kg y tengo 40 años", {"PESO": 80, "EDAD": 40}),
    ("Tuve chagas de chico", {"TIPO": "chagas"}),
    ("A veces tomo aspirina", {"TIPO": "medicamento"}),
    ("Tuve un parto hace 4 meses", {"TIPO": "embarazo", "TIEMPO": 4}),
    ("Me vacuné contra el covid la semana pasada", {"TIPO": "vacuna", "TIEMPO": 0.25}),
    ("Tengo diabetes insulino dependiente", {"TIPO": "insulina"})
]

def evaluar_ner():
    """
    Evalúa la precisión (Accuracy) del extractor de entidades (NER)
    utilizando el dataset de 20+ ejemplos anotados a mano.
    """
    print(f"\n--- Iniciando Evaluación NER sobre {len(DATASET_EVALUACION)} ejemplos ---")
    
    total_entidades_esperadas = 0
    total_entidades_correctas = 0
    oraciones_perfectas = 0
    
    nlp_processor = NLPProcessor()

    for texto, entidades_esperadas in DATASET_EVALUACION:
        # Llamar al método NER usando la instancia de la clase
        entidades_extraidas = nlp_processor.extraer_entidades(texto)
        
        aciertos_oracion = 0
        esperadas_oracion = len(entidades_esperadas)
        total_entidades_esperadas += esperadas_oracion
        
        for tipo_esperado, valor_esperado in entidades_esperadas.items():
            # Buscamos si el par {tipo, valor} esperado existe en la lista de entidades extraídas
            encontrado = any(e.get("tipo") == tipo_esperado and e.get("valor") == valor_esperado for e in entidades_extraidas)
            if encontrado:
                aciertos_oracion += 1
                total_entidades_correctas += 1
            else:
                print(f"[-] Fallo en: '{texto}' | Faltó detectar {tipo_esperado}: {valor_esperado}")
                print(f"    Extraído por NLP: {entidades_extraidas}")
        
        if aciertos_oracion == esperadas_oracion:
            oraciones_perfectas += 1
            
    # Cálculo de métricas
    accuracy_entidades = (total_entidades_correctas / total_entidades_esperadas) * 100 if total_entidades_esperadas > 0 else 0
    accuracy_oraciones = (oraciones_perfectas / len(DATASET_EVALUACION)) * 100
    
    print(f"\n=== Resultados de la Evaluación NER ===")
    print(f"Total de entidades a detectar:     {total_entidades_esperadas}")
    print(f"Entidades detectadas correctamente:{total_entidades_correctas}")
    print(f"Accuracy (por Entidad):            {accuracy_entidades:.2f}%")
    print(f"Accuracy (Oraciones Perfectas):    {accuracy_oraciones:.2f}%")
    
    if accuracy_entidades >= 70:
        print("\n✅ ¡Objetivo cumplido! El Accuracy es igual o mayor al 70% requerido.")
    else:
        print("\n⚠️ El Accuracy está por debajo del 70%. Podría ser necesario ajustar las reglas de extracción.")

if __name__ == "__main__":
    evaluar_ner()