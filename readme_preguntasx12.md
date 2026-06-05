# Flujo de Preguntas x12 — Asistente de Evaluación de Donantes

Documentación completa del flujo de preguntas implementado en **DONARVERSION1**.
Objetivo: incorporar este flujo exacto en una versión anterior del proyecto.

---

## Resumen ejecutivo

El asistente realiza **12 fases principales** (4 de perfil + 8 médicas) y hasta **6 sub-preguntas** opcionales que se activan según las respuestas del usuario.
Todo el estado y la lógica de transición viven en un único hook de React: `useChatFlow.ts`.

---

## Archivos que participan en el flujo

| Archivo | Rol |
|---------|-----|
| `frontend/app/hooks/useChatFlow.ts` | **Core** — máquina de estados, lógica de transición, parseo de respuestas, llamadas al backend |
| `frontend/app/components/tabs/TabConsulta.tsx` | Renderizado del chat, área de input adaptativa, paneles texto/voz |
| `frontend/app/components/chat/BotBurbuja.tsx` | Burbuja de respuesta del bot con colores por tipo de resultado |
| `frontend/app/components/chat/UsuarioBurbuja.tsx` | Burbuja de mensaje del usuario |
| `frontend/app/types/index.ts` | Tipos TypeScript: `FaseChat`, `MensajeChat`, `Consulta` |
| `frontend/app/lib/api.ts` | URL base del backend (`API = http://127.0.0.1:8000`), función `playTTS` |
| `backend/main.py` | Endpoints usados: `POST /consulta`, `POST /medicamento`, `GET /tts` |
| `backend/rules.py` | Motor de reglas médicas — evalúa medicamentos, enfermedades, vacunas |
| `backend/corpus.json` | Base de conocimiento médico con listas de medicamentos y enfermedades |

### Archivos que NO se modifican para incorporar este flujo

- `backend/nlp.py`, `backend/search.py`, `backend/ngrams.py`, `backend/wer.py`
- `frontend/app/components/ui/*`
- `frontend/app/hooks/useIsMobile.ts`
- `frontend/app/lib/tokens.ts`

---

## Las 12 fases principales (`FaseChat`)

```
confirmar_inicio → pedir_peso → pedir_edad → pedir_sexo
    → q_frecuencia_donacion
    → q_embarazo            (solo si sexo === "Mujer")
    → q_salud_general
    → q_medicacion
    → q_vacunas
    → q_enfermedades
    → q_odontologo
    → q_tatuajes_procedimientos
    → resultado
```

La función `siguientePregunta()` gestiona el salto automático de `q_embarazo` cuando el sexo no es "Mujer".

---

## Detalle fase por fase

### Fase 1 — `confirmar_inicio`

**Mensaje del bot:**
> "¿Querés comenzar con el asistente de evaluación de donantes?"

**Input renderizado:** Botones **Sí / No** (definidos en `FASES_SI_NO`)

| Respuesta | Acción |
|-----------|--------|
| Sí | Bot saluda, pregunta peso → ir a `pedir_peso` |
| No | Bot despide → ir a `resultado` (sin restricciones) |

**Función:** `procesarConfirmacion(raw: string)`

---

### Fase 2 — `pedir_peso`

**Mensaje del bot:**
> "¿Cuánto pesás? (ingresá el número en kg)"

**Input renderizado:** Campo de texto libre. Placeholder: `Ej: 72`

| Valor | Acción |
|-------|--------|
| < 10 o > 300 (no es número válido) | Error de validación, no avanza |
| < 50 kg | Restricción `no_apto_permanente`, ir a `resultado` |
| ≥ 50 kg | Guardar en `perfil.peso`, ir a `pedir_edad` |

**Función:** `procesarPeso(raw: string)`

---

### Fase 3 — `pedir_edad`

**Mensaje del bot:**
> "¿Cuántos años tenés?"

