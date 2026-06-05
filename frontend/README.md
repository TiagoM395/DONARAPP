# DONAR-APP — Frontend

Sistema web de pre-evaluación de donantes de sangre para el Instituto de Hemoterapia PBA.

## Stack

| Tecnología | Versión |
|---|---|
| Next.js (App Router) | 16.2.4 |
| React | 19.2.4 |
| TypeScript | 5 |
| Tailwind CSS | 4 |

## Arrancar el proyecto

```bash
npm run dev      # servidor de desarrollo (webpack)
npm run build    # build de producción
npm run start    # iniciar build producción
npm run lint     # linter
```

La app corre en [http://localhost:3000](http://localhost:3000).

El backend FastAPI debe estar corriendo en `http://127.0.0.1:8000`.

## Tabs disponibles

| Tab | Ruta de componente | Descripción |
|---|---|---|
| 🩸 Consulta | `app/components/tabs/TabConsulta.tsx` | Asistente de texto + voz |
| 📊 Dashboard | `app/components/tabs/TabDashboard.tsx` | Estadísticas de donaciones |
| 📈 N-gramas | `app/components/tabs/TabNgramas.tsx` | Análisis de perplejidad |
| 🔍 IR / TF-IDF | `app/components/tabs/TabIR.tsx` | Búsqueda por relevancia |
| 📏 WER / ASR | `app/components/tabs/TabWER.tsx` | Evaluación de transcripción |

## Documentación interna

| Archivo | Contenido |
|---|---|
| `readme-arquitectura.md` | Estructura de archivos y endpoints |
| `README_ASISTENTES.md` | Flujo del cuestionario, CSS, tipos TypeScript, API |
| `README_ASISTENTES_DETALLADO.md` | Manual didáctico completo (UI, hooks, CSS, voz, Whisper) |
