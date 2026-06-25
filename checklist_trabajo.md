# CHECKLIST — Trabajo Integrador Unidad 11
**Proyecto:** DONAR-APP — Sistema de evaluación de donantes de sangre  
**Fecha de revisión:** 2026-06-24 (actualización 2)  
**Leyenda:** ✅ Cumplido · ⚠️ Parcial / mejorable · ❌ Falta

---

## 1. Reconocimiento de voz (ASR) — Bloque 4

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 1.1 | Usuario puede interactuar por voz (micrófono del navegador) | ✅ | `useChatFlow.ts:iniciarVoz()` — botón 🎙️ en TabConsulta, panel "Asistente de voz" |
| 1.2 | SpeechRecognition (API de Google) como opción principal | ✅ | `window.SpeechRecognition / webkitSpeechRecognition`, `lang="es-AR"` |
| 1.3 | Whisper como alternativa offline | ✅ | Endpoint `/whisper` en `main.py` + `iniciarWhisper()` en hook |
| 1.4 | Transcripción visible en tiempo real en la interfaz | ✅ | Aparece como burbuja de usuario inmediatamente tras el reconocimiento |
| 1.5 | WER medido sobre 10+ frases de referencia | ✅ | 12 frases en `wer.py:FRASES_PRUEBA`, tab dedicado TabWER, endpoint `/wer/resumen` |
| 1.6 | WER media reportada | ✅ | `resumen_wer()` calcula promedio, visible en dashboard (StatCard "WER") |
| 1.7 | WER **desviación estándar** reportada | ✅ | `wer.py:resumen_wer()` devuelve `wer_std` y `wer_pct_std` usando `statistics.stdev()` |
| 1.8 | Documentar limitaciones del ASR (ruido, acentos, jerga) | ⚠️ | `evaluar_wer.py` tiene comentarios; se documenta formalmente en `informe_tecnico.md` |

**Estado del bloque: 7/8 ✅** *(era 6/8)*

---

## 2. Síntesis de voz (TTS) — Bloque 4

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 2.1 | Sistema responde al usuario con audio generado | ✅ | Endpoint `GET /tts` en `main.py:299-304` con gTTS |
| 2.2 | gTTS en español | ✅ | `lang="es", tld="com.ar"` — español rioplatense |
| 2.3 | Audio reproducible en la interfaz web | ✅ | `playTTS()` en `api.ts`, `<audio>` en `BotBurbuja.tsx` |
| 2.4 | Configurable: texto, voz o ambas | ✅ | Toggle "🔊 Voz activada / 🔇 Voz silenciada" en panel voz; panel texto sin TTS automático |

**Estado del bloque: 4/4 ✅**

---

## 3. Procesamiento del Lenguaje Natural — Bloque 1

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 3.1 | Tokenización del texto de entrada | ✅ | `nlp.py:tokenizar()` — usa spaCy `doc.is_alpha`; fallback regex `[a-záéíóúüñ]+` |
| 3.2 | NER con al menos 3 tipos de entidades del dominio | ✅ | `extraer_entidades()` detecta: TIPO (50+ subcategorías), TIEMPO, PESO, EDAD + PER/LOC/ORG/MISC de spaCy |
| 3.3 | POS tagging | ✅ | `pos_tag()` en `nlp.py` — diccionario de dominio sobre `token.pos_` de spaCy; etiquetas VERB/NOUN/ADJ/STOP/NUM/OTHER |
| 3.4 | Detección de intención o clasificación de consulta | ✅ | `detectar_intencion()` — 3 clases: `querer_donar`, `consulta_tiempo`, `informacion`/`consulta_general` |
| 3.5 | Uso de spaCy (`es_core_news_sm`) | ✅ | `NLPProcessor.__init__()` carga `es_core_news_sm`. `tokenizar()`, `pos_tag()` y `extraer_entidades()` usan el modelo |
| 3.6 | Accuracy NER medida sobre 20+ ejemplos anotados | ✅ | `backend/eval_ner.py` — 25 oraciones anotadas, mide TP/FN/Accuracy (Recall). Ejecutar: `python eval_ner.py` |
| 3.7 | Búsqueda de medicamentos con tolerancia tipográfica | ✅ | `main.py:POST /medicamento` — Levenshtein dist ≤ 2 + normalización unicode + fallback a motor de reglas |

**Estado del bloque: 7/7 ✅** *(era 6/7)*

---