**Input renderizado:** Campo de texto libre. Placeholder: `Ej: 28`

| Valor | Acción |
|-------|--------|
| < 1 o > 120 | Error de validación |
| < 16 años | Restricción `no_apto_permanente`, ir a `resultado` |
| 16-17 años | Avisa que necesita autorización del centro, ir a `pedir_sexo` |
| > 65 años | Avisa que necesita certificado médico, ir a `pedir_sexo` |
| 16-65 años | Confirma requisito cumplido, ir a `pedir_sexo` |

**Función:** `procesarEdad(raw: string)`

---

### Fase 4 — `pedir_sexo`

**Mensaje del bot:**
> "¿Cuál es tu sexo biológico?"

**Input renderizado:** Tres botones: **Masculino / Femenino / Otro**
(en modo voz: campo de texto que parsea palabras clave)

| Selección | Valor guardado |
|-----------|---------------|
| Masculino | `"Hombre"` |
| Femenino | `"Mujer"` |
| Otro | `"Otro"` |

Guarda en `perfil.sexo`. Avanza a `q_frecuencia_donacion`.

**Funciones:** `procesarSexo(sexo: string)`, `procesarSexoPorVoz(raw: string)`

---

### Fase 5 — `q_frecuencia_donacion`

**Texto:** `"¿Alguna vez donaste sangre?"`

**Input:** Texto libre (Sí / No). Fases Sí/No se detectan con regex.

| Respuesta | Acción |
|-----------|--------|
| No | Ir a siguiente pregunta (`q_embarazo` o `q_salud_general`) |
| Sí | Preguntar cuándo fue → ir a sub-pregunta `q_ultima_donacion` |

**Sub-pregunta `q_ultima_donacion`:** `"¿Hace cuánto tiempo fue tu última donación? (Ej: 2 meses, 6 semanas, 1 año)"`

Parsea expresiones temporales: años → semanas, meses → semanas, semanas, días → semanas.

| Tiempo | Límite | Resultado |
|--------|--------|-----------|
| < 8 semanas (Hombre/Otro) | 2 meses | Restricción `⏳`, ir a `resultado` |
| < 12 semanas (Mujer) | 3 meses | Restricción `⏳`, ir a `resultado` |
| ≥ mínimo | — | Avanza a siguiente pregunta |

**Función:** `procesarUltimaDonacion(raw: string)`

---

### Fase 6 — `q_embarazo` *(solo si `perfil.sexo === "Mujer"`)*

**Texto:** `"¿Estás embarazada actualmente o estuviste embarazada en el último año?"`

| Respuesta | Restricción | Acción |
|-----------|-------------|--------|
| Sí | `❌ Embarazo actual o en el último año` | `irAResultado()` |
| No | — | Avanza a `q_salud_general` |

---

### Fase 7 — `q_salud_general`

**Texto:** `"¿Te sentís bien de salud?"`

| Respuesta | Acción |
|-----------|--------|
| Sí | Avanza a `q_medicacion` |
| No | Pide descripción → sub-pregunta `q_salud_cual` |

**Sub-pregunta `q_salud_cual`:** `"¿Qué te duele o cuál es tu malestar?"` → Campo texto libre.

Llama a `POST /consulta` con el malestar descrito.

| Respuesta del backend | Acción |
|-----------------------|--------|
| `no_apto_permanente` | Restricción `❌`, ir a `resultado` |
| `no_apto_temporal` | Restricción `⏳`, ir a `resultado` |
| `apto` | Avanza a siguiente pregunta |
| Otro (`info`, `consultar`, `fuera_de_dominio`) | Informa que no es impedimento, avanza |

**Función:** `procesarSaludCual(raw: string)` ← llama al backend

---

### Fase 8 — `q_medicacion`

**Texto:** `"¿Estás tomando algún medicamento actualmente?"`

