# spaCy en DonarApp — Guía Completa y Didáctica

> **Para qué sirve este documento:** Entender spaCy desde cero, poder explicarlo oralmente con soltura, y entender exactamente cómo y por qué lo usamos en DonarApp.

---

## ¿Qué es spaCy? — El discurso de introducción

spaCy es una **biblioteca de Procesamiento de Lenguaje Natural (NLP)** para Python, creada por la empresa Explosion AI en 2015. Está diseñada con una filosofía muy concreta: **ser rápida, práctica y lista para producción**.

Si tuvieras que explicarlo oralmente en 30 segundos, dirías algo así:

> *"spaCy es como una navaja suiza para trabajar con texto. Le das una oración o un párrafo, y él te dice qué palabras son sustantivos, cuáles son verbos, cómo se relacionan entre sí, y te permite filtrar o analizar el texto de forma muy eficiente. En DonarApp lo usamos para entender lo que el usuario escribe cuando pregunta si puede donar sangre."*

La gran diferencia con otras librerías similares (como NLTK) es que spaCy **no es una herramienta de investigación** — es una herramienta para construir cosas reales. Está optimizada para velocidad y facilidad de uso.

---

## Conceptos Fundamentales — Lo que necesitás saber sí o sí

Antes de ver código, hay que entender los bloques básicos. Todo en spaCy gira alrededor de estos conceptos:

### 1. El `nlp` object — El motor principal

```python
import spacy
self._nlp = spacy.load("es_core_news_sm")
```

Esto es exactamente lo que hace DonarApp al iniciar en [backend/nlp.py](backend/nlp.py) (línea 211). El objeto `nlp` es el **pipeline completo**: cuando lo cargás, traés un modelo pre-entrenado en español que sabe procesar texto. Es costoso crearlo, por eso se carga **una sola vez** al arrancar.

### 2. El `Doc` — El documento procesado

```python
doc = self._nlp("me hice un tatuaje hace 2 meses")
```

El `doc` es el resultado de pasarle texto al motor. Es el objeto central de spaCy. A partir de él accedés a **todo**: tokens, categorías gramaticales, dependencias, etc.

### 3. Los `Token` — Cada palabra (o signo de puntuación)

```python
doc = self._nlp("me hice un tatuaje hace 2 meses")
for token in doc:
    print(token.text)
# me, hice, un, tatuaje, hace, 2, meses
```

Un token es cada unidad del texto. Puede ser una palabra, un número, o un signo de puntuación.

### 4. Los `Span` — Fragmentos del documento

```python
fragmento = doc[3:5]  # "tatuaje hace"
print(fragmento.text)
```

Un Span es una porción del Doc — una subsecuencia de tokens. Las entidades y frases nominales son Spans.

---

## El Pipeline de spaCy — Cómo procesa el texto internamente

Cuando hacés `nlp("texto")`, spaCy ejecuta una cadena de componentes en orden. A esto se le llama **pipeline**:

```
texto crudo del usuario
    │
    ▼
┌─────────────┐
│  Tokenizer  │  → Divide en tokens: ["me","hice","un","tatuaje","hace","2","meses"]
└─────────────┘
    │
    ▼
┌─────────────┐
│   tagger    │  → Asigna POS: PRON, VERB, DET, NOUN, VERB, NUM, NOUN
└─────────────┘
    │
    ▼
┌──────────────────┐
│  morphologizer   │  → Análisis morfológico (género, número, tiempo verbal)
└──────────────────┘
    │
    ▼
┌─────────────┐
│   parser    │  → Árbol de dependencias: quién es sujeto, objeto, etc.
└─────────────┘
    │
    ▼
┌─────────────┐
│     ner     │  → Entidades nombradas (personas, lugares, org.)
└─────────────┘
    │
    ▼
┌─────────────┐
│  lemmatizer │  → Forma base: "hice"→"hacer", "meses"→"mes"
└─────────────┘
    │
    ▼
   Doc  ← DonarApp usa este resultado para tokenizar y etiquetar gramaticalmente
```

Cada componente **agrega información** al Doc. Al final, el Doc contiene todo el análisis acumulado.

Podés ver qué componentes tiene nuestro pipeline así:

```python
import spacy
nlp = spacy.load("es_core_news_sm")
print(nlp.pipe_names)
# ['tok2vec', 'morphologizer', 'parser', 'senter', 'ner', 'attribute_ruler', 'lemmatizer']
```

---

## Capacidades de spaCy — Qué puede hacer

### 1. Part-of-Speech Tagging (POS) — Categorías gramaticales