## 4. Modelo de N-gramas — Bloque 2

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 4.1 | Modelo de bigramas entrenado en corpus del dominio | ✅ | `ngrams.py:ModeloNgramas.entrenar()` — corpus de `corpus.json` + frases de entrenamiento adicionales |
| 4.2 | Modelo de trigramas | ✅ | Mismo método `entrenar()` construye bigramas y trigramas simultáneamente |
| 4.3 | Suavizado Add-k con k configurable (no solo k=1) | ✅ | Parámetro `k` en constructor; slider en `TabNgramas.tsx`; acepta valores 0.01–10 |
| 4.4 | PP calculada y mostrada | ✅ | `perplejidad()` calculada por consulta, visible en tab N-gramas y en cada respuesta del backend |
| 4.5 | PP usada en al menos una funcionalidad | ✅ | Detección de fuera-de-dominio (PP > 60) en `main.py:245-258` — alerta al usuario si la consulta es incoherente |
| 4.6 | PP evaluada sobre **conjunto de test separado** del de entrenamiento | ✅ | `main.py:120-126` — split 80/20 semilla fija (seed=42). Endpoint `/ngramas/evaluacion` reporta PP sobre `CORPUS_TEST` |
| 4.7 | Comparación PP con MLE (k=0) vs Add-k | ✅ | Endpoint `/ngramas/comparacion` — corre 4 configuraciones (k=0.0001, 0.1, 0.5, 1.0) sobre el mismo test set y devuelve tabla |
| 4.8 | Tablas de probabilidad de transición top-10 | ✅ | Endpoints `/ngramas/tabla_bigramas` y `/ngramas/tabla_trigramas` + `TabNgramas.tsx` con tablas interactivas |
| 4.9 | Autocompletado o sugerencia de continuación | ✅ | Endpoint `/ngramas/siguiente?palabra=...` — sección "Probabilidad condicional" en TabNgramas |
| 4.10 | Generación de texto (bonus) | ✅ | Endpoint `/ngramas/generar` — sección en TabNgramas |

**Estado del bloque: 9/10 ✅** *(era 7/10 — faltan datos numéricos de PP en informe, no funcionalidad)*

> **Nota:** El único ítem sin marcar completamente es que la comparación MLE vs Add-k no está expuesta visualmente en TabNgramas (solo existe el endpoint `/ngramas/comparacion`). Si se agrega una tabla en la UI sería 10/10.

---

## 5. Recuperación de Información — Bloque 3

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 5.1 | Índice invertido construido sobre el corpus | ✅ | `search.py:construir_indice()` |
| 5.2 | Pesos TF-IDF para cada término | ✅ | Calculado en `construir_indice()` — TF normalizado × IDF suavizado |
| 5.3 | Búsqueda por similitud coseno | ✅ | `buscar()` con `_coseno()` |
| 5.4 | Evaluación P/R/F1 sobre 10+ consultas etiquetadas | ✅ | 10 consultas en `main.py:CONSULTAS_EVALUACION`, `evaluar()` calcula P/R/F1 por consulta y promedio |
| 5.5 | Resultados rankeados con snippets | ✅ | Endpoint `/buscar` devuelve doc + score + snippet; visibles en `TabIR.tsx` |
| 5.6 | Índice persistido entre sesiones | ✅ | `indice_tfidf.json` — guardado al construir, cargado al iniciar el servidor |

**Estado del bloque: 6/6 ✅**

---

## 6. Persistencia en base de datos

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 6.1 | SQLite como motor | ✅ | `donar.db` — creado automáticamente en `main.py:init_db()` |
| 6.2 | Mínimo 3 tablas | ✅ | `corpus`, `consultas`, `metricas` |
| 6.3 | Índice invertido persistido | ✅ | `indice_tfidf.json` (archivo JSON junto a la DB) |
| 6.4 | Historial con timestamp, texto original, texto transcripto, resultado, métricas | ✅ | Tabla `consultas` tiene: id, texto, texto_transcripto, resultado, motivo, intencion, entidades, fecha, perplejidad, score_ir, tiempo_respuesta_ms, origen |
| 6.5 | texto_transcripto separado del texto original en flujo de voz | ⚠️ | El campo existe pero en el flujo guiado la voz envía el texto transcripto directamente como "texto". En consultas libres sí se distinguen. |

**Estado del bloque: 4/5 ✅**

---

## 7. Interfaz web

