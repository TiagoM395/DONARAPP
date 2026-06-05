# Refactor frontend — DONAR-APP

## Estado: COMPLETADO ✅

El refactor de `app/page.tsx` (que originalmente tenía ~2242 líneas monolíticas) fue completado exitosamente.

---

## Resultado final

### `app/page.tsx` — 128 líneas

El archivo quedó únicamente con la navegación: header sticky, tabs, menú "Herramientas" (dropdown hover), renderizado condicional de tabs y footer.

```tsx
"use client";
import { useState } from "react";
import { useIsMobile }   from "./hooks/useIsMobile";
import { TabConsulta }   from "./components/tabs/TabConsulta";
import { TabDashboard }  from "./components/tabs/TabDashboard";
import { TabNgramas }    from "./components/tabs/TabNgramas";
import { TabIR }         from "./components/tabs/TabIR";
import { TabWER }        from "./components/tabs/TabWER";
```

### Todos los módulos creados y en uso

```
frontend/app/
├── types/
│   └── index.ts              ✅  Consulta, MensajeChat, FaseChat
├── lib/
│   ├── api.ts                ✅  API, PP_UMBRAL, fetchJSON, playTTS
│   └── tokens.ts             ✅  btn, inp, tbl (design tokens)
├── hooks/
│   ├── useIsMobile.ts        ✅  hook responsive (768px breakpoint)
│   └── useChatFlow.ts        ✅  hook completo del flujo guiado
├── components/
│   ├── ui/
│   │   ├── Card.tsx          ✅  Card, SectionTitle, StatCard
│   │   ├── InfoTag.tsx       ✅  etiqueta informativa
│   │   └── PieChart.tsx      ✅  gráfico SVG de torta
│   ├── chat/
│   │   ├── UsuarioBurbuja.tsx ✅
│   │   └── BotBurbuja.tsx    ✅  BotBurbuja + TIPOS_CHAT
│   └── tabs/
│       ├── TabConsulta.tsx   ✅  panel texto + panel voz
│       ├── TabDashboard.tsx  ✅  estadísticas + LineChart local
│       ├── TabNgramas.tsx    ✅  análisis n-gramas
│       ├── TabIR.tsx         ✅  TF-IDF / IR
│       └── TabWER.tsx        ✅  Word Error Rate
```

---

## Notas finales

- `page.tsx` usa `"use client"` al inicio.
- `StatCard` vive en `components/ui/Card.tsx`.
- `BotCargando` fue eliminado: el loading se renderiza inline en `TabConsulta` con un div simple.
- `LineChart` es un componente local dentro de `TabDashboard.tsx`.
- Los design tokens (`btn`, `inp`, `tbl`) se importan desde `lib/tokens.ts`.
- Todos los tabs reciben `{ isMobile: boolean }` como prop desde `page.tsx`.