Identifica si cada palabra es sustantivo, verbo, adjetivo, etc. **DonarApp usa esto** en el método `pos_tag()` para entender la estructura de lo que escribe el usuario.

```python
import spacy
nlp = spacy.load("es_core_news_sm")

# Una consulta real que recibe DonarApp
doc = nlp("me hice un tatuaje hace dos meses puedo donar")

for token in doc:
    print(f"{token.text:12} | POS: {token.pos_:6} | TAG: {token.tag_}")
```

Salida esperada:
```
me           | POS: PRON   | TAG: PP1CSN00
hice         | POS: VERB   | TAG: VMIS1S0
un           | POS: DET    | TAG: DI0MS0
tatuaje      | POS: NOUN   | TAG: NCMS000
hace         | POS: VERB   | TAG: VMIP3S0
dos          | POS: NUM    | TAG: DN0CP0
meses        | POS: NOUN   | TAG: NCMP000
puedo        | POS: VERB   | TAG: VMIP1S0
donar        | POS: VERB   | TAG: VMN0000
```

**¿Para qué le sirve esto a DonarApp?** Para saber que `tatuaje` es un sustantivo (NOUN), `hice` es un verbo (VERB), `dos` es un número (NUM). Esto ayuda a clasificar correctamente las palabras antes de buscar condiciones médicas.

---

### 2. Tokenización — Dividir el texto en palabras

La tokenización es la capacidad más básica y una de las más usadas en DonarApp. spaCy no solo divide por espacios — entiende puntuación, contracciones, y caracteres especiales del español.

```python
import spacy
nlp = spacy.load("es_core_news_sm")

# Con puntuación y caracteres especiales
doc = nlp("¿puedo donar si tomé antibióticos?")
tokens_alpha = [t.text for t in doc if t.is_alpha]
print(tokens_alpha)
# ['puedo', 'donar', 'si', 'tomé', 'antibióticos']
```

El atributo `t.is_alpha` filtra signos de puntuación (`¿`, `?`) y deja solo palabras. Esto es exactamente lo que hace el método `tokenizar()` de [backend/nlp.py:251-254](backend/nlp.py).

---

### 3. Lematización — Forma base de las palabras

Convierte cada palabra a su forma base o raíz.

```python
doc = nlp("tomé antibióticos hace tres meses puedo donar sangre")

for token in doc:
    if token.lemma_ != token.text:  # Solo mostrar cuando cambia
        print(f"{token.text:15} → lemma: {token.lemma_}")
```

Salida:
```
tomé            → lemma: tomar
antibióticos    → lemma: antibiótico
meses           → lemma: mes
```

**¿Por qué importa en DonarApp?** Porque el usuario puede escribir "tomé", "tomo", "estoy tomando" o "tomaba" — todas refieren a lo mismo. La lematización permite normalizar antes de buscar.

---

### 4. Dependency Parsing — Árbol de dependencias sintácticas

Analiza cómo se relacionan las palabras: quién es el sujeto, cuál es el verbo principal, etc.

```python
doc = nlp("puedo donar sangre con tatuaje")

for token in doc:
    print(f"{token.text:10} → dep: {token.dep_:10} | cabeza: {token.head.text}")
```

Salida:
```
puedo      → dep: ROOT       | cabeza: puedo
donar      → dep: xcomp      | cabeza: puedo
sangre     → dep: obj        | cabeza: donar
con        → dep: case       | cabeza: tatuaje
tatuaje    → dep: obl        | cabeza: donar
```

Esto nos dice que `puedo` es el verbo raíz, `donar` depende de él, y `tatuaje` es el complemento con "con".

---

### 5. Named Entity Recognition (NER) — Reconocimiento de Entidades

Detecta automáticamente nombres de personas, organizaciones, lugares, fechas, etc.

```python
doc = nlp("me vacuné contra la hepatitis b en el hospital italiano de buenos aires en marzo")

for ent in doc.ents:
    print(f"{ent.text:35} → {ent.label_}")
```

Salida posible:
```
hospital italiano de buenos aires  → ORG
marzo                              → DATE
```

**Importante para entender DonarApp:** el NER genérico de spaCy **no reconoce términos médicos** como "tatuaje", "anticoagulante", "isotretinoína" o "hepatitis b" como entidades relevantes para donación de sangre — el modelo fue entrenado con noticias, no con textos médicos. Por eso DonarApp **no usa el NER de spaCy** para detectar condiciones médicas. En cambio, construye su propio sistema de extracción de entidades con diccionarios y expresiones regulares. Esta es una decisión de diseño clave que se explica en detalle más adelante.

---

## Modelos de Lenguaje — Cuál usamos y por qué