### 7.1 Vista principal (usuario)

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 7.1.1 | Botón de micrófono para captura de voz | ✅ | Panel "Asistente de voz" — botón 🎙️ grande, cambia a rojo mientras escucha |
| 7.1.2 | Campo de texto como alternativa | ✅ | Panel "Asistente de texto" con input + botón ➤ |
| 7.1.3 | Área de resultados con formato claro | ✅ | Interfaz de chat con burbujas `BotBurbuja` / `UsuarioBurbuja` |
| 7.1.4 | Reproducción de respuesta en audio (TTS) | ✅ | Auto-TTS en modo voz; toggle manual en ambos paneles |
| 7.1.5 | Historial de la sesión visible | ✅ | Mensajes acumulados en el chat durante la sesión |
| 7.1.6 | Flujo guiado completo de 14 fases clínicas | ✅ | `useChatFlow.ts` refactorizado: `confirmar_inicio → pedir_peso/edad/sexo → q_frecuencia_donacion → q_embarazo → q_salud_general → q_medicacion → q_vacunas → q_enfermedades → q_diabetes_tipo → q_odontologo → q_tatuajes_procedimientos → resultado` |
| 7.1.7 | Salto condicional de preguntas según sexo | ✅ | `siguientePregunta()` omite `q_embarazo` si el sexo no es "Mujer" |
| 7.1.8 | Detección semántica de Sí/No | ✅ | `detectarSiNo()` reconoce afirmaciones/negaciones coloquiales argentinas ("nop", "dale", "claro", etc.) |
| 7.1.9 | Acumulación de restricciones por sesión | ✅ | `restriccionesRef` acumula ❌/⏳/⚠️ por bloque; `irAResultado()` determina resultado final |
| 7.1.10 | Búsqueda de centros de donación por ciudad | ✅ | `procesarCiudad()` con búsqueda exacta + centros cercanos si no hay coincidencia exacta |
| 7.1.11 | Botones Sí/No en fases dicotómicas | ✅ | `TabConsulta.tsx`: `FASES_SI_NO` y `FASES_CON_TEXTO` separan el tipo de input según la fase activa |
| 7.1.12 | Confirmación SweetAlert al cerrar sesión | ✅ | `page.tsx:138-150`: diálogo `Swal.fire()` antes de hacer logout; `sweetalert2` instalado como dependencia npm |

### 7.2 Dashboard

| # | Requisito | Estado | Dónde está / Qué falta |
|---|-----------|--------|------------------------|
| 7.2.1 | Métricas globales (total consultas, WER, PP, tiempo de respuesta) | ✅ | 7 StatCards: total, aptos, no aptos, PP promedio, Score IR, tiempo ms, WER% |
| 7.2.2 | Top 10 consultas más frecuentes | ✅ | Barras horizontales con frecuencia relativa |
| 7.2.3 | Distribución por tipo/categoría (gráfico de torta) | ✅ | `PieChart` con colores por resultado (apto, no_apto_temporal, etc.) |
| 7.2.4 | Evolución temporal (gráfico de líneas por día) | ✅ | `LineChart` SVG con consultas por día |
| 7.2.5 | Métricas P/R/F1 del motor de búsqueda | ✅ | StatCards de Precisión, Recall, F1 con datos reales de `ir/metricas` |
| 7.2.6 | Nube de palabras o histograma de términos | ✅ | Nube de palabras CSS con tamaño proporcional a frecuencia |
| 7.2.7 | Datos REALES de la base de datos (no inventados) | ✅ | Todo viene de endpoints que leen SQLite en tiempo real |
| 7.2.8 | Exportar historial (bonus) | ✅ | Botón "⬇️ Exportar CSV" del historial |

**Estado del bloque: 20/20 ✅**

---

## 8. Evaluación y métricas

| # | Métrica | Estado | Detalle |
|---|---------|--------|---------|
| 8.1 | WER media sobre 10+ frases | ✅ | 12 frases, media calculada y guardada en DB |
| 8.2 | WER desviación estándar | ✅ | `wer.py:resumen_wer()` devuelve `wer_std` y `wer_pct_std` con `statistics.stdev()` |
| 8.3 | PP sobre conjunto de test separado del de entrenamiento | ✅ | Split 80/20 seed=42 en `main.py:120-126`; endpoint `/ngramas/evaluacion` devuelve PP sobre `CORPUS_TEST` |
| 8.4 | Comparación PP MLE vs Add-k documentada | ✅ | Endpoint `/ngramas/comparacion` compara k=0.0001, 0.1, 0.5, 1.0 sobre mismo test set |
| 8.5 | P/R/F1 sobre 10+ consultas etiquetadas | ✅ | 10 consultas en `CONSULTAS_EVALUACION`, evaluación automática al iniciar |
| 8.6 | Accuracy NER sobre 20+ ejemplos anotados | ✅ | `backend/eval_ner.py` — 25 oraciones anotadas, mide TP/FN/Accuracy |
| 8.7 | Tiempo de respuesta del pipeline medido | ✅ | `tiempo_respuesta_ms` medido y guardado en cada consulta, visible en dashboard |
| 8.8 | Valores documentados con números en informe | ✅ | `informe_tecnico.md` — métricas WER, PP, P/R/F1, Accuracy NER con valores reales |

