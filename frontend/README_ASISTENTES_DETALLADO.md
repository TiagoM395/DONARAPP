# README — Asistentes (Texto, Voz y Whisper) y cómo se usan (DONAR-APP)

Este documento explica **cómo funcionan los asistentes** de la aplicación web y **qué archivos** participan en cada parte del flujo. Es un manual didáctico para entender el "quién hace qué" y "dónde está lo importante".

> Para una referencia técnica concisa, ver `README_ASISTENTES.md`.

---

## 1) ¿Qué asistentes existen?

En el frontend, el sistema de asistentes se compone de:

1. **Asistente de Texto**
   - El usuario escribe respuestas con teclado.
   - El asistente guía el cuestionario médico por etapas ("fases").
   - Puede recibir respuestas del backend con análisis NLP.

2. **Asistente de Voz (SpeechRecognition / Web Speech API)**
   - El usuario habla.
   - El navegador transcribe con `SpeechRecognition` o `webkitSpeechRecognition`.
   - El texto entra al mismo flujo que el asistente de texto.
   - Opcionalmente el asistente reproduce voz usando TTS.

3. **Whisper (grabación + transcripción con backend)**
   - El hook `useChatFlow` implementa grabación con `MediaRecorder` y envío a `POST /whisper`.
   - La transcripción resultante se inyecta al flujo conversacional como si fuera texto.

---

## 2) Qué archivos participan (mapa mental)

### Frontend

- `frontend/app/components/tabs/TabConsulta.tsx`
  - Componente visual principal del asistente.
  - Renderiza el panel de texto y el panel de voz lado a lado.
  - Contiene el componente `InputArea` que adapta los controles según la `fase`.
  - Conecta con `useChatFlow`.

- `frontend/app/hooks/useChatFlow.ts`
  - El cerebro del asistente.
  - Estado: `fase`, `mensajes`, `restricciones`, `perfil`, `loading`, `ttsOn`, `escuchando`, `grabando`.
  - Lógica del flujo guiado (qué pregunta sigue, cómo interpretar respuestas).
  - Integración con backend: `POST /consulta`, `POST /whisper`.
  - Síntesis de voz: llama a `playTTS` cuando `ttsOn === true`.

- `frontend/app/lib/api.ts`
  - `API = "http://127.0.0.1:8000"`
  - `PP_UMBRAL = 60` (umbral de perplejidad)
  - `playTTS(texto)`: reproduce audio desde `GET /tts?texto=...`

- `frontend/app/types/index.ts`
  - Interfaces TypeScript: `Consulta`, `MensajeChat`, `FaseChat`.

- `frontend/app/globals.css`
  - Estilos globales (reset + modo claro forzado).

- Burbujas de chat:
  - `frontend/app/components/chat/BotBurbuja.tsx`
  - `frontend/app/components/chat/UsuarioBurbuja.tsx`

> Si tu objetivo es entender **la lógica del cuestionario**: revisá `useChatFlow.ts`.
> Si tu objetivo es entender **la UI del chat** (cómo se ve cada burbuja): revisá `BotBurbuja.tsx`.
> Si tu objetivo es entender **layout de paneles y controles**: revisá `TabConsulta.tsx`.

---

## 3) Cómo funciona el flujo interno (fases)

El hook `useChatFlow` organiza el cuestionario con la variable `fase: FaseChat`.

El orden completo de fases es:

```
confirmar_inicio → pedir_peso → pedir_edad → pedir_sexo
  → q_sintomas_hoy → q_sintomas_continuar
  → q_fiebre_72h
  → q_medicacion → q_medicacion_detalle → q_medicacion_condicion
  → q_corazon → q_diabetes → q_diabetes_tipo → q_presion
  → q_riñones → q_pulmones → q_neuro → q_cancer
  → q_hepatitis → q_ets_vih → q_chagas
  → q_procedimientos → q_tatuaje → q_transfusion → q_riesgo_sexual
  → q_drogas → q_alcohol → q_vacunas
  → q_embarazada → q_parto_reciente   (solo si sexo === "Mujer")
  → resultado
```

Las preguntas están definidas en `FASES_PREGUNTAS` (array ordenado) y `TEXTOS_PREGUNTAS` (texto de cada pregunta).

La función `siguientePregunta(fase, sexo)` omite `q_embarazada` y `q_parto_reciente` si el sexo no es "Mujer".