spaCy trabaja con **modelos pre-entrenados**. Para cada idioma hay varios tamaños:

| Modelo                  | Tamaño  | Velocidad | Precisión | Vectores |
|-------------------------|---------|-----------|-----------|----------|
| `es_core_news_sm`       | ~13 MB  | ★★★★★    | ★★★       | No       |
| `es_core_news_md`       | ~43 MB  | ★★★★     | ★★★★      | Sí       |
| `es_core_news_lg`       | ~564 MB | ★★★       | ★★★★★     | Sí       |
| `es_dep_news_trf`       | ~450 MB | ★★        | ★★★★★     | No (transformers) |

**DonarApp usa `es_core_news_sm`** — el modelo pequeño en español. ¿Por qué?
- La app no necesita vectores de similitud semántica (no compara documentos entre sí)
- Necesita velocidad: cada mensaje del usuario se procesa en tiempo real
- El 90% del trabajo lo hacen los diccionarios y regex propios, no el modelo de spaCy

### Instalación

```bash
pip install spacy
python -m spacy download es_core_news_sm
```

---

## Cómo spaCy se usa en DonarApp — La arquitectura real

Este es el núcleo de lo que tenés que poder explicar. DonarApp tiene una arquitectura **híbrida**: usa spaCy para las tareas lingüísticas básicas y usa su propio sistema para el conocimiento médico específico.

```
Mensaje del usuario
        │
        ▼
┌─────────────────────────────────────────────────┐
│  normalizar_coloquialismos()  [regex, no spaCy] │
│  "dale obvio puedo donar" → "sí puedo donar"    │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  extraer_entidades()  [keywords + regex]        │
│  Detecta: tatuaje, 2 meses, anticoagulante...   │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  tokenizar() + pos_tag()  [spaCy aquí]          │
│  Tokeniza y etiqueta gramaticalmente            │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  interpretar()  [lógica propia]                 │
│  tipo="tatuaje", tiempo=2, peso=None, edad=None │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  evaluar() en rules.py  [reglas médicas]        │
│  → "Debés esperar 12 meses desde el tatuaje."   │
└─────────────────────────────────────────────────┘
```

---

## La clase NLPProcessor — El código real, método por método

Todo el NLP de DonarApp vive en [backend/nlp.py](backend/nlp.py). La clase `NLPProcessor` tiene estos métodos:

---

### `__init__` — Carga el modelo una sola vez

```python
def __init__(self):
    try:
        self._nlp = spacy.load("es_core_news_sm")
    except OSError:
        self._nlp = None
```

**¿Qué hace?** Carga el modelo español de spaCy al instanciar la clase. Si spaCy no está instalado o el modelo no fue descargado, `self._nlp` queda en `None` y el sistema usa métodos de fallback con regex.

**¿Por qué el try/except?** Porque si se despliega en un servidor nuevo sin el modelo descargado, la app no debe caerse — simplemente degrada elegantemente a regex.

**¿Dónde se instancia?** En [backend/rules.py:4](backend/rules.py) y en [backend/main.py:70](backend/main.py):
```python
_nlp = NLPProcessor()   # rules.py - instancia global para las reglas
nlp  = NLPProcessor()   # main.py  - instancia para el endpoint
```

---

### `tokenizar(texto)` — Divide el mensaje en palabras limpias

```python
def tokenizar(self, texto: str) -> list[str]:
    if self._nlp is not None:
        doc = self._nlp(texto.lower())
        return [t.text for t in doc if t.is_alpha]
    return re.findall(r"[a-záéíóúüñ]+", texto.lower())
```

**¿Qué hace paso a paso?**

1. Convierte el texto a minúsculas: `"Me hice un Tatuaje"` → `"me hice un tatuaje"`
2. Pasa el texto por spaCy: crea un `Doc` con todos sus tokens
3. Filtra con `t.is_alpha`: se queda solo con tokens que son letras puras (descarta `¿`, `?`, `,`, números solos)
4. Devuelve una lista de strings

**Ejemplo con una consulta real:**

```python
processor = NLPProcessor()

tokens = processor.tokenizar("¿me hice un tatuaje hace 2 meses, puedo donar?")
print(tokens)
# ['me', 'hice', 'un', 'tatuaje', 'hace', 'meses', 'puedo', 'donar']
# nota: "2" no aparece porque no es alpha (is_alpha = False para dígitos)
```

```python
tokens = processor.tokenizar("tomé antibióticos, ¿tengo que esperar?")
print(tokens)
# ['tomé', 'antibióticos', 'tengo', 'que', 'esperar']
```