**Estado del bloque: 8/8 ✅** *(era 4/8)*

---

## 9. Documentación y entrega

| # | Requisito | Estado | Detalle |
|---|-----------|--------|---------|
| 9.1 | README.md con instrucciones de instalación y ejecución | ✅ | Completo: prerrequisitos, instalación, ejecución, estructura, endpoints, base de datos |
| 9.2 | requirements.txt con dependencias y versiones | ✅ | `backend/requirements.txt` con versiones fijadas · `frontend/package.json` incluye `sweetalert2 ^11.26.25` |
| 9.3 | Informe técnico 3-5 páginas | ✅ | `informe_tecnico.md` — descripción, arquitectura, corpus, métricas, limitaciones, mejoras |
| 9.4 | Video demo 3-5 minutos con voz real | ❌ | No existe — **pendiente grabar** |
| 9.5 | Código organizado en módulos | ✅ | `nlp.py`, `ngrams.py`, `search.py`, `wer.py`, `rules.py`, `main.py` — frontend en tabs y hooks |
| 9.6 | Docstrings en el código | ⚠️ | `evaluar_wer.py` tiene docstring de módulo; `wer.py:calcular_wer()` y `nlp.py:normalizar_coloquialismos()` tienen docstrings. Faltan en `NLPProcessor`, `ModeloNgramas`, `MotorBusqueda` y sus métodos públicos |
| 9.7 | Presentación para defensa oral (15 min) | ⚠️ | Script disponible en `informe_discurso.md` — falta armar slides |

**Estado del bloque: 5/7 ✅** *(era 3/7)*

---

## Estructura de archivos (recomendada vs actual)

| Recomendado por la guía | Estado | Archivo actual |
|------------------------|--------|----------------|
| `app.py` (Streamlit) | ➡️ Diferente (mejor) | `backend/main.py` (FastAPI) + `frontend/` (Next.js) — stack más profesional |
| `modules/asr.py` | ⚠️ | ASR en `useChatFlow.ts` (frontend). `wer.py` documenta el cálculo como módulo Python |
| `modules/nlp.py` | ✅ | `backend/nlp.py` |
| `modules/ngrams.py` | ✅ | `backend/ngrams.py` |
| `modules/search.py` | ✅ | `backend/search.py` |
| `modules/tts.py` | ⚠️ | TTS inline en `main.py:299-304` — no es módulo separado |
| `modules/db.py` | ⚠️ | DB inline en `main.py:135-198` — no es módulo separado |
| `data/corpus/` | ⚠️ | `backend/corpus.json` — un JSON, no carpeta con `.txt` individuales |
| `tests/eval_wer.py` | ✅ | `backend/evaluar_wer.py` |
| `tests/eval_search.py` | ⚠️ | Integrado en endpoint `/ir/metricas`, no script independiente |
| `tests/eval_ner.py` | ✅ | `backend/eval_ner.py` — 25 oraciones anotadas |
| `docs/informe.pdf` | ⚠️ | `informe_tecnico.md` existe — falta convertir a PDF |

---

## Resumen ejecutivo

| Bloque | Cumplido | Total | % |
|--------|----------|-------|---|
| 1. ASR | 7 | 8 | 87% |
| 2. TTS | 4 | 4 | 100% |
| 3. PLN | 7 | 7 | 100% |
| 4. N-gramas | 9 | 10 | 90% |
| 5. IR | 6 | 6 | 100% |
| 6. Base de datos | 4 | 5 | 80% |
| 7. Interfaz | 20 | 20 | 100% |
| 8. Evaluación | 8 | 8 | 100% |
| 9. Documentación | 5 | 7 | 71% |
| **TOTAL** | **70** | **75** | **93%** |

---

## Lo que queda pendiente (prioridades mínimas para la entrega)

### 🔴 CRÍTICO — afecta directamente la nota

1. **Video demo** — 3-5 minutos con voz real  
   Flujo completo: micrófono → transcripción → NLP → búsqueda → respuesta TTS → dashboard. Sin esto la entrega está incompleta.