### Idea clave: restricciones

Cuando el asistente detecta un impedimento, llama a `addRestriccion(r)`:
- `❌ texto` → restricción permanente
- `⏳ texto` → restricción temporal

El resultado final:
- Sin restricciones → `apto`
- Alguna `❌` → `no_apto_permanente`
- Solo `⏳` → `no_apto_temporal`

---

## 4) ¿Cómo se "conecta" la UI con la lógica?

### 4.1 TabConsulta crea 2 instancias del hook

```tsx
const texto = useChatFlow({ autoTts: false, bienvenida: "..." });
const voz   = useChatFlow({ autoTts: true,  bienvenida: "...", modo: "voz" });
```

Cada panel tiene su propio estado independiente. No hay comunicación entre ambos.

### 4.2 Qué pasa cuando el usuario envía una respuesta

En `TabConsulta.tsx`, `InputArea` llama a `chat.manejarEnvio(input)`.

Ese método en `useChatFlow.ts` hace:
- valida que la entrada no sea vacía
- según `fase`, llama a la función específica:
  - `procesarConfirmacion` — `confirmar_inicio`
  - `procesarPeso` — `pedir_peso`
  - `procesarEdad` — `pedir_edad`
  - `procesarSexoPorVoz` — `pedir_sexo` (cuando viene de voz)
  - `procesarSexo` — `pedir_sexo` (cuando viene de botón)
  - `procesarRespuestaPregunta` — todas las fases `q_*`
  - `consultarAPI` — fallback de lenguaje libre

### 4.3 `procesarSexo` es llamada directamente desde `InputArea`

Para el panel de texto, `InputArea` llama `chat.procesarSexo(sexo)` directamente al tocar uno de los tres botones (no pasa por `manejarEnvio`).

---

## 5) ¿Cómo decide "sí/no"? (interpretación de lenguaje)

En `useChatFlow.ts` hay una estrategia en capas:

1. **Negaciones directas** — `no`, `nunca`, `negativo`, `tampoco`, etc.
2. **Negaciones con verbo** — `no tengo`, `no tuve`, `no soy`, etc.
3. **Afirmaciones directas** — `sí`, `dale`, `ok`, `claro`, etc.
4. **Keywords específicas por fase** — `KEYWORDS_SI` contiene regex por fase médica:
   - `q_fiebre_72h`: fiebre, diarrea, vómito, gripe, resfriado, etc.
   - `q_corazon`: infarto, angina, arritmia, marcapasos, bypass, etc.
   - `q_hepatitis`: hepatitis, ictericia
   - `q_ets_vih`: VIH, sífilis, gonorrea, herpes genital, etc.
   - `q_procedimientos`: cirugía, endoscopía, cateterismo, implante, etc.
   - y más fases...
5. **Fallback a backend** — si ningún patrón matchea, consulta `POST /consulta`

---

## 6) Cómo se integran las respuestas NLP del backend

Cuando `useChatFlow` llama a `POST /consulta`, recibe un objeto `Consulta` y decide:
- `no_apto_permanente` → agrega restricción `❌`
- `no_apto_temporal` → agrega restricción `⏳`
- `apto` → continua al siguiente paso
- `consultar` / `fuera_de_dominio` → muestra la respuesta del bot y pide que el usuario aclare

El mensaje del bot se agrega con `{ consulta: data }`, lo que hace que `BotBurbuja` lo renderice en modo "análisis técnico" (con color, panel colapsable, etc.).

---

## 7) ¿Cómo se usa el asistente de TEXTO?

### En la UI (TabConsulta)

El panel "💬 Asistente de texto" muestra el historial de mensajes y debajo un `InputArea` que cambia según `fase`:

- `confirmar_inicio`, `q_sintomas_continuar` → botones **Sí** / **No**
- `pedir_sexo` → botones **Masculino** / **Femenino** / **Otro**
- `resultado` → botón "Nueva evaluación" (llama `texto.reiniciar()`)
- Resto de fases → input de texto + botón ➤ (también funciona con Enter)

### En la lógica (useChatFlow)

