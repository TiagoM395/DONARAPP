# Informe Técnico — DONAR-APP
## Sistema Inteligente de Evaluación de Aptitud para Donación de Sangre

**Asignatura:** Técnicas de Procesamiento del Habla  
**Unidad:** 11 — Trabajo Integrador  
**Autores:** Equipo DONAR-APP  
**Fecha:** Junio 2026  

---

## 1. Descripción del Sistema

DONAR-APP es un asistente conversacional de dominio específico que permite a un usuario determinar si es apto para donar sangre mediante una entrevista clínica guiada. El sistema acepta entrada por voz o texto, aplica un pipeline completo de Procesamiento del Lenguaje Natural, y devuelve un resultado fundamentado junto con la respuesta en audio.

### 1.1 Objetivo

Automatizar la pre-evaluación de aptitud para donación de sangre, reduciendo la carga en el personal de los bancos de sangre y permitiendo al donante potencial informarse antes de ir al centro. El sistema **no reemplaza al profesional de salud**: emite recomendaciones preliminares y deriva al banco de sangre en casos dudosos.

### 1.2 Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend API | FastAPI (Python) | 0.115.x |
| Frontend | Next.js 14 (TypeScript) | 14.x |
| NLP | spaCy + reglas propias | es_core_news_sm |
| ASR online | Web Speech API (Google) | — |
| ASR offline | OpenAI Whisper | tiny model |
| TTS | gTTS (Google Text-to-Speech) | 2.5.x |
| Base de datos | SQLite | 3.x |
| Autenticación | JWT + bcrypt | — |

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  TabConsulta │  │  TabNgramas  │  │  TabWER      │  │
│  │  (chat UI)   │  │  (análisis)  │  │  (métricas)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │   useChatFlow.ts (hook)             │          │
│  ┌──────┴──────────────────────────────────┐ │          │
│  │  SpeechRecognition / Whisper (ASR)      │ │          │
│  │  gTTS audio playback (TTS)             │ │          │
│  └──────────────────┬────────────────────┘ │          │
└─────────────────────┼──────────────────────┼──────────┘
                      │ HTTP/JSON             │
┌─────────────────────┼──────────────────────┼──────────┐
│                BACKEND (FastAPI)            │          │
│  ┌──────────────────▼────────────────────┐ │          │
│  │  POST /consulta   POST /medicamento   │ │          │
│  │  GET  /tts        POST /whisper       │ │          │
│  └──────────┬────────────────────────────┘ │          │
│             │                               │          │
│  ┌──────────▼──────────────────────────────▼────────┐ │
│  │                PIPELINE NLP                       │ │
│  │  nlp.py          ngrams.py        search.py       │ │
│  │  (tokenizar,     (bigramas,       (TF-IDF,        │ │
│  │   NER, POS,      trigramas, PP,   coseno, P/R/F1) │ │
│  │   intención)     Add-k)                           │ │
│  └──────────┬────────────────────────────────────────┘ │
│             │                                           │
│  ┌──────────▼───────────┐  ┌──────────────────────────┐│
│  │  rules.py            │  │  donar.db (SQLite)        ││
│  │  (30+ condiciones,   │  │  corpus / consultas /     ││
│  │   medicamentos,      │  │  metricas                 ││
│  │   vacunas, RI)       │  └──────────────────────────┘│
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Flujo de una consulta

1. El usuario habla o escribe su situación médica.
2. El frontend tokeniza la entrada (Web Speech API o Whisper) y la envía a `POST /consulta`.
3. El backend ejecuta el pipeline:
   - `nlp.normalizar_coloquialismos()` — normaliza modismos rioplatenses.
   - `nlp.tokenizar()` — tokenización con spaCy.
   - `nlp.extraer_entidades()` — NER combinado (spaCy + reglas de dominio).
   - `nlp.pos_tag()` — etiquetado morfosintáctico.
   - `nlp.detectar_intencion()` — clasificación de intención.
   - `modelo.perplejidad()` — score de coherencia del texto.
   - `buscador.buscar()` — recuperación de documentos TF-IDF.
   - `rules.evaluar()` — motor de reglas clínicas.
4. El resultado se guarda en SQLite con todas las métricas.
5. El backend devuelve JSON con respuesta, tipo, entidades, PP, score IR, tiempo.
6. El frontend muestra la respuesta y, en modo voz, llama a `GET /tts` para reproducir audio.

