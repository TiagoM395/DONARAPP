# README — Asistentes de Consulta (DONAR-APP)

## Índice
1. [Estructura de archivos](#estructura-de-archivos)
2. [Cómo funciona el flujo de chat](#cómo-funciona-el-flujo-de-chat)
3. [CSS y layout de los paneles](#css-y-layout-de-los-paneles)
4. [Tipos de datos](#tipos-de-datos)
5. [API y endpoints](#api-y-endpoints)

---

## Estructura de archivos

```
frontend/
├── app/
│   ├── page.tsx                          ← Página principal: header, tabs, footer (~128 líneas)
│   ├── layout.tsx                        ← Layout raíz de Next.js (fuente, metadata)
│   ├── globals.css                       ← Reset global y estilos base
│   │
│   ├── types/
│   │   └── index.ts                      ← Interfaces TypeScript (Consulta, MensajeChat, FaseChat)
│   │
│   ├── lib/
│   │   ├── api.ts                        ← URL base, fetchJSON, playTTS
│   │   └── tokens.ts                     ← Design tokens CSS-in-JS (btn, inp, tbl)
│   │
│   ├── hooks/
│   │   ├── useChatFlow.ts                ← Toda la lógica del cuestionario guiado
│   │   └── useIsMobile.ts               ← Detección de ancho de pantalla (768px)
│   │
│   └── components/
│       ├── ui/
│       │   ├── Card.tsx                  ← Card, SectionTitle, StatCard
│       │   ├── PieChart.tsx              ← Gráfico SVG de torta
│       │   └── InfoTag.tsx               ← Etiqueta informativa
│       ├── chat/
│       │   ├── BotBurbuja.tsx            ← Burbujas del bot con análisis técnico
│       │   └── UsuarioBurbuja.tsx        ← Burbuja del usuario
│       └── tabs/
│           ├── TabConsulta.tsx           ← Panel dual (texto + voz)
│           ├── TabDashboard.tsx          ← Estadísticas
│           ├── TabNgramas.tsx            ← N-gramas / perplejidad
│           ├── TabIR.tsx                 ← TF-IDF / IR
│           └── TabWER.tsx                ← Word Error Rate
```

---

## Cómo funciona el flujo de chat

### Componente raíz: `TabConsulta.tsx`

Crea **dos instancias independientes** del hook `useChatFlow`, una para texto y otra para voz:

```tsx
const texto = useChatFlow({ autoTts: false, bienvenida: "..." });
const voz   = useChatFlow({ autoTts: true,  bienvenida: "...", modo: "voz" });
```

Cada instancia maneja su propio estado (mensajes, fase, perfil, restricciones) sin compartir nada.

---

### Hook central: `useChatFlow.ts`

Contiene **toda** la lógica del cuestionario médico. Su estado interno es:

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `fase` | `FaseChat` | Paso actual del cuestionario |
| `perfil` | `{ edad?, sexo?, peso? }` | Datos básicos del donante |
| `restricciones` | `string[]` | Lista de impedimentos encontrados |
| `mensajes` | `MensajeChat[]` | Historial del chat |
| `loading` | `boolean` | Esperando respuesta del backend |
| `ttsOn` | `boolean` | Síntesis de voz activada |
| `escuchando` | `boolean` | Google ASR activo |
| `grabando` | `boolean` | Whisper activo |
| `ultimoContexto` | `string` | Última pregunta procesada (para contexto en API) |

#### Fases del cuestionario (en orden)

```
confirmar_inicio
    ↓ (Sí)
pedir_peso         → < 50 kg → resultado (no_apto_permanente)
    ↓
pedir_edad         → < 16 → resultado (no_apto_permanente)
    ↓
pedir_sexo         → botones: Masculino / Femenino / Otro
    ↓
q_sintomas_hoy     → No (síntoma detectado) → q_sintomas_describe (consulta API)
    ↓                → Sí → continua
q_sintomas_continuar (sí/no buttons)
    ↓
q_fiebre_72h       → Sí → restricción ⏳ → siguiente pregunta
    ↓
q_medicacion       → Sí → q_medicacion_detalle (consulta API por medicamento)
    ↓                → resultado de API puede activar q_medicacion_condicion
q_corazon          → Sí → restricción ❌
    ↓
q_diabetes         → Sí → q_diabetes_tipo
    ↓                    → Tipo 1 (insulina) → restricción ❌
    ↓                    → Tipo 2 → continua
q_presion          → Sí (>2 medicamentos) → restricción ❌
    ↓
q_riñones          → Sí → restricción ❌
    ↓
q_pulmones         → Sí → restricción ❌
    ↓
q_neuro            → Sí → restricción ❌
    ↓
q_cancer           → Sí → restricción ❌
    ↓
q_hepatitis        → Sí → restricción ❌
    ↓
q_ets_vih          → Sí → restricción ❌
    ↓
q_chagas           → Sí → restricción ❌
    ↓
q_procedimientos   → Sí → restricción ⏳
    ↓
q_tatuaje          → Sí → restricción ⏳
    ↓
q_transfusion      → Sí → restricción ⏳
    ↓
q_riesgo_sexual    → Sí → restricción ⏳
    ↓
q_drogas           → Sí → restricción ❌
    ↓
q_alcohol          → Sí → restricción ⏳
    ↓
q_vacunas          → Sí → restricción ⏳
    ↓
q_embarazada       → Sí → restricción ❌  (solo si sexo === "Mujer")
    ↓
q_parto_reciente   → Sí → restricción ⏳  (solo si sexo === "Mujer")
    ↓
resultado          → apto / no_apto_temporal / no_apto_permanente
```

#### Lógica de resultado final (`irAResultado`)

```
restricciones vacías          → "Podés donar sangre" (apto)
alguna restricción con ❌     → "No podés donar sangre" (no_apto_permanente)
solo restricciones con ⏳     → "Por el momento no podés donar sangre" (no_apto_temporal)
```

#### Cómo se interpreta cada respuesta (`procesarRespuestaPregunta`)

El hook aplica estas capas en orden para decidir si la respuesta es Sí o No:

1. **Negaciones directas**: `no`, `nunca`, `jamás`, `negativo` → No
2. **Patrones de negación con verbo**: `no tengo`, `no tuve`, `no soy` → No
3. **Patrones afirmativos con verbo**: `tengo`, `tuve`, `me diagnosticaron` → Sí
4. **Keywords médicas por fase** (`KEYWORDS_SI`): patrones regex específicos por pregunta
5. **API `/consulta`** (fallback): si ningún patrón matchea, llama al backend NLP

---

### Burbujas: `BotBurbuja.tsx` y `UsuarioBurbuja.tsx`

`BotBurbuja` recibe un `MensajeChat` y lo renderiza de dos formas:

**Mensaje simple** (sin `consulta`): fondo gris `#f1f5f9`, texto con soporte para segmentos separados por `\n\n`. Los segmentos con `✓` se renderizan en verde.

**Mensaje con resultado NLP** (con `consulta`): burbuja con color según tipo de respuesta:

| Tipo (`consulta.tipo`) | Color de fondo | Color de borde | Ícono | Label |
|------------------------|---------------|----------------|-------|-------|
| `apto` | `#f0fdf4` (verde) | `#16a34a` | ✅ | PODÉS DONAR |
| `no_apto_temporal` | `#fff1f2` (rojo) | `#dc2626` | ⏳ | POR EL MOMENTO NO PODES DONAR |
| `no_apto_permanente` | `#faf5ff` (violeta) | `#7c3aed` | 🚫 | NO PODÉS DONAR (PERMANENTE) |
| `consultar` | `#eff6ff` (azul) | `#2563eb` | 🏥 | NECESITO MÁS INFORMACIÓN |
| `fuera_de_dominio` | `#fffbeb` (amarillo) | `#d97706` | ⚠️ | FUERA DEL DOMINIO |
| `info` | `#f8fafc` (gris) | `#94a3b8` | ℹ️ | INFORMACIÓN |
| `cancelado_usuario` | `#fff1f2` (rojo) | `#dc2626` | 🚪 | POR DECISIÓN DEL USUARIO SE CANCELA EL CUESTIONARIO |

Cada burbuja NLP incluye un panel colapsable de **análisis técnico** con:
- Entidades detectadas (tipo, valor, unidad)
- POS tags con colores por categoría (VERB, NOUN, ADJ, NUM, STOP)
- Snippets TF-IDF más relevantes (máximo 2)
- Perplejidad (PP), Score IR, tiempo de respuesta (ms)

Si `msg.esResultado === true`, la burbuja se renderiza como **resultado final** con caja centrada.

`BotBurbuja` también recibe:
- `onOpcion(op: string)` — callback cuando el usuario toca una opción del bot
- `onTTS()` — callback para reproducir TTS del mensaje
- `showTts?: boolean` — si mostrar el botón de TTS (default `true`)

---

### Entrada de texto: `InputArea` en `TabConsulta.tsx`

El componente `InputArea` renderiza diferentes controles según la `fase` actual:

| Fase | Control mostrado |
|------|-----------------|
| `pedir_sexo` | Tres botones: Masculino / Femenino / Otro |
| `confirmar_inicio`, `q_sintomas_continuar` | Dos botones: Sí / No |
| `resultado` | Botón "Nueva evaluación" |
| Cualquier otra fase en `FASES_CON_TEXTO` | Input de texto + botón ➤ |

`FASES_CON_TEXTO` incluye todas las fases donde el usuario puede tipear libremente (excluye `confirmar_inicio`, `pedir_sexo`, `resultado`, `q_sintomas_continuar`).

El input tiene autofocus cuando la fase cambia y no hay loading activo.

---

### Panel de voz

El asistente de voz usa la misma lógica (`useChatFlow`) pero con:
- `autoTts: true` → reproduce audio automáticamente al recibir respuestas del bot
- `modo: "voz"` → ajusta hints internos (mensajes de orientación al usuario)
- Botón de micrófono (68×68px): llama a `iniciarVoz()` que usa la **Web Speech API** (`SpeechRecognition`)
- Idioma configurado: `rec.lang = "es-AR"`
- Botón "🔊 Voz activada" / "🔇 Voz silenciada": alterna `voz.setTtsOn(!voz.ttsOn)`
- Cuando el panel está inactivo (`activePanel !== "voz"`), muestra un mensaje placeholder en lugar del historial

---

## CSS y layout de los paneles

### Contenedor principal (`TabConsulta.tsx`)

```tsx
<div style={{
  display: "flex",
  flexDirection: "row",
  gap: 16,
  height: "calc(100vh - 120px)",
  width: "70vw",
  margin: "0 auto",
}}>
```

- `display: "flex"` + `flexDirection: "row"`: los dos paneles se ubican en fila.
- `gap: 16`: separación fija de 16px entre paneles.
- `height: calc(100vh - 120px)`: ocupa el alto de la ventana menos header y padding.
- `width: "70vw"`: el asistente ocupa el 70% del ancho de la ventana, centrado.

### Anchos de los paneles (flex ratio)

Los paneles usan `flex` directamente en lugar de `calc()`:

```tsx
// Panel activo
flex: activePanel === "texto" ? 7 : 3   // Panel Texto
flex: activePanel === "voz"  ? 7 : 3   // Panel Voz
```

- Panel activo → `flex: 7` (≈70% del espacio disponible)
- Panel inactivo → `flex: 3` (≈30% del espacio disponible)
- `transition: "all 0.5s ease-in-out"` en ambos paneles
- `minWidth: 0` en ambos para evitar overflow del flex container

### Propiedades de cada panel

```tsx
style={{
  flex: activePanel === "texto" ? 7 : 3,
  transition: "all 0.5s ease-in-out",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  borderRadius: 14,
  border: "2px solid #3b82f6",         // azul para texto, violeta para voz
  background: activePanel === "texto" ? "white" : "#dbeafe",
  overflow: "hidden",
  boxShadow: "...",
  cursor: activePanel !== "texto" ? "pointer" : "default",
}}
```

- `overflow: "hidden"`: el scroll interno del chat no desborda el borde redondeado.
- Al hacer click en el panel inactivo, `activePanel` cambia y el flex ratio se anima suavemente.

### Zona de scroll del chat

```tsx
<div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
  {/* mensajes */}
  <div ref={chatEndRef} />
</div>
```

- `flex: 1`: ocupa todo el espacio vertical disponible dentro del panel.
- `overflowY: "auto"`: activa scroll vertical solo cuando los mensajes superan el alto.
- El `chatEndRef` recibe `scrollIntoView({ behavior: "smooth" })` cada vez que llega un mensaje nuevo.

### Estilos globales (`globals.css`)

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background-color: #f8fafc; color: #0f172a; }
:root { color-scheme: light; }
```

`box-sizing: border-box` es crítico para que los anchos calculados incluyan padding y border sin overflow.

---

## Tipos de datos

### `Consulta` (respuesta del backend)

```ts
interface Consulta {
  pregunta: string;
  respuesta: string;
  tipo: string;               // "apto" | "no_apto_temporal" | "no_apto_permanente" | "consultar" | "fuera_de_dominio" | "info" | "cancelado_usuario"
  opciones: string[];
  intencion: string;
  entidades: { tipo: string; valor: string | number; unidad?: string }[];
  tokens: string[];
  pos: { token: string; pos: string }[];
  perplejidad: number;        // score de perplejidad N-gramas (umbral: PP_UMBRAL = 60)
  fuera_de_dominio: boolean;
  alerta_pp: string | null;
  score_ir: number;
  snippets: { doc: string; score: number; snippet: string }[];
  tiempo_ms: number;
}
```

### `MensajeChat`

```ts
interface MensajeChat {
  id: number;
  rol: "usuario" | "bot";
  texto: string;
  consulta?: Consulta;    // presente solo en respuestas NLP del bot
  esResultado?: boolean;  // true solo en el mensaje final del cuestionario
}
```

### `FaseChat`

Tipo union con todos los estados posibles del cuestionario:

```ts
type FaseChat =
  | "confirmar_inicio" | "pedir_edad" | "pedir_sexo" | "pedir_peso"
  | "q_sintomas_hoy" | "q_fiebre_72h" | "q_sintomas_describe" | "q_sintomas_continuar"
  | "q_medicacion" | "q_medicacion_detalle" | "q_medicacion_condicion" | "q_corazon"
  | "q_riñones" | "q_pulmones" | "q_neuro" | "q_cancer"
  | "q_diabetes" | "q_diabetes_tipo" | "q_presion" | "q_hepatitis" | "q_ets_vih"
  | "q_chagas" | "q_procedimientos" | "q_tatuaje" | "q_transfusion"
  | "q_riesgo_sexual" | "q_drogas" | "q_alcohol" | "q_vacunas" | "q_embarazada" | "q_parto_reciente"
  | "resultado"
```

---

## API y endpoints

URL base: `http://127.0.0.1:8000` (definida en `app/lib/api.ts`)

### `POST /consulta`

Procesa una consulta de texto en lenguaje natural.

**Request:**
```json
{ "texto": "tuve hepatitis hace dos años", "origen": "texto" }
```
`origen` puede ser `"texto"`, `"voz"` o `"whisper"`.

**Response:** objeto `Consulta` completo.

---

### `GET /tts`

Convierte texto a audio MP3 (Google TTS).

**Query param:** `?texto=texto+a+sintetizar`

**Response:** stream de audio. Se reproduce con:
```ts
const audio = new Audio(`${API}/tts?texto=${encodeURIComponent(texto)}`);
audio.play();
```

Si ya hay un audio reproduciéndose, se detiene antes de iniciar el nuevo.

---

### `POST /whisper`

Transcribe audio con Whisper (offline).

**Request:** `FormData` con campo `audio` (blob `audio/webm`).

**Response:** `{ "texto": "transcripción del audio" }`