**Fallback sin spaCy:**
```python
# Si self._nlp es None, usa regex
re.findall(r"[a-záéíóúüñ]+", "tomé antibióticos, ¿tengo que esperar?")
# ['tomé', 'antibióticos', 'tengo', 'que', 'esperar']
```

El resultado es casi idéntico porque para tokenización básica la regex es suficiente. spaCy agrega valor en casos complejos como contracciones o palabras compuestas.

---

### `pos_tag(tokens)` — Etiqueta gramaticalmente cada token

Este es el método donde spaCy hace el trabajo más interesante. Implementa un sistema **híbrido** de etiquetado:

```python
_POS_MAP = {
    "VERB": "VERB", "AUX": "VERB",
    "NOUN": "NOUN", "PROPN": "NOUN",
    "ADJ":  "ADJ",
    "NUM":  "NUM",
    "ADP": "STOP", "DET": "STOP", "CCONJ": "STOP",
    "SCONJ": "STOP", "PRON": "STOP", "PART": "STOP",
}

def pos_tag(self, tokens: list[str]) -> list[dict]:
    if self._nlp is not None:
        doc = self._nlp(" ".join(tokens))
        resultado = []
        for token in doc:
            tl = token.text.lower()
            if tl in self.VERBOS:          # 1) Diccionario propio primero
                pos = "VERB"
            elif tl in self.SUSTANTIVOS:   # 2) Diccionario propio
                pos = "NOUN"
            elif tl in self.ADJETIVOS:     # 3) Diccionario propio
                pos = "ADJ"
            elif tl in self.STOPWORDS:     # 4) Diccionario propio
                pos = "STOP"
            elif token.is_digit:           # 5) Número detectado por spaCy
                pos = "NUM"
            else:
                pos = self._POS_MAP.get(token.pos_, "OTHER")  # 6) spaCy como fallback
            resultado.append({"token": token.text, "pos": pos})
        return resultado
```

**¿Por qué este orden? — La lógica del sistema híbrido**

spaCy fue entrenado con noticias del periódico, no con consultas médicas en español rioplatense. Palabras como `"tatuaje"`, `"anticoagulante"`, `"donar"`, o `"diferimiento"` pueden no ser etiquetadas correctamente por el modelo genérico. Por eso DonarApp primero consulta sus propios diccionarios, y solo delega a spaCy las palabras que no reconoce.

```python
VERBOS = {
    "hice", "hizo", "tuve", "tome", "tomé", "opero", "operó",
    "puedo", "quiero", "puede", "donar", "esperar",
}
SUSTANTIVOS = (
    set(TIPOS.keys())  # tatuaje, piercing, cirugia, medicamento, etc.
    | {"sangre", "donante", "centro", "mes", "meses", "año", "años",
       "semana", "semanas", "día", "dias", "diferimiento"}
)
ADJETIVOS = {"apto", "sano", "enfermo", "reciente", "permanente", "temporal"}
```

**Ejemplo con una consulta real:**

```python
processor = NLPProcessor()

tokens = ["tuve", "una", "cirugia", "hace", "tres", "meses"]
etiquetas = processor.pos_tag(tokens)
for e in etiquetas:
    print(f"{e['token']:12} → {e['pos']}")
```

Salida esperada:
```
tuve         → VERB    (encontrado en VERBOS propio)
una          → STOP    (encontrado en STOPWORDS propio)
cirugia      → NOUN    (encontrado en SUSTANTIVOS propio, es clave en TIPOS)
hace         → STOP    (encontrado en STOPWORDS propio)
tres         → OTHER   (spaCy lo etiqueta como NUM → _POS_MAP → "NUM")
meses        → NOUN    (encontrado en SUSTANTIVOS propio)
```

```python
tokens = ["me", "hice", "un", "tatuaje", "permanente"]
etiquetas = processor.pos_tag(tokens)
for e in etiquetas:
    print(f"{e['token']:12} → {e['pos']}")
```

Salida esperada:
```
me           → STOP    (STOPWORDS)
hice         → VERB    (VERBOS)
un           → STOP    (STOPWORDS)
tatuaje      → NOUN    (SUSTANTIVOS via TIPOS)
permanente   → ADJ     (ADJETIVOS)
```

---

### `extraer_entidades(texto)` — Detecta condiciones médicas, tiempos, pesos y edades

Este es el método más importante para el funcionamiento de DonarApp. **No usa el NER de spaCy** — usa un sistema propio de coincidencia de keywords y regex.