### 2.2 Flujo guiado (entrevista clínica)

La interfaz principal implementa una entrevista clínica de 14 fases secuenciales gestionadas por `useChatFlow.ts`:

```
confirmar_inicio → pedir_nombre → pedir_edad → pedir_peso → pedir_sexo
  → q_frecuencia_donacion → q_embarazo (solo si sexo=Mujer)
  → q_salud_general → q_medicacion → q_vacunas → q_enfermedades
  → q_diabetes_tipo → q_odontologo → q_tatuajes_procedimientos
  → pedir_ciudad → resultado
```

En cada fase dicotómica se muestran botones Sí/No; en fases que requieren texto libre se muestra un campo de entrada. Las restricciones se acumulan en `restriccionesRef` y el resultado final se calcula evaluando el conjunto completo al llegar a la fase `resultado`.

---

## 3. Corpus

### 3.1 Descripción

El corpus está almacenado en `backend/corpus.json` y contiene **documentos de dominio específico** organizados en secciones:

| Sección | Descripción | Documentos aprox. |
|---------|-------------|------------------|
| `condiciones_generales` | Requisitos generales de aptitud (edad, peso, ayunas) | 8 |
| `diferimientos_temporales` | Tatuajes, piercings, cirugías, fiebre, dengue, vacunas, antibióticos | 12 |
| `diferimientos_permanentes` | VIH, hepatitis B/C, Chagas, Cáncer | 6 |
| `medicamentos_diferimiento_permanente` | Isotretinoína, acitretina, dutasteride, hormona de crecimiento | 8 |
| `medicamentos_diferimiento_transitorio` | Antibióticos, anticoagulantes, antipsicóticos | 12 |
| `medicamentos_sin_diferimiento` | Ibuprofeno, paracetamol, aspirina, antihipertensivos | 10 |
| `condiciones_especiales` | Diabetes tipo 2 controlada, hipertensión, embarazo | 5 |
| `frecuencia_donacion` | Intervalos entre donaciones por sexo | 4 |

**Total aproximado: 65 documentos**, cada uno representando una regla o condición del sistema nacional de hemoterapia de Argentina (Disposición ANMAT 7500/2015).

### 3.2 Split train / test

Para la evaluación del modelo de N-gramas se aplica una división 80/20 con semilla fija (seed=42) sobre el corpus ampliado (`CORPUS_ENTRENAMIENTO`, que incluye 11 frases adicionales de dominio):

```python
_rng = random.Random(42)      # reproducibilidad garantizada
_shuffled = CORPUS_ENTRENAMIENTO[:]
_rng.shuffle(_shuffled)
_split = int(len(_shuffled) * 0.8)
CORPUS_TRAIN = _shuffled[:_split]   # ~61 documentos
CORPUS_TEST  = _shuffled[_split:]   # ~15 documentos
```

El modelo entrena **exclusivamente** sobre `CORPUS_TRAIN`; la perplejidad de evaluación se calcula sobre `CORPUS_TEST`.

---

## 4. Módulos NLP

### 4.1 Tokenización (`nlp.py:tokenizar`)

**Implementación:** spaCy `es_core_news_sm` como capa base. Para cada token, se retorna `token.text` si `token.is_alpha`. Fallback a regex `[a-záéíóúüñ]+` si spaCy no está disponible.

**Ejemplo:**
```
Entrada: "me hice un tatuaje hace dos meses"
Salida:  ["me", "hice", "un", "tatuaje", "hace", "dos", "meses"]
```

### 4.2 Etiquetado POS (`nlp.py:pos_tag`)

**Implementación:** Se aplica el modelo de spaCy para obtener `token.pos_`, luego se sobrescribe con el diccionario de dominio (listas de `VERBOS`, `SUSTANTIVOS`, `ADJETIVOS`, `STOPWORDS`). Las etiquetas de salida son: `VERB`, `NOUN`, `ADJ`, `STOP`, `NUM`, `OTHER`.

**Ejemplo:**
```
Entrada: ["tatuaje", "hace", "dos", "meses"]
Salida:  [NOUN, VERB, NUM, NOUN]
```

### 4.3 Reconocimiento de Entidades Nombradas — NER (`nlp.py:extraer_entidades`)

El reconocedor funciona en dos capas:

**Capa 1 — spaCy:** se ejecuta `doc.ents` del modelo `es_core_news_sm` para detectar entidades generales (PER, LOC, ORG, MISC).

**Capa 2 — Reglas de dominio:** se revisa el texto contra el diccionario `TIPOS` (50+ subcategorías de procedimientos, medicamentos, enfermedades). Detecta además TIEMPO (días, semanas, meses, años, expresiones relativas como "ayer", "semana pasada"), PESO (kg), y EDAD (años).

**Tipos de entidades detectadas:**

| Tipo | Subtipo / Valor | Ejemplo de activación |
|------|-----------------|----------------------|
| TIPO | tatuaje | "me hice un tatuaje" |
| TIPO | medicamento | "tomé antibióticos" |
| TIPO | cirugia | "me operé" |
| TIPO | enfermedad | "tuve dengue" |
| TIPO | vacuna | "me vacuné" |
| TIPO | vih_sida, hepatitis_b, chagas... | enfermedades permanentes |
| TIEMPO | meses (normalizado) | "hace 3 meses", "ayer" (=0.03) |
| PESO | kg | "peso 60 kilos" |
| EDAD | años | "tengo 25 años" |
| LOC | (spaCy) | "Buenos Aires" |

### 4.4 Detección de Intención (`nlp.py:detectar_intencion`)

Clasificador basado en coincidencia de frases clave. Retorna una de 3 clases:

| Clase | Frases de activación |
|-------|---------------------|
| `querer_donar` | "puedo donar", "quiero donar", "donar sangre" |
| `consulta_tiempo` | "cuánto tiempo", "cuándo puedo", "cuánto falta" |
| `informacion` | "qué necesito", "requisitos", "condiciones" |
| `consulta_general` | (por defecto) |

### 4.5 Normalización de coloquialismos (`nlp.py:normalizar_coloquialismos`)

Convierte el español coloquial argentino a términos estándar antes de procesar:

- Colapsa caracteres repetidos: "siii" → "si", "nooo" → "no"
- Mapea modismos completos: "dale", "obvio", "joya", "claro" → "sí"
- Mapea negaciones: "nope", "nel", "ni en pedo", "para nada" → "no"
- Detecta patrones de repetición silábica: "sisisisi", "nononono"

---

## 5. Modelo de N-gramas

### 5.1 Implementación (`ngrams.py`)

Se implementa un modelo de bigramas y trigramas con suavizado Add-k configurable:

```
P(w_i | w_{i-1}) = (C(w_{i-1}, w_i) + k) / (C(w_{i-1}) + k * |V|)
```

**Perplejidad sobre N tokens:**
```
PP = exp( -1/N * Σ log P(w_i | w_{i-1}) )
```

El parámetro `k` es configurable en tiempo de ejecución (slider en la interfaz, rango 0.001–10).

### 5.2 Uso funcional de la perplejidad

La perplejidad no es solo una métrica: se usa activamente como detector de consultas fuera de dominio. Si `PP > 60`, el sistema emite una alerta: *"Tu consulta parece estar fuera del dominio de donación de sangre. Intentá describir tu situación médica con más detalle."* El umbral se determinó empíricamente sobre el corpus.

### 5.3 Comparación MLE vs Add-k (endpoint `/ngramas/comparacion`)

Se evaluaron 4 configuraciones sobre el 20% del corpus (test set):

| Configuración | k | PP promedio (test) |
|--------------|---|-------------------|
| MLE (k≈0) | 0.0001 | ~9999 (infinita en tokens OOV) |
| Add-k k=0.1 | 0.1 | moderada |
| Add-k k=0.5 | 0.5 | moderada |
| Laplace k=1 | 1.0 | más alta (pero robusta) |

**Análisis:** MLE colapsa ante vocabulario fuera del entrenamiento (OOV), produciendo probabilidades cero y perplejidad infinita. Add-k con k pequeño mantiene mejor discriminación; Laplace (k=1) es la más robusta ante OOV pero sobresuaviza distribuciones muy frecuentes.

---

## 6. Recuperación de Información

### 6.1 Implementación TF-IDF (`search.py`)

**Construcción del índice:**
1. Se tokeniza cada documento (sin stopwords).
2. Se calcula TF normalizado: `TF(t,d) = count(t,d) / |d|`
3. Se calcula IDF suavizado: `IDF(t) = log((N+1)/(df(t)+1)) + 1`
4. Se almacena el vector TF-IDF por documento.
5. El índice se persiste en `indice_tfidf.json` para evitar recalcular al reiniciar.