| Respuesta | Acción |
|-----------|--------|
| No | Avanza a `q_vacunas` |
| Sí | Sub-pregunta `q_medicacion_cual` |

*Atajo:* Si el usuario escribe "sí [nombre del medicamento]" en una sola respuesta, se salta la sub-pregunta y evalúa directamente.

**Sub-pregunta `q_medicacion_cual`:** `"¿Cuál medicamento estás tomando actualmente? (Escribí el nombre del medicamento)"` → Campo texto libre. Placeholder: `Ej: ibuprofeno, insulina, anticoagulante...`

Llama a `POST /medicamento` con el nombre del medicamento.

| Respuesta del backend | Restricción | Acción |
|-----------------------|-------------|--------|
| `no_apto_permanente` | `❌ Medicamento: X — diferimiento permanente` | Ir a `resultado` |
| `no_apto_temporal` | `⏳ Medicamento: X — requiere período de espera` | Ir a `resultado` |
| `apto` (o no encontrado) | — | Avanza a `q_vacunas` |

**Función:** `procesarMedicacionCual(raw: string)` ← llama al backend (`/medicamento`)

---

### Fase 9 — `q_vacunas`

**Texto:** `"¿Te aplicaste alguna vacuna en el último mes?"`

| Respuesta | Acción |
|-----------|--------|
| No | Avanza a `q_enfermedades` |
| Sí | Sub-pregunta `q_vacuna_cual` |

*Atajo:* Si el usuario escribe "sí [nombre vacuna]" en una sola respuesta, se evalúa directamente.

**Sub-pregunta `q_vacuna_cual`:** `"¿Cuál vacuna te aplicaste? (Escribí el nombre de la vacuna)"` → Campo texto libre. Placeholder: `Ej: gripe, varicela, fiebre amarilla...`

Llama a `POST /consulta` con el texto `"vacuna [nombre]"`.

| Respuesta del backend | Restricción | Acción |
|-----------------------|-------------|--------|
| `no_apto_permanente` | `❌ Vacuna: X — diferimiento permanente` | Ir a `resultado` |
| `no_apto_temporal` | `⏳ Vacuna: X — requiere período de espera` | Ir a `resultado` |
| `apto` | — | Avanza a `q_enfermedades` |
| Otro | `⚠️ Vacuna: X — consultar` | Avanza igual (el banco evaluará) |

**Función:** `procesarVacunaCual(raw: string)` ← llama al backend (`/consulta`)

---

### Fase 10 — `q_enfermedades`

**Texto:** `"¿Tenés alguna enfermedad?"`

| Respuesta | Acción |
|-----------|--------|
| No | Avanza a `q_odontologo` |
| Sí | Sub-pregunta `q_enfermedades_cual` |

**Sub-pregunta `q_enfermedades_cual`:** `"¿Cuál enfermedad tenés? (Escribí el nombre de la enfermedad)"` → Campo texto libre. Placeholder: `Ej: diabetes, hipertensión, hepatitis...`

**Caso especial — Diabetes sin tipo especificado:**
Si el texto contiene "diabetes" o "diabético" pero sin "tipo 1" o "tipo 2", se activa la sub-pregunta `q_diabetes_tipo`:
> "¿Es diabetes tipo 1 o tipo 2?
> • Tipo 1 (insulinodependiente): NO PODÉS DONAR (permanente).
> • Tipo 2 (no insulinodependiente): PODÉS DONAR si está controlada."

Placeholder: `Tipo 1 / Tipo 2 (o escribí 1 o 2)`

| Tipo | Restricción |
|------|-------------|
| Tipo 1 | `❌ Diabetes tipo 1 (insulinodependiente) — diferimiento permanente` |
| Tipo 2 | Avanza, sin restricción |

Para otras enfermedades, llama a `POST /consulta`.