```python
def extraer_entidades(self, texto: str) -> list[dict]:
    texto_lower = texto.lower()
    entidades = []

    # 1. Condiciones médicas — keyword matching con TIPOS
    for tipo, palabras_clave in self.TIPOS.items():
        for kw in palabras_clave:
            if kw in texto_lower:
                entidades.append({"tipo": "TIPO", "valor": tipo})
                break

    # 2. Tiempo — regex para meses, años, semanas, días y expresiones relativas
    m = re.search(r"(\d+)\s*(mes|meses)", texto_lower)
    if m:
        entidades.append({"tipo": "TIEMPO", "unidad": "meses", "valor": int(m.group(1))})

    # ... y más regex para años, semanas, días, "ayer", "hace poco", etc.

    # 3. Peso — regex para kg
    m = re.search(r"(\d+)\s*kg", texto_lower)
    if m:
        entidades.append({"tipo": "PESO", "valor": int(m.group(1))})

    return entidades
```

**¿Por qué keyword matching y no el NER de spaCy?**

El NER de `es_core_news_sm` fue entrenado con artículos de noticias. Reconoce personas, lugares y organizaciones. No reconoce "isotretinoína" como condición médica relevante ni "warfarina" como anticoagulante. Para eso necesitaríamos entrenar un modelo propio con miles de ejemplos médicos etiquetados. El keyword matching con diccionarios es más rápido, más predecible, y cubre exactamente los casos que la app necesita manejar.

**Ejemplo completo con una consulta real:**

```python
processor = NLPProcessor()

# Caso 1: tatuaje con tiempo
entidades = processor.extraer_entidades("me hice un tatuaje hace 3 meses")
print(entidades)
# [
#   {"tipo": "TIPO",   "valor": "tatuaje"},
#   {"tipo": "TIEMPO", "unidad": "meses", "valor": 3}
# ]

# Caso 2: medicamento sin tiempo
entidades = processor.extraer_entidades("estoy tomando warfarina")
print(entidades)
# [
#   {"tipo": "TIPO", "valor": "anticoagulante"}
# ]
# → warfarina está en la lista de TIPOS["anticoagulante"]

# Caso 3: peso del usuario
entidades = processor.extraer_entidades("peso 47 kg puedo donar")
print(entidades)
# [
#   {"tipo": "PESO", "valor": 47}
# ]

# Caso 4: expresión relativa de tiempo
entidades = processor.extraer_entidades("me vacuné ayer")
print(entidades)
# [
#   {"tipo": "TIPO",   "valor": "vacuna"},
#   {"tipo": "TIEMPO", "unidad": "meses", "valor": 0.03}  # ≈ 1/30
# ]

# Caso 5: tiempo en palabras
entidades = processor.extraer_entidades("me operé hace dos meses")
print(entidades)
# [
#   {"tipo": "TIPO",   "valor": "cirugia"},
#   {"tipo": "TIEMPO", "unidad": "meses", "valor": 2}
# ]
```

**El diccionario TIPOS** — la lista de condiciones médicas reconocidas:

```python
TIPOS = {
    "tatuaje":       ["tatuaje", "tattoo", "tatuarme", "maquillaje permanente"],
    "piercing":      ["piercing", "arito", "pendiente"],
    "anticoagulante":["anticoagulante", "warfarina", "acenocumarol", "rivaroxaban", "apixaban"],
    "insulina":      ["insulina", "insulinodependiente", "diabetes tipo 1", "diabetes 1"],
    "cirugia":       ["cirugia", "cirugía", "operacion", "operación", "operar"],
    "vih_sida":      ["vih", "hiv", "sida", "aids"],
    "hepatitis_c":   ["hepatitis c"],
    # ... más de 40 condiciones médicas
}
```

---

### `normalizar_coloquialismos(texto)` — Entiende el español rioplatense

Este método no usa spaCy — usa regex. Pero es fundamental para que la app funcione con el lenguaje real de los usuarios argentinos.

```python
_AFIRMACIONES = {
    "dale", "obvio", "claro", "por supuesto", "joya", "re",
    "sip", "sep", "oka", "ok", "okay", "bueno", "seguro",
    "obvio que si", "claro que sí", "sí claro",
}
_NEGACIONES = {
    "nope", "nel", "nah", "para nada", "negativo",
    "ni en pedo", "ni loco", "ni loca", "jamas",
}
```

**Ejemplo con consultas reales:**