- `confirmar_inicio` → valida "sí/no", si es no termina el flujo con mensaje de despedida
- `pedir_peso` → extrae número, valida rango (10-300 kg), corta si < 50 kg
- `pedir_edad` → parsea edad (1-120), corta si < 16; con 16-17 años agrega nota de frecuencia; con > 65 agrega nota de certificado
- `q_*` → aplica reglas de lenguaje y/o llama al backend

---

## 8) ¿Cómo se usa el asistente de VOZ?

### En la UI (TabConsulta)

El panel "🎙️ Asistente de voz" muestra:
- Historial de mensajes (visible solo cuando el panel está activo)
- Botón de micrófono (círculo 68×68px):
  - Rojo + halo `#fecaca` cuando `voz.escuchando === true`
  - Oscuro (`#0f172a`) cuando no escucha
- Texto de estado: "Tocá para hablar" / "Escuchando... tocá para detener"
- Botón "🔊 Voz activada" / "🔇 Voz silenciada"

Cuando el panel de voz está inactivo, muestra un texto descriptivo en lugar del historial y deshabilita el botón de micrófono.

### En la lógica (useChatFlow)

`voz.iniciarVoz()`:
1. Verifica que `fase !== "resultado"`
2. Obtiene `SpeechRecognition` / `webkitSpeechRecognition`
3. Setea `lang = "es-AR"`, `interimResults = false`, `maxAlternatives = 1`
4. Setea `escuchando = true`
5. Al recibir el transcript final → llama `manejarEnvioFn.current(transcript, "voz")`
6. En `onend` → setea `escuchando = false`

---

## 9) ¿Cómo funciona el TTS (voz del asistente)?

El hook tiene `ttsOn` y `ttsOnRef.current`. Cuando el bot responde, la función `bot()` llama a `playTTS(texto)` si `ttsOnRef.current === true`.

### `playTTS` (en `frontend/app/lib/api.ts`)

```ts
let _ttsAudio: HTMLAudioElement | null = null;

export function playTTS(texto: string) {
  if (_ttsAudio) {
    _ttsAudio.pause();
    _ttsAudio.src = "";
    _ttsAudio = null;
  }
  const audio = new Audio(`${API}/tts?texto=${encodeURIComponent(texto)}`);
  _ttsAudio = audio;
  audio.play().catch(() => {});
}
```

- Siempre viene del backend (`GET /tts`)
- Detiene el audio anterior si lo hay
- Usa `.catch(() => {})` para ignorar rechazos silenciosos (ej. el usuario no interactuó aún)

---

## 10) ¿Cómo funciona Whisper (grabación + backend)?

En el hook existe `iniciarWhisper()`:

1. Si `grabando` ya está activo → detiene el `MediaRecorder`
2. Pide permiso: `navigator.mediaDevices.getUserMedia({ audio: true })`
3. Crea `MediaRecorder(stream)` y comienza a grabar
4. Al detener:
   - Junta chunks a un `Blob` tipo `audio/webm`
   - Arma `FormData` con campo `audio`
   - Hace `POST ${API}/whisper`
5. Si la respuesta tiene `d.texto`, llama `manejarEnvioFn.current(d.texto, "whisper")`

En otras palabras: Whisper produce texto y ese texto entra al mismo motor conversacional.

---

## 11) CSS: dónde y cómo se ve todo

El proyecto combina estilos globales en `globals.css` y estilos inline en `TabConsulta.tsx`.