| Respuesta del backend | Restricción | Acción |
|-----------------------|-------------|--------|
| `no_apto_permanente` | `❌ Enfermedad: X` | Ir a `resultado` |
| `no_apto_temporal` | `⏳ Enfermedad: X` | Ir a `resultado` |
| `apto` | — | Avanza a `q_odontologo` |
| Otro | `⚠️ Enfermedad: X` | Avanza igual (el banco evaluará) |

**Funciones:** `procesarEnfermedadCual(raw)`, `procesarDiabetesTipo(raw)` ← llaman al backend (`/consulta`)

---

### Fase 11 — `q_odontologo`

**Texto:** `"¿Fuiste al odontólogo en el último año?"`

| Respuesta | Restricción | Acción |
|-----------|-------------|--------|
| Sí | `⚠️ Visita odontológica reciente` (aviso, no bloquea) | Avanza a `q_tatuajes_procedimientos` |
| No | — | Avanza a `q_tatuajes_procedimientos` |

*Esta fase nunca detiene el flujo — solo agrega una advertencia `⚠️`.*

---

### Fase 12 — `q_tatuajes_procedimientos`

**Texto:** `"¿Te hiciste tatuajes, piercings o tratamientos invasivos o cirugías en el último año?"`

| Respuesta | Restricción | Acción |
|-----------|-------------|--------|
| Sí | `⏳ Tatuaje, piercing o procedimiento invasivo — espera de 6 meses` | `irAResultado()` |
| No | — | `irAResultado()` |

*Esta es la última fase. Siempre lleva a `resultado`.*

---

## Resultado final (`irAResultado`)

Evalúa el array `restricciones` acumulado durante el flujo:

| Condición | Tipo resultado | Mensaje |
|-----------|---------------|---------|
| Sin restricciones | `apto` | "¡Podés donar sangre! Acercate al banco de sangre más cercano." |
| Hay al menos una `❌` | `no_apto_permanente` | "No podés donar sangre. Hablá con el médico del banco." |
| Solo restricciones `⏳` (sin `❌`) | `no_apto_temporal` | "Por el momento no podés donar. Volvé cuando se cumplan los tiempos de espera." |
| Solo restricciones `⚠️` (sin `❌` ni `⏳`) | `apto` con observaciones | "Tenés observaciones. El personal médico evaluará si podés donar." |

---

## Tipos TypeScript necesarios (`types/index.ts`)

```typescript
export interface Consulta {
  pregunta: string;
  respuesta: string;
  tipo: string;
  opciones: string[];
  intencion: string;
  entidades: { tipo: string; valor: string | number; unidad?: string }[];
  tokens: string[];
  pos: { token: string; pos: string }[];
  perplejidad: number;
  fuera_de_dominio: boolean;
  alerta_pp: string | null;
  score_ir: number;
  snippets: { doc: string; score: number; snippet: string }[];
  tiempo_ms: number;
}

export interface MensajeChat {
  id: number;
  rol: "usuario" | "bot";
  texto: string;
  consulta?: Consulta;
  esResultado?: boolean;
}

export type FaseChat =
  | "confirmar_inicio" | "pedir_peso" | "pedir_edad" | "pedir_sexo"
  | "q_frecuencia_donacion" | "q_ultima_donacion"
  | "q_embarazo"
  | "q_salud_general"
  | "q_salud_cual"
  | "q_medicacion"
  | "q_medicacion_cual"
  | "q_vacunas"
  | "q_vacuna_cual"
  | "q_enfermedades"
  | "q_enfermedades_cual"
  | "q_diabetes_tipo"
  | "q_odontologo"
  | "q_tatuajes_procedimientos"
  | "resultado";
```

---

## Endpoints del backend usados por el flujo

| Endpoint | Método | Cuándo se llama | Payload |
|----------|--------|-----------------|---------|
| `/consulta` | POST | Malestar (`q_salud_cual`), vacuna (`q_vacuna_cual`), enfermedad (`q_enfermedades_cual`) | `{ "texto": "<texto del usuario>" }` |
| `/medicamento` | POST | Medicamento (`q_medicacion_cual`) | `{ "texto": "<nombre medicamento>" }` |
| `/tts` | GET | Reproducción de voz automática (TTS) | `?texto=<texto>` |