### 🟡 IMPORTANTE — mejora la nota

2. **Slides para defensa oral** — 15 minutos  
   Usar `informe_discurso.md` como guión. Armar 10-12 slides: propósito, arquitectura, demo en vivo, métricas, análisis de errores, conclusiones.

3. **Docstrings en clases principales**  
   Agregar docstring de una línea a `NLPProcessor`, `ModeloNgramas`, `MotorBusqueda` y sus métodos públicos.

### 🟢 OPCIONAL — puede sumar puntos

4. Exponer la comparación MLE vs Add-k en `TabNgramas` (actualmente solo existe el endpoint `/ngramas/comparacion`).
5. Separar `tts.py` y `db.py` como módulos independientes.
6. Crear `tests/eval_search.py` como script independiente.

---

## Cambios desde la última revisión (2026-06-24, actualización 2)

### ✅ Completado en esta sesión

- **WER desviación estándar** (`wer.py`): `resumen_wer()` ya devuelve `wer_std` y `wer_pct_std` usando `statistics.stdev()`. Item 1.7 y 8.2 ahora ✅.
- **Evaluación NER** (`eval_ner.py`): 25 oraciones anotadas manualmente con entidades esperadas. Mide TP/FN/Accuracy. Ejecutar con `python eval_ner.py`. Items 3.6 y 8.6 ahora ✅.
- **Split train/test para PP** (`main.py:120-126`): el corpus se divide 80/20 con semilla fija (seed=42). El modelo entrena solo sobre `CORPUS_TRAIN`. Endpoint `/ngramas/evaluacion` reporta PP sobre `CORPUS_TEST`. Items 4.6 y 8.3 ahora ✅.
- **Comparación MLE vs Add-k** (`main.py:424-451`): endpoint `/ngramas/comparacion` ejecuta 4 configuraciones (k=0.0001, 0.1, 0.5, 1.0) sobre el 20% de test y devuelve tabla. Items 4.7 y 8.4 ahora ✅.
- **Informe técnico** (`informe_tecnico.md`): documentación formal con arquitectura, corpus, métricas, limitaciones y mejoras. Items 8.8 y 9.3 ahora ✅.
- **Informe de discurso** (`informe_discurso.md`): guión extenso y didáctico para la defensa oral de 15 minutos.

---

## Cambios desde la revisión anterior (2026-06-24, actualización 1)

### ✅ Completado en esa sesión

- **Confirmación al cerrar sesión con SweetAlert2** (`page.tsx`): diálogo `Swal.fire()` antes del logout.
- **spaCy integrado en `extraer_entidades()`** (`nlp.py`): corre `doc.ents` de `es_core_news_sm` antes de las reglas del dominio.

---

## Cambios desde la revisión anterior (2026-06-04)

### ✅ Completado en ese commit

- **Flujo guiado refactorizado completamente** (`useChatFlow.ts`): 14 fases clínicas.
- **Salto condicional `q_embarazo`**, **detección semántica Sí/No**, **acumulación de restricciones**, **búsqueda de centros por ciudad**, **UI adaptativa según fase**.
- **Endpoint `POST /medicamento`**: búsqueda con Levenshtein dist ≤ 2.
- **Ampliación de `rules.py`**: 82 líneas nuevas con antipsicóticos, anticoagulantes, betabloqueantes, etc.

---

## Lo que está muy bien (puntos fuertes a destacar en la defensa)

- **Stack profesional**: FastAPI + Next.js en vez de Streamlit.
- **NLP propio con coverage amplio**: `rules.py` cubre 30+ condiciones médicas reales.
- **Dos motores de ASR**: Web Speech API (online) y Whisper tiny (offline).
- **Motor de medicamentos con tolerancia tipográfica**: Levenshtein + normalización unicode.
- **Dashboard 100% con datos reales**: todos los gráficos leen SQLite.
- **N-gramas con 5 funcionalidades**: PP, detección out-of-domain, autocompletado, generación de texto y comparación MLE vs Add-k.
- **IR con persistencia**: índice TF-IDF guardado en JSON.
- **Evaluación completa**: WER (media + std), PP (train vs test), P/R/F1 (IR), Accuracy NER, tiempo de respuesta — todo medido y documentado.

---

> Checklist generado revisando el código fuente contra los requisitos de la guía del trabajo integrador (Unidad 11 — Técnicas de Procesamiento del Habla). Última actualización: 2026-06-24.