```python
processor = NLPProcessor()

# Colapsa repeticiones (siii → si, nooo → no)
print(processor.normalizar_coloquialismos("siiiiiiiii"))  # → "sí"
print(processor.normalizar_coloquialismos("nooooo"))      # → "no"

# Modismos completos
print(processor.normalizar_coloquialismos("dale"))       # → "sí"
print(processor.normalizar_coloquialismos("obvio"))      # → "sí"
print(processor.normalizar_coloquialismos("joya"))       # → "sí"
print(processor.normalizar_coloquialismos("nel"))        # → "no"
print(processor.normalizar_coloquialismos("nope"))       # → "no"
print(processor.normalizar_coloquialismos("ni en pedo")) # → "no"

# En medio de una oración
print(processor.normalizar_coloquialismos("oka puedo donar"))
# → "sí puedo donar"
```

**¿Por qué importa esto?** Si el chatbot pregunta "¿Te hiciste el tatuaje hace más de un año?" y el usuario responde "dale", sin normalización la app no sabría qué hacer con esa respuesta. Con este método, "dale" se convierte en "sí" antes de que el texto siga su camino por el sistema.

---

### `detectar_intencion(texto)` — Entiende qué quiere el usuario

```python
INTENCIONES = {
    "querer_donar":   ["puedo donar", "quiero donar", "donar sangre",
                       "soy apto", "puedo ser donante"],
    "consulta_tiempo":["cuanto tiempo", "cuánto tiempo", "cuando puedo",
                       "cuándo puedo", "cuanto falta"],
    "informacion":    ["que necesito", "qué necesito", "requisitos",
                       "condiciones", "que piden", "qué piden"],
}

def detectar_intencion(self, texto: str) -> str:
    texto_lower = texto.lower()
    for intencion, frases in self.INTENCIONES.items():
        for frase in frases:
            if frase in texto_lower:
                return intencion
    return "consulta_general"
```

**Ejemplo:**

```python
processor = NLPProcessor()

print(processor.detectar_intencion("quiero donar sangre"))
# → "querer_donar"

print(processor.detectar_intencion("cuánto tiempo tengo que esperar"))
# → "consulta_tiempo"

print(processor.detectar_intencion("qué requisitos necesito"))
# → "informacion"

print(processor.detectar_intencion("me hice un tatuaje hace 2 meses"))
# → "consulta_general"  (ninguna frase coincide exactamente)
```

---

### `interpretar(entidades)` — Extrae los valores concretos

```python
def interpretar(self, entidades: list[dict]) -> tuple:
    tipo = None
    tiempo = None
    peso = None
    edad = None
    for e in entidades:
        if e["tipo"] == "TIPO":   tipo   = e["valor"]
        if e["tipo"] == "TIEMPO": tiempo = e["valor"]
        if e["tipo"] == "PESO":   peso   = e["valor"]
        if e["tipo"] == "EDAD":   edad   = e["valor"]
    return tipo, tiempo, peso, edad
```

**Ejemplo:**

```python
entidades = [
    {"tipo": "TIPO",   "valor": "tatuaje"},
    {"tipo": "TIEMPO", "unidad": "meses", "valor": 3}
]
tipo, tiempo, peso, edad = processor.interpretar(entidades)
# tipo   = "tatuaje"
# tiempo = 3
# peso   = None
# edad   = None
```

Luego `rules.py` recibe `tipo="tatuaje"` y `tiempo=3` y evalúa: "tatuaje requiere esperar 12 meses, faltan 9 meses más."

---

## El flujo completo — Desde el mensaje hasta la respuesta

Este es el recorrido completo de un mensaje real. Sirve para demostrar que entendés el sistema de punta a punta.

**Entrada del usuario:** `"me hice un tatuaje hace 3 meses puedo donar"`

### Paso 1 — `normalizar_coloquialismos()`

```python
texto = "me hice un tatuaje hace 3 meses puedo donar"
# No hay modismos → texto sale igual
```

### Paso 2 — `extraer_entidades()`

```python
entidades = processor.extraer_entidades(texto)
# Busca en TIPOS: "tatuaje" aparece en TIPOS["tatuaje"] ✓
# Busca regex tiempo: r"(\d+)\s*(mes|meses)" → encuentra "3 meses" ✓
# Resultado:
# [
#   {"tipo": "TIPO",   "valor": "tatuaje"},
#   {"tipo": "TIEMPO", "unidad": "meses", "valor": 3}
# ]
```

### Paso 3 — `interpretar()`

```python
tipo, tiempo, peso, edad = processor.interpretar(entidades)
# tipo   = "tatuaje"
# tiempo = 3
# peso   = None
# edad   = None
```

### Paso 4 — `evaluar()` en rules.py

```python
# rules.py busca "tatuaje" en el texto:
if any(k in t for k in ["tatuaje", "tattoo", "maquillaje permanente"]):
    return _evaluar_tiempo(tiempo_meses, 12, "el tatuaje")
```

### Paso 5 — `_evaluar_tiempo(3, 12, "el tatuaje")`