Los tres endpoints deben existir en el backend para que el flujo funcione correctamente.
El endpoint `/whisper` (POST, para Whisper offline) solo es necesario si se usa el panel de voz con grabación.

---

## Detección de Sí / No en texto libre

La función `procesarRespuestaPregunta` usa dos niveles de detección:

**Nivel 1 — Regex directa:**
```
Negación:  /^(no|nop|nel|nunca|jamás|negativo|para nada|tampoco)\b/
Afirmación: /^(sí|si|s|yes|dale|ok|claro|correcto|afirmativo|efectivamente|cierto|verdad|exacto|obvio|por supuesto)\b/
```

**Nivel 2 — Detección semántica:**
```
Negación implícita: "no tengo", "no tuve", "no soy", "no fui", "no tomo", etc.
Afirmación implícita: "tengo", "tuve", "padezco", "fui", "tomo", "me hice", etc.
```

Si ningún patrón coincide → error: `"No entendí tu respuesta. Por favor respondé Sí o No."`

---

## Estado interno del hook (`useChatFlow`)

```typescript
// Variables de estado
fase: FaseChat               // Fase actual del flujo
perfil: { edad?, sexo?, peso? }  // Datos del usuario
restricciones: string[]      // Lista de restricciones acumuladas
mensajes: MensajeChat[]      // Historial del chat
input: string                // Texto del input actual
inputError: string           // Mensaje de error de validación
loading: boolean             // Espera de respuesta del backend
escuchando: boolean          // ASR (Google SpeechRecognition) activo
grabando: boolean            // Grabación Whisper activa
ttsOn: boolean               // TTS automático activado

// Ref paralelo (para callbacks asíncronos)
restriccionesRef: useRef     // Copia ref de restricciones (evita closures stale)
```

---

## Cómo incorporar este flujo en la versión anterior

### Paso 1 — Copiar los tipos

Reemplazar (o agregar) en `frontend/app/types/index.ts` los tipos `FaseChat`, `MensajeChat` y `Consulta` tal como están documentados arriba.

### Paso 2 — Copiar el hook

Copiar el archivo completo `frontend/app/hooks/useChatFlow.ts` desde DONARVERSION1 a la versión anterior.
Si la versión anterior ya tiene un `useChatFlow`, reemplazarlo completamente.

Verificar que el import de `API` y `playTTS` apunte al archivo correcto en la versión anterior:
```typescript
import { API, playTTS } from "../lib/api";
```

### Paso 3 — Copiar el componente de consulta

Copiar `frontend/app/components/tabs/TabConsulta.tsx` desde DONARVERSION1.

Si la versión anterior tiene una estructura de tabs diferente, lo mínimo a conservar es:
- El componente `InputArea` con su lógica de renderizado adaptativo
- Las constantes `FASES_CON_TEXTO` y `FASES_SI_NO`
- El doble panel texto/voz con `useChatFlow({ modo: "texto" })` y `useChatFlow({ modo: "voz" })`

### Paso 4 — Verificar los componentes de chat

Los componentes `BotBurbuja` y `UsuarioBurbuja` deben aceptar la interfaz `MensajeChat` con el campo `consulta?: Consulta`.
Si la versión anterior tiene versiones distintas de estos componentes, comparar las props esperadas.

### Paso 5 — Verificar el backend

Confirmar que la versión anterior tiene estos endpoints en `backend/main.py`:

```python
@app.post("/consulta")   # acepta { texto: str }, retorna { tipo, respuesta, ... }
@app.post("/medicamento") # acepta { texto: str }, retorna { tipo, respuesta }
@app.get("/tts")         # acepta ?texto=..., retorna audio/mpeg
```