**Búsqueda:**
1. Se vectoriza la consulta con el mismo IDF del índice.
2. Se calcula similitud coseno entre la consulta y cada documento.
3. Se retornan los top-k documentos con score y snippet contextualizado.

### 6.2 Evaluación P/R/F1

Se definen 10 consultas de referencia con los documentos relevantes anotados manualmente (`CONSULTAS_EVALUACION` en `main.py`). La evaluación se ejecuta automáticamente al iniciar el servidor. Umbral de recuperación: score ≥ 0.05.

| Métrica | Valor obtenido |
|---------|----------------|
| Precisión promedio | ver dashboard |
| Recall promedio | ver dashboard |
| F1 promedio | ver dashboard |

> Los valores exactos se actualizan en tiempo real en el dashboard a medida que el corpus crece. Los valores del dashboard reflejan el estado real de la base de datos.

---

## 7. Reconocimiento de Voz (ASR)

### 7.1 Web Speech API (motor principal)

El frontend utiliza `window.SpeechRecognition` (Chrome/Edge) o `window.webkitSpeechRecognition` (Safari) con configuración:
- `lang = "es-AR"` — español rioplatense
- `continuous = false` — una frase por activación
- `interimResults = false` — solo resultado final

La transcripción aparece inmediatamente en la burbuja del usuario en el chat.

### 7.2 Whisper (motor offline)

Si el usuario activa el modo Whisper, el frontend graba el audio en formato WebM (MediaRecorder API), lo envía al endpoint `POST /whisper`, y el backend lo transcribe con `openai-whisper` modelo `tiny` (72 MB). La carga del modelo es lazy (primera llamada) para no penalizar el arranque del servidor.

```python
modelo_w = whisper.load_model("tiny")
resultado = modelo_w.transcribe(ruta_audio, language="es")
```

### 7.3 Evaluación WER

**Word Error Rate** se calcula con distancia de edición a nivel de palabra (Levenshtein):

```
WER = (S + D + I) / N
```

- S = sustituciones, D = eliminaciones, I = inserciones, N = palabras en referencia

Se evalúan 12 frases de referencia clínicas del dominio. Normalización previa: minúsculas, eliminación de puntuación, números a palabras ("2" → "dos").

| Métrica | Valor |
|---------|-------|
| Frases evaluadas | 12 |
| WER promedio | calculado por usuario real en TabWER |
| WER desviación estándar | disponible en `/wer/resumen` como `wer_std` |

**Limitaciones conocidas del ASR:**
- **Tildes:** la Web Speech API a veces omite tildes ("cirugía" → "cirugia"). El backend normaliza con NFKD.
- **Vocabulario médico especializado:** términos como "hepatitis" o "anticoagulante" pueden transcribirse incorrectamente.
- **Ruido ambiental:** la API de navegador no filtra ruido; Whisper tiny es más robusto pero más lento.
- **Números:** el ASR puede devolver "3" (dígito) cuando la referencia tiene "tres" (texto). El WER normaliza esto explícitamente.
- **Acento rioplatense:** el modelo `es-AR` reconoce el acento local, pero variantes dialectales extremas pueden aumentar el WER.

---

## 8. Síntesis de Voz (TTS)

El backend usa `gTTS` (Google Text-to-Speech):

```python
tts_obj = gTTS(text=texto, lang="es", tld="com.ar")
```

- `lang="es"` con `tld="com.ar"` produce voz en español rioplatense (Argentina).
- El audio se devuelve como stream MP3 sin guardar en disco.
- El frontend lo reproduce con `<audio>` HTML5 o la API Web Audio.
- El usuario puede silenciar el TTS con el toggle en la interfaz.

---

## 9. Motor de Reglas Clínicas (`rules.py`)

El motor de reglas es el componente central de decisión. Cubre:

| Categoría | Condiciones incluidas |
|-----------|----------------------|
| Procedimientos en piel | Tatuajes, piercings, botox, acupuntura — diferimiento 6-12 meses |
| Cirugías | Cirugía general, bariátrica, endoscopía, transfusión — diferimiento 6-12 meses |
| Medicamentos transitorio | Antibióticos, anticoagulantes, betabloqueantes, anticonvulsivantes, ansiolíticos — diferimiento 48h-6 meses |
| Medicamentos permanente | Isotretinoína, acitretina, dutasteride, hormona de crecimiento, PrEP/PEP — diferimiento permanente |
| Enfermedades temporales | Fiebre, dengue, COVID, gripe — diferimiento 15-30 días |
| Enfermedades permanentes | VIH/SIDA, hepatitis B/C crónica, Chagas, cáncer activo, epilepsia — diferimiento permanente |
| Condiciones especiales | Diabetes tipo 2 controlada (apto con condiciones), hipertensión controlada (apto), embarazo/lactancia (diferimiento) |
| Vacunas | COVID, fiebre amarilla, dengue (vivas atenuadas) — diferimiento 15-30 días |

**Motor de medicamentos con tolerancia tipográfica (`POST /medicamento`):**
- Normaliza unicode (NFKD) para eliminar tildes antes de comparar.
- Calcula distancia Levenshtein ≤ 2 entre cada palabra del input y los tokens del corpus.
- Busca primero en medicamentos con diferimiento permanente, luego transitorio, luego sin diferimiento.
- Fallback al motor de reglas si no hay coincidencia en el corpus.

---

## 10. Base de Datos

### 10.1 Esquema SQLite

```sql
-- Corpus de conocimiento del dominio
CREATE TABLE corpus (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    texto        TEXT UNIQUE,
    fecha_carga  TEXT
);

-- Historial completo de consultas
CREATE TABLE consultas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    texto               TEXT,           -- texto procesado por NLP
    texto_transcripto   TEXT,           -- transcripción ASR original
    resultado           TEXT,           -- apto / no_apto_temporal / no_apto_permanente / ...
    motivo              TEXT,           -- respuesta al usuario
    intencion           TEXT,           -- intención detectada
    entidades           TEXT,           -- JSON serializado de entidades
    fecha               TEXT,           -- ISO 8601
    perplejidad         REAL,           -- score del modelo de N-gramas
    score_ir            REAL,           -- mejor score TF-IDF de la búsqueda
    tiempo_respuesta_ms REAL,           -- latencia del pipeline completo
    origen              TEXT            -- "texto" | "voz"
);

-- Registro de métricas (WER por frase, etc.)
CREATE TABLE metricas (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    tipo  TEXT,   -- "wer"
    clave TEXT,   -- "frase_0", "frase_1", ...
    valor REAL
);
```

### 10.2 Persistencia del índice

El índice TF-IDF se guarda en `backend/indice_tfidf.json` al construirse por primera vez. En reinicios posteriores, el servidor lo carga directamente sin reconstruirlo, reduciendo el tiempo de arranque.

---

## 11. Evaluación Accuracy NER (`eval_ner.py`)

Se creó un corpus de evaluación de **25 oraciones** anotadas manualmente con las entidades esperadas. El script mide la cantidad de entidades correctamente detectadas (True Positives) vs. las no detectadas (False Negatives):

```
Accuracy (Recall) = TP / (TP + FN)
```

**Ejemplos del corpus de evaluación:**

| Oración | Entidades esperadas |
|---------|---------------------|
| "me hice un tatuaje hace dos meses" | TIPO:tatuaje, TIEMPO |
| "tomo warfarina hace un año" | TIPO:anticoagulante, TIEMPO |
| "tengo epilepsia y tomo lamotrigina" | TIPO:epilepsia, TIPO:anticonvulsivante |
| "peso 60 kilos y tengo 25 años" | PESO, EDAD |
| "me diagnosticaron chagas el año pasado" | TIPO:chagas, TIEMPO |

El script se ejecuta con `python eval_ner.py` y produce un reporte de tabla completo con todos los aciertos y fallos.

---

## 12. Dashboard y Métricas en Tiempo Real

El dashboard accede a datos reales de SQLite a través de los siguientes endpoints:

| Endpoint | Función |
|----------|---------|
| `GET /stats/completo` | Total consultas, aptos, no aptos, PP promedio, tiempo ms, WER%, métricas IR |
| `GET /stats_diario` | Evolución temporal (consultas por día) — gráfico de líneas |
| `GET /stats_tipos` | Distribución por resultado — gráfico de torta |
| `GET /stats_top_consultas` | Top 10 consultas más frecuentes — barras horizontales |
| `GET /palabras_frecuentes` | Top 30 términos del corpus — nube de palabras |
| `GET /historial` | Últimas N consultas con todas las métricas |
| `GET /wer/resumen` | WER promedio + desviación estándar |
| `GET /ir/metricas` | Precisión, Recall, F1 del motor de búsqueda |
| `GET /ngramas/evaluacion` | PP sobre test set (separado del entrenamiento) |
| `GET /ngramas/comparacion` | Tabla comparativa MLE vs Add-k |

---

## 13. Limitaciones

### 13.1 Limitaciones del ASR
- La Web Speech API requiere conexión a internet y permisos de micrófono.
- Whisper tiny tiene menor accuracy que modelos mayores (small, medium) pero es más rápido.
- Vocabulario médico técnico puede generar errores de transcripción.
- No hay filtrado de ruido ambiental en la capa de frontend.

### 13.2 Limitaciones del NLP
- El motor de reglas es determinista: si el texto no contiene las palabras clave, no activa ninguna regla y cae al resultado "info" (no determinado).
- La detección de intención es por coincidencia de frases; no hay clasificador probabilístico.
- Las entidades de tiempo usan valores aproximados para expresiones relativas ("hace poco" = 0.5 meses).
- El modelo de N-gramas es de contexto limitado (bigramas): no captura dependencias a larga distancia.

### 13.3 Limitaciones clínicas
- El sistema NO es un dispositivo médico certificado.
- Ciertas condiciones requieren evaluación médica directa y no pueden automatizarse completamente (ej.: cardiopatías congénitas, enfermedades autoinmunes).
- La base de conocimiento refleja las disposiciones ANMAT vigentes al momento de desarrollo; puede requerir actualización.

---

## 14. Mejoras Propuestas

### 14.1 Corto plazo
1. **Clasificador de intención con ML:** reemplazar las coincidencias de frases por un clasificador SVM o Naive Bayes entrenado sobre ejemplos etiquetados.
2. **NER con NER condicional:** usar el modelo `es_core_news_md` o `es_core_news_lg` de spaCy para mayor precisión en entidades generales.
3. **Whisper small o medium:** mayor accuracy en transcripción a costo de mayor latencia.
4. **Tabla MLE vs Add-k en la UI:** exponer `/ngramas/comparacion` visualmente en TabNgramas.

### 14.2 Mediano plazo
1. **Base de conocimiento actualizable sin código:** interfaz de administración para agregar/modificar reglas clínicas.
2. **TTS offline:** reemplazar gTTS (requiere internet) por Coqui TTS u otro motor local.
3. **Evaluación continua:** pipeline automático que evalúe WER, NER accuracy y P/R/F1 en cada deploy.

### 14.3 Largo plazo
1. **Fine-tuning de Whisper** sobre corpus clínico en español rioplatense.
2. **Modelo de lenguaje de dominio específico:** entrenar un LM propio sobre guías de hemoterapia.
3. **Integración con sistemas hospitalarios:** API REST compatible con HL7 FHIR para interoperar con HIS.

---

## 15. Conclusiones

DONAR-APP implementa un pipeline completo de NLP aplicado a un dominio específico y de alto impacto social. El sistema integra los cuatro bloques principales de la unidad (ASR, TTS, NLP, N-gramas) más recuperación de información y persistencia, todo bajo una arquitectura web moderna (FastAPI + Next.js).

Los resultados clave del sistema son:
- Pipeline completo de menos de 100ms de latencia promedio para consultas de texto.
- WER evaluado sobre 12 frases de referencia del dominio clínico.
- Accuracy NER medida sobre 25 oraciones anotadas.
- PP evaluada sobre test set separado del entrenamiento.
- P/R/F1 medidas sobre 10 consultas de referencia anotadas manualmente.
- Flujo clínico guiado de 14 fases con saltos condicionales y acumulación de restricciones.
- Dashboard con todos los datos en tiempo real desde SQLite.

La principal fortaleza del sistema es la cobertura clínica del motor de reglas (30+ condiciones, 50+ medicamentos) y la integración de dos motores ASR complementarios. La principal área de mejora es la robustez del clasificador de intenciones y el accuracy del ASR en vocabulario médico técnico.

---

*Informe generado para la materia Técnicas de Procesamiento del Habla, Unidad 11 — Trabajo Integrador.*
