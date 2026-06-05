# Arquitectura del Frontend — DONAR

## Stack

| Tecnología | Versión |
|---|---|
| Next.js (App Router) | 16.2.4 |
| React | 19.2.4 |
| TypeScript | 5 |
| Tailwind CSS | 4 |

## Estructura de archivos

```
frontend/app/
├── page.tsx                          ← navegación entre tabs, header, footer (~128 líneas)
├── layout.tsx                        ← layout raíz (fuente, metadata, globals.css)
├── globals.css                       ← reset global, modo claro forzado, colores base
│
├── types/
│   └── index.ts                      ← interfaces TypeScript: Consulta, MensajeChat, FaseChat
│
├── lib/
│   ├── api.ts                        ← API url, PP_UMBRAL, fetchJSON, playTTS
│   └── tokens.ts                     ← design tokens: btn, inp, tbl
│
├── hooks/
│   ├── useChatFlow.ts                ← hook completo del flujo conversacional guiado
│   └── useIsMobile.ts               ← detección responsive (breakpoint 768px)
│
└── components/
    ├── ui/
    │   ├── Card.tsx                  ← Card, SectionTitle, StatCard
    │   ├── PieChart.tsx              ← gráfico SVG de torta
    │   └── InfoTag.tsx               ← etiqueta informativa con tooltip
    ├── chat/
    │   ├── BotBurbuja.tsx            ← burbuja bot con panel de análisis técnico
    │   └── UsuarioBurbuja.tsx        ← burbuja del usuario
    └── tabs/
        ├── TabConsulta.tsx           ← panel dual (texto + voz) — layout principal
        ├── TabDashboard.tsx          ← estadísticas y gráficos de donaciones
        ├── TabNgramas.tsx            ← análisis n-gramas / perplejidad
        ├── TabIR.tsx                 ← búsqueda TF-IDF / IR
        └── TabWER.tsx                ← Word Error Rate / evaluación ASR
```

## Responsabilidades por capa

### `page.tsx`
Renderiza el layout principal (header sticky, navegación por tabs, footer) y decide qué Tab mostrar. Sin lógica de negocio. Pasa `isMobile` a cada tab.

### `components/tabs/Tab*.tsx`
Cada tab es un componente independiente con su propio estado local. No se comunican entre sí. Todos reciben `{ isMobile: boolean }` como prop.

### `components/chat/`
- **`BotBurbuja.tsx`** — renderiza mensajes del bot. Sin `consulta`: burbuja gris simple. Con `consulta`: burbuja con color por tipo + panel colapsable de análisis técnico (entidades, POS, TF-IDF, perplejidad).
- **`UsuarioBurbuja.tsx`** — presentación pura del mensaje del usuario.

### `components/ui/`
Componentes genéricos reutilizables entre tabs: `Card`, `SectionTitle`, `StatCard`, `PieChart`, `InfoTag`.

### `hooks/useChatFlow.ts`
Hook con toda la lógica del cuestionario médico guiado: estado de fases, interpretación de lenguaje natural, integración con backend (`POST /consulta`, `POST /whisper`), síntesis de voz (TTS), grabación con `MediaRecorder`.

### `hooks/useIsMobile.ts`
Hook que devuelve `true` si el viewport es menor a 768px (actualiza en cada resize).

### `lib/api.ts`
- `API = "http://127.0.0.1:8000"` — URL base del backend.
- `PP_UMBRAL = 60` — umbral de perplejidad para detección de fuera-de-dominio.
- `fetchJSON(url)` — fetch con respuesta JSON.
- `playTTS(texto)` — reproduce audio desde `GET /tts?texto=...`. Para y descarta el audio anterior si lo hay.

### `lib/tokens.ts`
Design tokens CSS-in-JS (`btn`, `inp`, `tbl`) usados por los tabs de Dashboard, N-gramas, IR y WER.

### `types/index.ts`
Interfaces TypeScript compartidas: `Consulta` (respuesta del backend NLP), `MensajeChat`, `FaseChat` (tipo union de todos los estados del cuestionario).

## Endpoints consumidos

| Endpoint | Método | Tab | Descripción |
|---|---|---|---|
| `/consulta` | POST | Consulta | Procesa texto en lenguaje natural, devuelve `Consulta` |
| `/tts` | GET | Consulta | Síntesis de voz (gTTS) — query param `?texto=` |
| `/whisper` | POST | Consulta | Transcripción de audio con Whisper — FormData campo `audio` |
| `/dashboard` | GET | Dashboard | Estadísticas de donaciones |
| `/ngramas` | POST | N-gramas | Análisis n-gramas y perplejidad |
| `/tfidf` | POST | IR | Búsqueda TF-IDF / similitud coseno |
| `/wer` | POST | WER | Cálculo de Word Error Rate |

## Notas

- La app fuerza modo claro (`globals.css` — `color-scheme: light`).
- No hay corpus embebido en el cliente. Todo el NLP vive en el backend FastAPI.
- `useChatFlow` es el único hook con estado complejo. El resto de los tabs usan `useState` local simple.
- Los paneles de `TabConsulta` usan `flex: 7` (activo) / `flex: 3` (inactivo) en un contenedor `width: 70vw`.