Si faltan, copiar las implementaciones desde `backend/main.py` de DONARVERSION1.

### Paso 6 — Verificar `backend/rules.py` y `backend/corpus.json`

El endpoint `/medicamento` depende de las funciones `_buscar_corpus_medicamento` en `rules.py` y de las listas en `corpus.json`.
Si la versión anterior tiene una lógica distinta, verificar que:
- `rules.py` tenga la función `evaluar_medicamento(texto)` (o equivalente)
- `corpus.json` tenga las secciones `medicamentos_sin_diferimiento`, `medicamentos_diferimiento_transitorio`, `medicamentos_diferimiento_permanente`, `vacunas_diferir_1_mes`, `vacunas_sin_diferimiento`

---

## Diagrama simplificado del flujo

```
[INICIO]
    │
    ▼
confirmar_inicio ──No──► [FIN: gracias]
    │Sí
    ▼
pedir_peso ──<50kg──► [resultado: no_apto_permanente]
    │≥50kg
    ▼
pedir_edad ──<16──► [resultado: no_apto_permanente]
    │≥16
    ▼
pedir_sexo
    │
    ▼
q_frecuencia_donacion
    │Sí                      │No
    ▼                        │
q_ultima_donacion            │
    │<mín──► [resultado]     │
    │≥mín                    │
    └────────────────────────┘
                 │
                 ▼
        q_embarazo (solo Mujer)
                 │Sí──► [resultado: ❌]
                 │No
                 ▼
        q_salud_general
                 │No
                 ▼
        q_salud_cual ──►[backend /consulta]──► restricción o avanza
                 │Sí
                 ▼
        q_medicacion
                 │Sí
                 ▼
        q_medicacion_cual ──►[backend /medicamento]──► restricción o avanza
                 │No
                 ▼
        q_vacunas
                 │Sí
                 ▼
        q_vacuna_cual ──►[backend /consulta]──► restricción o avanza
                 │No
                 ▼
        q_enfermedades
                 │Sí
                 ▼
        q_enfermedades_cual ──►[backend /consulta]──► restricción o avanza
          (diabetes ambigua → q_diabetes_tipo)
                 │No
                 ▼
        q_odontologo ──Sí──► ⚠️ advertencia (no bloquea)
                 │
                 ▼
        q_tatuajes_procedimientos
                 │Sí──► ⏳ restricción
                 │
                 ▼
              [resultado]
         (evalúa restricciones acumuladas)
```

---

## Notas importantes

- **`restriccionesRef`** es un `useRef` que replica el array `restricciones` del estado. Se usa en `irAResultado()` para leer el valor actualizado sin depender de closures viejos en callbacks asíncronos. Si al copiar el hook aparece un bug donde el resultado siempre dice "apto" aunque haya restricciones, verificar que `addRestriccion` actualice ambos (`setRestricciones` y `restriccionesRef.current`).

- **Salto de `q_embarazo`**: La función `siguientePregunta()` recibe el sexo y salta `q_embarazo` cuando el sexo no es `"Mujer"`. Si se agrega alguna fase nueva al array `FASES_PREGUNTAS`, no hace falta tocar `TabConsulta` ni la lógica de resultado — solo agregar la fase al array y su case en `resolverFlujoMedico`.

- **Modo voz vs texto**: El hook recibe `modo: "texto" | "voz"` que solo afecta el placeholder de algunos mensajes (hint de voz dice "Decí el número" en vez de "Ingresá el número"). La lógica de evaluación es idéntica en ambos modos.

- **`procesarRespuestaPregunta` no llama al backend**: Las 8 fases del array `FASES_PREGUNTAS` se resuelven localmente con regex (Sí/No). Solo las sub-preguntas de detalle (`q_medicacion_cual`, `q_vacuna_cual`, `q_enfermedades_cual`, `q_salud_cual`) hacen llamadas HTTP al backend.