```python
# tiempo_meses=3, espera_meses=12, nombre="el tatuaje"
# 3 < 12 → faltan = 12 - 3 = 9 meses
return {
    "resultado": "no_apto_temporal",
    "mensaje": "Después de el tatuaje debés esperar 12 meses. Te faltan aproximadamente 9 meses más."
}
```

**Respuesta final al usuario:** `"Después del tatuaje debés esperar 12 meses. Te faltan aproximadamente 9 meses más."`

---

## Otro flujo completo — Caso con anticoagulante

**Entrada:** `"tomo warfarina desde hace un año"`

```
normalizar: sin cambios
extraer_entidades:
  → TIPOS["anticoagulante"] contiene "warfarina" ✓
  → regex r"(un|uno)\s*(año|años)" encuentra "un año" → valor = 12 meses
  → entidades = [{"tipo":"TIPO","valor":"anticoagulante"}, {"tipo":"TIEMPO","unidad":"meses","valor":12}]

interpretar:
  → tipo = "anticoagulante", tiempo = 12

evaluar() en rules.py:
  → if any(k in t for k in ["anticoagulante","warfarina",...]):
       return _perm("Los anticoagulantes generan diferimiento permanente.")

Respuesta: "Los anticoagulantes generan diferimiento permanente."
```

El tiempo no importa aquí — con anticoagulantes es diferimiento permanente sin importar hace cuánto.

---

## Demo: Script de prueba para la presentación

Si querés demostrar que entendés el sistema ejecutando código real, podés correr esto desde la carpeta `backend/`:

```python
# demo_nlp.py — ejecutar desde backend/
import sys
sys.path.insert(0, ".")
from nlp import NLPProcessor
from rules import evaluar

processor = NLPProcessor()

casos_de_prueba = [
    "me hice un tatuaje hace 3 meses",
    "me hice un tatuaje hace 13 meses",
    "tomo warfarina",
    "peso 47 kg puedo donar",
    "peso 55 kg puedo donar",
    "tengo hepatitis c",
    "me operé hace 2 meses",
    "me vacuné ayer contra la fiebre amarilla",
    "tomé antibióticos la semana pasada",
    "tengo diabetes tipo 1",
]

print("=" * 70)
print(f"{'CONSULTA':<45} {'RESULTADO'}")
print("=" * 70)

for consulta in casos_de_prueba:
    resultado = evaluar(consulta)
    estado = resultado["resultado"]
    print(f"{consulta:<45} → {estado}")
    print(f"  {resultado['mensaje'][:80]}")
    print()
```

Salida esperada:
```
me hice un tatuaje hace 3 meses          → no_apto_temporal
  Después de el tatuaje debés esperar 12 meses. Te faltan aproximadamente 9 meses más.

me hice un tatuaje hace 13 meses         → apto
  Con 13 meses desde el tatuaje ya podrías donar. Confirmalo en el centro.

tomo warfarina                            → no_apto_permanente
  Los anticoagulantes generan diferimiento permanente.

peso 47 kg puedo donar                   → no_apto_permanente
  Con 47 kg no cumplís el peso mínimo de 50 kg para donar.

peso 55 kg puedo donar                   → apto
  Con 55 kg cumplís el requisito de peso mínimo (50 kg).

tengo hepatitis c                         → no_apto_permanente
  La Hepatitis B o C confirmada genera diferimiento permanente.

me operé hace 2 meses                    → no_apto_temporal
  Después de la cirugía debés esperar 6 meses. Te faltan aproximadamente 4 meses más.

me vacuné ayer contra la fiebre amarilla → no_apto_temporal
  Después de la vacuna contra fiebre amarilla debés esperar 1 mes.

tomé antibióticos la semana pasada       → no_apto_temporal
  Después del tratamiento con antibióticos debés esperar ...

tengo diabetes tipo 1                    → no_apto_permanente
  La diabetes tipo 1 insulinodependiente genera diferimiento permanente.
```

---

## Por qué usamos spaCy y no solo regex — La decisión de diseño

Una pregunta válida es: si `extraer_entidades`, `normalizar_coloquialismos` y `detectar_intencion` usan regex y no usan spaCy, ¿por qué incluir spaCy?

La respuesta está en `tokenizar()` y `pos_tag()`:

| Tarea                    | ¿Usa spaCy? | ¿Por qué?                                                        |
|--------------------------|-------------|------------------------------------------------------------------|
| Tokenización             | Sí          | Maneja puntuación, acentos y contracciones del español correctamente |
| POS tagging              | Sí (híbrido)| Clasifica palabras desconocidas que los diccionarios no cubren   |
| Extracción de condiciones| No          | Los diccionarios propios cubren mejor el vocabulario médico      |
| Extracción de tiempo     | No          | Regex es más precisa para "hace 3 meses", "la semana pasada", etc. |
| Normalización de slang   | No          | Regex y listas propias conocen el vocabulario rioplatense        |
| Detección de intención   | No          | Matching de frases exactas es suficiente y predecible            |

La combinación es deliberada: spaCy aporta la base lingüística (tokenización robusta, gramática), y el sistema propio aporta el conocimiento de dominio (medicina, donación de sangre, normativa argentina).

---

## Ventajas de spaCy — Por qué lo elegimos

| Ventaja                         | Cómo aplica en DonarApp                                              |
|---------------------------------|----------------------------------------------------------------------|
| **Velocidad**                   | Cada mensaje del usuario se procesa en milisegundos                  |
| **Listo para producción**       | Se integra limpiamente en FastAPI sin overhead                       |
| **API limpia**                  | `doc = nlp(texto)` → `[t.text for t in doc if t.is_alpha]` — tres líneas |
| **Modelo en español**           | `es_core_news_sm` entiende morfología y gramática del español         |
| **Fallback robusto**            | Si el modelo no está, la app funciona igual con regex                |
| **Pipeline modular**            | Podríamos agregar componentes propios al pipeline de spaCy si crece  |

---

## Desventajas de spaCy — Sus limitaciones en nuestro caso

| Desventaja                      | Cómo la manejamos en DonarApp                                        |
|---------------------------------|----------------------------------------------------------------------|
| **NER genérico**                | No usamos el NER de spaCy — construimos uno propio con diccionarios  |
| **Vocabulario médico limitado** | Los diccionarios `TIPOS` y `STOPWORDS` compensan este déficit        |
| **No entiende slang rioplatense**| `normalizar_coloquialismos()` convierte "dale/joya/nel" antes de spaCy |
| **Sin generación de texto**     | No lo necesitamos — las respuestas son texto fijo en `rules.py`      |

---

## Referencia Rápida — Los atributos que usamos en DonarApp

### En un `Token` — lo que usa `tokenizar()` y `pos_tag()`

```python
token.text       # texto original: "tatuaje"
token.pos_       # POS de spaCy:   "NOUN"
token.is_alpha   # True si es solo letras (sin números ni puntuación)
token.is_digit   # True si es un número: "2", "47"
token.is_stop    # True si es stopword según spaCy: "el", "la", "de"
token.lemma_     # forma base: "meses" → "mes", "tomé" → "tomar"
```

### En un `Doc` — lo que recibe `tokenizar()` y `pos_tag()`

```python
doc = self._nlp(texto.lower())

# Iterar tokens (tokenizar)
[t.text for t in doc if t.is_alpha]

# Iterar con POS (pos_tag)
for token in doc:
    pos = self._POS_MAP.get(token.pos_, "OTHER")
```

---

## Instalación y verificación

```bash
# Instalar spaCy
pip install spacy

# Descargar el modelo que usa DonarApp
python -m spacy download es_core_news_sm

# Verificar que funciona con una consulta real de DonarApp
python -c "
import spacy
nlp = spacy.load('es_core_news_sm')
doc = nlp('me hice un tatuaje hace 2 meses')
print([(t.text, t.pos_) for t in doc if t.is_alpha])
"
# [('me','PRON'), ('hice','VERB'), ('un','DET'), ('tatuaje','NOUN'), ('hace','VERB'), ('meses','NOUN')]
```

---

## Resumen — El discurso de cierre

En DonarApp, spaCy cumple un rol de **fundación lingüística**. No es el protagonista de la inteligencia de la app — eso lo hacen los diccionarios médicos, las expresiones regulares para extraer tiempos, y las reglas médicas en `rules.py`. Pero spaCy sí provee algo que las regex solas no pueden dar: una **tokenización robusta del español** y una **comprensión gramatical** que permite saber si una palabra es verbo, sustantivo o adjetivo incluso cuando no está en ninguno de nuestros diccionarios.

La decisión de usarlo es pragmática: es rápido, confiable, tiene soporte activo para español, y cuesta cero líneas de código extra para lo que nos da. El modelo `es_core_news_sm` ocupa solo 13 MB y carga en menos de un segundo.

Si DonarApp creciera para manejar más idiomas, más condiciones médicas o frases más complejas, spaCy sería la base para entrenar un modelo de NER personalizado con datos médicos propios — algo que el sistema actual está preparado para incorporar.

---

*Documento de referencia — DonarApp — junio 2026*