### 11.1 `globals.css`

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
:root { color-scheme: light; }
html, body { background-color: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
input { color: #0f172a; background: white; }
```

**Efecto de `box-sizing: border-box`**: los cálculos de ancho en `TabConsulta` (flex, padding, border) no se suman extra. Los bordes de 2px están contenidos dentro del ancho declarado.

### 11.2 Layout de paneles (`TabConsulta`)

Contenedor principal:

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

- `70vw` centrado: el asistente ocupa el 70% del ancho de la ventana
- `calc(100vh - 120px)`: resta header (~52px) y padding (~68px) para no desbordar la pantalla

### 11.3 Ancho dinámico por estado activo (flex ratio)

```tsx
// Panel Texto
flex: activePanel === "texto" ? 7 : 3

// Panel Voz
flex: activePanel === "voz" ? 7 : 3
```

- Panel activo: `flex: 7` (~70% del espacio)
- Panel inactivo: `flex: 3` (~30% del espacio)
- Ambos paneles: `transition: "all 0.5s ease-in-out"` para animación suave
- Ambos paneles: `minWidth: 0` para evitar overflow del flex container

### 11.4 Bordes, fondos y sombras

Panel Texto (azul):
- Activo: `background: "white"`, borde `#3b82f6`, sombra `rgba(59,130,246,0.15)`
- Inactivo: `background: "#dbeafe"`, sombra `rgba(59,130,246,0.12)`

Panel Voz (violeta):
- Activo: `background: "white"`, borde `#7c3aed`, sombra `rgba(124,58,237,0.15)`
- Inactivo: `background: "#ede9fe"`, sombra `rgba(124,58,237,0.15)`

### 11.5 `overflow: hidden` para bordes redondeados

```tsx
overflow: "hidden",
borderRadius: 14,
```

Garantiza que el contenido interno (header, zona de chat, input) no "rompa" el radio del borde del panel.

### 11.6 Scroll solo en la zona del chat

```tsx
<div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
  {/* mensajes */}
  <div ref={chatEndRef} />
</div>
```

- `flex: 1` → esa zona toma todo el alto disponible del panel
- `overflowY: "auto"` → scroll vertical solo cuando hace falta
- El área de input (`InputArea`) está **fuera** de este div, así siempre está visible

### 11.7 Auto-scroll al final del chat

En `useChatFlow.ts`:

```ts
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [mensajes]);
```

Cada vez que llegan mensajes nuevos, el chat hace scroll suave al final.

### 11.8 Headers fijos con `flexShrink: 0`

El header de cada panel tiene `flexShrink: 0` para que no se encoja cuando el chat crece. Esto garantiza que el botón 🔄 siempre sea visible.

### 11.9 Controles de voz: zona fija inferior

El panel de voz tiene una zona inferior fija (fuera del scroll del chat):

```tsx
<div style={{ padding: "16px", borderTop: "2px solid #e2e8f0",
              display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
              flexShrink: 0 }}>
  {/* botón micrófono + toggle TTS */}
</div>
```

`flexShrink: 0` impide que esta zona se comprima aunque el chat esté lleno.

### 11.10 Loading: indicador visual

Cuando `chat.loading === true`, aparece un div:

```tsx
<div style={{ background: "#f1f5f9", borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#64748b" }}>Procesando...</div>
```

Evita que la UI quede en blanco mientras espera respuesta del backend.

---

## 12) Resumen de "qué reviso para qué"

| Objetivo | Archivo |
|---|---|
| Por qué el asistente pregunta X y termina en resultado | `frontend/app/hooks/useChatFlow.ts` |
| Qué botones y controles aparecen en pantalla | `frontend/app/components/tabs/TabConsulta.tsx` |
| Cómo suena la voz del asistente (TTS) | `frontend/app/lib/api.ts` + `ttsOn` en `useChatFlow.ts` |
| Cómo se graba y manda audio a Whisper | `iniciarWhisper()` en `useChatFlow.ts` |
| Por qué el sitio se ve claro y con esos colores | `frontend/app/globals.css` + `frontend/app/layout.tsx` |
| Tipos TypeScript de mensajes y fases | `frontend/app/types/index.ts` |
| Estructura general de carpetas y endpoints | `frontend/readme-arquitectura.md` |

---

## 13) Compatibilidad recomendada

- Para voz con SpeechRecognition: Chrome o Edge (Firefox no soporta SpeechRecognition).
  El hook advierte con "Usá Chrome o Edge..." si no detecta `SpeechRecognition`.
- Para TTS: depende del backend `GET /tts` disponible en `http://127.0.0.1:8000`.
- Para Whisper: requiere `navigator.mediaDevices.getUserMedia` (contexto HTTPS o localhost).

---

## 14) CSS muy detallado: por qué no hay caos visual

La UI se mantiene estable porque aplica 4 principios:

1. **Reset/box-sizing** (`globals.css`): los layouts con `flex` no rompen por márgenes inesperados.
2. **Paneles con `overflow: hidden`**: los bordes redondeados se respetan aunque el contenido sea grande.
3. **Scroll solo en la zona del chat** (`overflowY: "auto"` dentro del div de mensajes): el input y los controles siempre visibles.
4. **Header y controles con `flexShrink: 0`**: nunca se comprimen aunque el chat esté lleno.

Eso hace que el asistente se sienta como una "app" y no como una página web suelta.
