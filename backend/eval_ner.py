"""
Evaluación de Accuracy NER — DONAR-APP
Ejecutar: python eval_ner.py
Mide qué porcentaje de entidades esperadas detecta extraer_entidades().
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from nlp import NLPProcessor  # noqa: E402 — path must be set first

nlp = NLPProcessor()

# ── Corpus anotado manualmente (25 oraciones) ────────────────────────────────
# Cada entrada: (oración, entidades esperadas)
# TIPO requiere "valor" exacto (clave del dict TIPOS); TIEMPO/PESO/EDAD solo presencia.

CORPUS_EVAL = [
    ("me hice un tatuaje hace dos meses",
     [{"tipo": "TIPO", "valor": "tatuaje"}, {"tipo": "TIEMPO"}]),

    ("tomé antibióticos la semana pasada",
     [{"tipo": "TIPO", "valor": "medicamento"}, {"tipo": "TIEMPO"}]),

    ("tuve una cirugía hace tres meses",
     [{"tipo": "TIPO", "valor": "cirugia"}, {"tipo": "TIEMPO"}]),

    ("me vacuné hace 2 semanas",
     [{"tipo": "TIPO", "valor": "vacuna"}, {"tipo": "TIEMPO"}]),

    ("tengo diabetes tipo 2",
     [{"tipo": "TIPO", "valor": "insulina"}]),

    ("tuve dengue hace 20 días",
     [{"tipo": "TIPO", "valor": "enfermedad"}, {"tipo": "TIEMPO"}]),

    ("me hice un piercing hace un mes",
     [{"tipo": "TIPO", "valor": "piercing"}, {"tipo": "TIEMPO"}]),

    ("tengo fiebre desde ayer",
     [{"tipo": "TIPO", "valor": "enfermedad"}, {"tipo": "TIEMPO"}]),

    ("me operé hace seis meses",
     [{"tipo": "TIPO", "valor": "cirugia"}, {"tipo": "TIEMPO"}]),

    ("peso 60 kilos y tengo 25 años",
     [{"tipo": "PESO"}, {"tipo": "EDAD"}]),

    ("tomo warfarina hace un año",
     [{"tipo": "TIPO", "valor": "anticoagulante"}, {"tipo": "TIEMPO"}]),

    ("tuve hepatitis b",
     [{"tipo": "TIPO", "valor": "hepatitis_b"}]),

    ("me hice una endoscopia la semana pasada",
     [{"tipo": "TIPO", "valor": "endoscopia"}, {"tipo": "TIEMPO"}]),

    ("tengo epilepsia y tomo lamotrigina",
     [{"tipo": "TIPO", "valor": "epilepsia"}, {"tipo": "TIPO", "valor": "anticonvulsivante"}]),

    ("me transfundieron hace 4 meses",
     [{"tipo": "TIPO", "valor": "transfusion"}, {"tipo": "TIEMPO"}]),

    ("me puse botox hace 15 días",
     [{"tipo": "TIPO", "valor": "botox"}, {"tipo": "TIEMPO"}]),

    ("estoy embarazada",
     [{"tipo": "TIPO", "valor": "embarazo"}]),

    ("tengo asma y peso 70 kilos",
     [{"tipo": "TIPO", "valor": "asma"}, {"tipo": "PESO"}]),

    ("viajé a africa hace 2 semanas",
     [{"tipo": "TIPO", "valor": "viaje"}, {"tipo": "TIEMPO"}]),

    ("tomo roacutan para el acné",
     [{"tipo": "TIPO", "valor": "isotretinoina"}]),

    ("tengo 18 años y quiero donar sangre",
     [{"tipo": "EDAD"}]),

    ("tengo sida",
     [{"tipo": "TIPO", "valor": "vih_sida"}]),

    ("me diagnosticaron chagas el año pasado",
     [{"tipo": "TIPO", "valor": "chagas"}, {"tipo": "TIEMPO"}]),

    ("tomo clonazepam hace dos años",
     [{"tipo": "TIPO", "valor": "ansiolítico"}, {"tipo": "TIEMPO"}]),

    ("me hice un tatuaje hace 6 meses y peso 55 kilos",
     [{"tipo": "TIPO", "valor": "tatuaje"}, {"tipo": "TIEMPO"}, {"tipo": "PESO"}]),
]


def entidad_detectada(esperada: dict, detectadas: list[dict]) -> bool:
    """True si la entidad esperada aparece en la lista de entidades detectadas."""
    for d in detectadas:
        if d["tipo"] != esperada["tipo"]:
            continue
        if "valor" not in esperada:
            return True
        if d.get("valor") == esperada["valor"]:
            return True
    return False


def evaluar() -> dict:
    """Corre el corpus de evaluación y devuelve TP, FN y accuracy."""
    tp = fn = 0
    filas = []

    for idx, (oracion, esperadas) in enumerate(CORPUS_EVAL, 1):
        detectadas = nlp.extraer_entidades(oracion)
        for esp in esperadas:
            encontrada = entidad_detectada(esp, detectadas)
            label = esp["tipo"] + (":" + esp["valor"] if "valor" in esp else "")
            filas.append((idx, oracion, label, encontrada))
            if encontrada:
                tp += 1
            else:
                fn += 1

    total = tp + fn
    accuracy = tp / total if total else 0.0
    return {"tp": tp, "fn": fn, "total": total, "accuracy": accuracy, "filas": filas}


def imprimir_reporte(r: dict) -> None:
    """Imprime tabla de resultados y métricas finales."""
    sep = "=" * 78
    print(sep)
    print("  EVALUACION ACCURACY NER - DONAR-APP")
    print(sep)
    print(f"  {'#':<4} {'Entidad esperada':<30} {'Detectada':<10}  Oracion")
    print("-" * 78)
    for idx, oracion, label, ok in r["filas"]:
        estado = "OK" if ok else "FALTA"
        frase = (oracion[:38] + "...") if len(oracion) > 41 else oracion
        print(f"  {idx:<4} {label:<30} {estado:<10}  {frase}")
    print(sep)
    print(f"  Oraciones evaluadas : {len(CORPUS_EVAL)}")
    print(f"  Entidades evaluadas : {r['total']}")
    print(f"  Detectadas   (TP)   : {r['tp']}")
    print(f"  No detectadas (FN)  : {r['fn']}")
    print(f"  Accuracy (Recall)   : {r['accuracy'] * 100:.1f}%")
    print(sep)


if __name__ == "__main__":
    resultado = evaluar()
    imprimir_reporte(resultado)
