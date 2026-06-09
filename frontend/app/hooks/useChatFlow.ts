"use client";
import { useState, useRef, useEffect } from "react";
import { API, playTTS } from "../lib/api";
import type { FaseChat, Consulta, MensajeChat } from "../types";
import { buscarCentro } from "../lib/geo";

// ── Fases principales del flujo guiado ────────────────────────────────────────

export const FASES_PREGUNTAS: FaseChat[] = [
  "q_frecuencia_donacion",
  "q_embarazo",
  "q_salud_general",
  "q_medicacion",
  "q_vacunas",
  "q_enfermedades",
  "q_odontologo",
  "q_tatuajes_procedimientos",
];

export const TEXTOS_PREGUNTAS: Partial<Record<FaseChat, string>> = {
  q_frecuencia_donacion:       "¿Alguna vez donaste sangre?",
  q_embarazo:                  "¿Estás embarazada actualmente o estuviste embarazada en el último año?",
  q_salud_general:             "¿Te sentís bien de salud?",
  q_medicacion:                "¿Estás tomando algún medicamento actualmente?",
  q_vacunas:                   "¿Te aplicaste alguna vacuna en el último mes?",
  q_enfermedades:              "¿Tenés alguna enfermedad?",
  q_odontologo:                "¿Fuiste al odontólogo en el último año?",
  q_tatuajes_procedimientos:   "¿Te hiciste tatuajes, piercings o tratamientos invasivos o cirugías en el último año?",
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useChatFlow({ autoTts = false, bienvenida, modo = "texto" }: { autoTts?: boolean; bienvenida?: string; modo?: "texto" | "voz" } = {}) {
  const BIENVENIDA = bienvenida ?? "¿Querés comenzar con el asistente de evaluación de donantes?";
  const hint = (t: string, v: string) => modo === "voz" ? v : t;

  const [input, setInput]               = useState("");
  const [inputError, setInputError]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [escuchando, setEscuchando]     = useState(false);
  const [grabando, setGrabando]         = useState(false);
  const [ttsOn, setTtsOn]               = useState(autoTts);
  const [fase, setFase]                 = useState<FaseChat>("confirmar_inicio");
  const [perfil, setPerfil]             = useState<{ edad?: number; sexo?: string; peso?: number }>({});
  const [restricciones, setRestricciones] = useState<string[]>([]);
  const [mensajes, setMensajes]         = useState<MensajeChat[]>([{ id: 0, rol: "bot", texto: BIENVENIDA }]);

  const msgIdRef       = useRef(1);
  const chatEndRef     = useRef<HTMLDivElement>(null);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const restriccionesRef = useRef<string[]>([]);
  const ttsOnRef       = useRef(autoTts);
  const manejarEnvioFn = useRef((_t: string, _o?: string) => {});

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);
  useEffect(() => { ttsOnRef.current = ttsOn; }, [ttsOn]);

  const bot = (texto: string, consulta?: Consulta, esResultado?: boolean) => {
    setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto, consulta, esResultado }]);
    if (ttsOnRef.current) playTTS(texto);
  };
  const usuario = (texto: string) =>
    setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "usuario", texto }]);

  const reiniciar = () => {
    msgIdRef.current = 1;
    setFase("confirmar_inicio"); setPerfil({}); setRestricciones([]);
    restriccionesRef.current = [];
    setInput(""); setInputError("");
    setMensajes([{ id: 0, rol: "bot", texto: BIENVENIDA }]);
  };

  const mkConsultaResultado = (tipo: string): Consulta => ({
    tipo, pregunta: "", respuesta: "", opciones: [], intencion: "",
    entidades: [], tokens: [], pos: [], perplejidad: 0,
    fuera_de_dominio: false, alerta_pp: null, score_ir: 0,
    snippets: [], tiempo_ms: 0,
  });

  const addRestriccion = (r: string) => {
    restriccionesRef.current = [...restriccionesRef.current, r];
    setRestricciones([...restriccionesRef.current]);
  };

  // Salta q_embarazo cuando el sexo no es "Mujer"
  const siguientePregunta = (f: FaseChat, sexo?: string): FaseChat => {
    const idx = FASES_PREGUNTAS.indexOf(f);
    if (idx < 0 || idx >= FASES_PREGUNTAS.length - 1) return "resultado";
    const next = FASES_PREGUNTAS[idx + 1];
    if (next === "q_embarazo" && sexo !== "Mujer") {
      const idxEmb = FASES_PREGUNTAS.indexOf("q_embarazo");
      return idxEmb >= FASES_PREGUNTAS.length - 1 ? "resultado" : FASES_PREGUNTAS[idxEmb + 1];
    }
    return next;
  };

  const irAResultado = () => {
    const rs = restriccionesRef.current;
    const hayPermanente = rs.some(r => r.startsWith("❌"));
    const hayTemporal   = rs.some(r => r.startsWith("⏳"));
    if (rs.length === 0) {
      bot("¡Excelente! Según la evaluación, podés donar sangre. ✓\n\nSi querés, podés decirme de qué ciudad sos y con gusto te digo cuáles son los centros de donación más cercanos.", mkConsultaResultado("pregunta_ciudad"), true);
      setFase("pedir_ciudad");
    } else if (hayPermanente) {
      bot("No podés donar sangre.\n\nTe recomendamos hablar con el médico del banco de sangre para que evalúe tu caso.", mkConsultaResultado("no_apto_permanente"), true);
      setFase("resultado");
    } else if (hayTemporal) {
      bot("Por el momento no podés donar sangre.\n\nCuando se cumplan los tiempos de espera, acercate al banco de sangre más cercano.", mkConsultaResultado("no_apto_temporal"), true);
      setFase("resultado");
    } else {
      bot("Tenés algunas observaciones. El personal médico del banco de sangre evaluará si podés donar.\n\nSi querés, podés decirme de qué ciudad sos y te digo cuáles son los centros de donación más cercanos.", mkConsultaResultado("apto"), true);
      setFase("pedir_ciudad");
    }
  };

  // Detección de Sí / No en dos niveles (regex directa + semántica)
  const detectarSiNo = (raw: string): "si" | "no" | null => {
    const t = raw.toLowerCase().trim();
    if (/^(no|nop|nel|nunca|jam[aá]s|negativo|para nada|tampoco)\b/i.test(t)) return "no";
    if (/^(s[íi]|s|yes|dale|ok|claro|correcto|afirmativo|efectivamente|cierto|verdad|exacto|obvio|por supuesto)\b/i.test(t)) return "si";
    if (/\b(no tengo|no tuve|no soy|no fui|no tomo|no me|no estoy|no padezco|no recib[íi]|no me hice)\b/i.test(t)) return "no";
    if (/\b(tengo|tuve|padezco|fui|tomo|tom[eé]|recib[íi]|me hice|soy|estoy|me diagnosticaron|me apliqu[eé])\b/i.test(t)) return "si";
    return null;
  };

  // ── Procesadores de cada fase ─────────────────────────────────────────────

  const procesarConfirmacion = (raw: string) => {
    const t = raw.toLowerCase().trim();
    const esSi = /\b(s[íi]|si|yes|claro|dale|ok|s)\b/i.test(t) || t === "s" || t === "si" || t === "sí";
    const esNo = /\b(no|nop|negativo|nel)\b/i.test(t) || t === "no";
    if (!esSi && !esNo) { setInputError("Respondé Sí o No."); return; }
    setInputError(""); setInput(""); usuario(esSi ? "Sí" : "No");
    if (!esSi) {
      bot("¡Gracias por visitarnos! Cuando quieras podés volver a consultar.");
      setFase("resultado");
    } else {
      bot("¡Hola! Soy el asistente para evaluar si podés donar sangre del Instituto de Hemoterapia PBA.\n\n¿Cuánto pesás? " + hint("(ingresá el número en kg)", "Decí el número en kg."));
      setFase("pedir_peso");
    }
  };

  const procesarPeso = (raw: string) => {
    const n = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(n) || n < 10 || n > 300) { setInputError("Ingresá un peso válido en kg (ej: 72)."); return; }
    setInputError(""); setInput(""); usuario(raw);
    setPerfil(p => ({ ...p, peso: n }));
    if (n < 50) {
      bot(`Por el reglamento, el peso mínimo para donar sangre es de 50 kg. Tu peso actual (${n} kg) no alcanza ese requisito.\n\nCuando llegues a 50 kg podés volver a consultar. ¡Gracias por tu interés!`, mkConsultaResultado("no_apto_permanente"), true);
      setFase("resultado");
    } else {
      bot(`Con ${n} kg cumplís el requisito de peso. ✓\n\n¿Cuántos años tenés?`);
      setFase("pedir_edad");
    }
  };

  const procesarEdad = (raw: string) => {
    const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (isNaN(n) || n < 1 || n > 120) { setInputError("Ingresá una edad válida (número entre 1 y 120)."); return; }
    setInputError(""); setInput(""); usuario(raw);
    setPerfil(p => ({ ...p, edad: n }));
    if (n < 16) {
      bot(`Por el reglamento del Instituto de Hemoterapia PBA, no podés donar sangre hasta que cumplas 16 años.\n\n¡Gracias por tu interés! Cuando llegues a esa edad, volvé a consultar.`, mkConsultaResultado("no_apto_permanente"), true);
      setFase("resultado");
    } else if (n <= 17) {
      bot(`Con ${n} años podés donar, pero solo cada 6 meses (máximo 2 veces por año) y necesitás autorización del centro de donación. ✓\n\n¿Cuál es tu sexo biológico?`);
      setFase("pedir_sexo");
    } else if (n > 65) {
      bot(`Con ${n} años podés donar presentando un certificado de salud de tu médico de cabecera. ✓\n\n¿Cuál es tu sexo biológico?`);
      setFase("pedir_sexo");
    } else {
      bot(`Con ${n} años cumplís el requisito de edad. ✓\n\n¿Cuál es tu sexo biológico?`);
      setFase("pedir_sexo");
    }
  };

  const procesarSexo = (sexo: string) => {
    usuario(sexo); setPerfil(p => ({ ...p, sexo }));
    bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS.q_frecuencia_donacion!);
    setFase("q_frecuencia_donacion");
  };

  const procesarSexoPorVoz = (raw: string) => {
    const t = raw.toLowerCase();
    if (/\b(masc|hombre|varon|var[oó]n|masculino|male)\b/i.test(t)) { procesarSexo("Hombre"); return; }
    if (/\b(fem|mujer|femenino|female)\b/i.test(t)) { procesarSexo("Mujer"); return; }
    if (/\b(otro|other)\b/i.test(t)) { procesarSexo("Otro"); return; }
    setInputError("Decí Masculino, Femenino u Otro.");
  };

  const procesarFrecuenciaDonacion = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      bot("¿Hace cuánto tiempo fue tu última donación? " + hint("(Ej: 2 meses, 6 semanas, 1 año)", "Decí cuánto tiempo pasó desde tu última donación."));
      setFase("q_ultima_donacion");
    } else {
      const next = siguientePregunta("q_frecuencia_donacion", perfil.sexo);
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS[next]!);
      setFase(next);
    }
  };

  const procesarUltimaDonacion = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const txt = raw.toLowerCase();
    let semanas: number | null = null;

    const mA = txt.match(/(\d+(?:[.,]\d+)?)\s*a[ñn]os?/);
    const mM = txt.match(/(\d+(?:[.,]\d+)?)\s*mes(?:es)?/);
    const mS = txt.match(/(\d+(?:[.,]\d+)?)\s*semanas?/);
    const mD = txt.match(/(\d+(?:[.,]\d+)?)\s*d[ií]as?/);

    if (mA) semanas = parseFloat(mA[1].replace(",", ".")) * 52;
    else if (mM) semanas = parseFloat(mM[1].replace(",", ".")) * 4.33;
    else if (mS) semanas = parseFloat(mS[1].replace(",", "."));
    else if (mD) semanas = parseFloat(mD[1].replace(",", ".")) / 7;

    if (semanas === null) {
      setInputError("No entendí el tiempo. Por ejemplo: '2 meses', '6 semanas', '1 año'.");
      return;
    }

    const minimoSemanas = perfil.sexo === "Mujer" ? 12 : 8;
    const minimoTexto   = perfil.sexo === "Mujer" ? "3 meses" : "2 meses";
    const next = siguientePregunta("q_frecuencia_donacion", perfil.sexo);

    if (semanas < minimoSemanas) {
      addRestriccion(`⏳ Donación reciente — esperá hasta cumplir ${minimoTexto} desde la última donación.`);
      bot(`El período mínimo entre donaciones es de ${minimoTexto}. Debés esperar antes de volver a donar.`, mkConsultaResultado("no_apto_temporal"), true);
      irAResultado();
    } else {
      bot(`Cumplís el período de espera entre donaciones. ✓\n\n${TEXTOS_PREGUNTAS[next]!}`);
      setFase(next);
    }
  };

  const procesarEmbarazo = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      addRestriccion("❌ Embarazo actual o en el último año — diferimiento permanente.");
      bot("El embarazo actual o reciente (último año) impide donar sangre.", mkConsultaResultado("no_apto_permanente"), true);
      irAResultado();
    } else {
      const next = siguientePregunta("q_embarazo", perfil.sexo);
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS[next]!);
      setFase(next);
    }
  };

  const procesarSaludGeneral = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      bot("¡Qué bueno! ✓\n\n" + TEXTOS_PREGUNTAS.q_medicacion!);
      setFase("q_medicacion");
    } else {
      bot("¿Qué te duele o cuál es tu malestar? " + hint("(Describilo con tus palabras)", "Describilo con tus palabras."));
      setFase("q_salud_cual");
    }
  };

  const procesarSaludCual = async (texto: string) => {
    setInputError(""); setInput(""); usuario(texto);
    setLoading(true);
    try {
      const r = await fetch(`${API}/consulta`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, origen: "texto" }),
      });
      const data: Consulta = await r.json();
      if (data.tipo === "no_apto_permanente") {
        addRestriccion(`❌ Malestar de salud — diferimiento permanente.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else if (data.tipo === "no_apto_temporal") {
        addRestriccion(`⏳ Malestar de salud — esperá hasta recuperarte.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else {
        const esFD = data.fuera_de_dominio || data.tipo === "fuera_de_dominio";
        if (esFD) {
          bot("No pude identificar el malestar que describiste. ¿Podés describirlo con más detalle? Por ejemplo: dolor de cabeza, fiebre, tos, gripe...");
          return;
        }
        const msg = data.respuesta || "Ese malestar no parece ser un impedimento directo para donar. Te recomendamos comentarlo en el centro.";
        bot(msg + "\n\n" + TEXTOS_PREGUNTAS.q_medicacion!, data);
        setFase("q_medicacion");
      }
    } catch { bot("Error conectando con el servidor. ¿Está activo el backend?"); }
    finally { setLoading(false); }
  };

  const procesarMedicacion = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      bot("¿Cuál medicamento estás tomando actualmente? " + hint("(Escribí el nombre del medicamento)", "Decí el nombre del medicamento."));
      setFase("q_medicacion_cual");
    } else {
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS.q_vacunas!);
      setFase("q_vacunas");
    }
  };

  const procesarMedicacionCual = async (texto: string) => {
    setInputError(""); setInput(""); usuario(texto);
    setLoading(true);
    try {
      const r = await fetch(`${API}/medicamento`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const data = await r.json();
      if (data.tipo === "no_apto_permanente") {
        addRestriccion(`❌ Medicamento: ${texto} — diferimiento permanente.`);
        bot(data.respuesta, mkConsultaResultado(data.tipo), true);
        irAResultado();
      } else if (data.tipo === "no_apto_temporal") {
        addRestriccion(`⏳ Medicamento: ${texto} — requiere período de espera.`);
        bot(data.respuesta, mkConsultaResultado(data.tipo), true);
        irAResultado();
      } else {
        bot(data.respuesta + " ✓\n\n" + TEXTOS_PREGUNTAS.q_vacunas!);
        setFase("q_vacunas");
      }
    } catch { bot("Error conectando con el servidor. ¿Está activo el backend?"); }
    finally { setLoading(false); }
  };

  const procesarVacunas = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      bot("¿Cuál vacuna te aplicaste? " + hint("(Escribí el nombre de la vacuna)", "Decí el nombre de la vacuna."));
      setFase("q_vacuna_cual");
    } else {
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS.q_enfermedades!);
      setFase("q_enfermedades");
    }
  };

  const procesarVacunaCual = async (texto: string) => {
    setInputError(""); setInput(""); usuario(texto);
    setLoading(true);
    try {
      const r = await fetch(`${API}/consulta`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: `vacuna ${texto}`, origen: "texto" }),
      });
      const data: Consulta = await r.json();
      if (data.tipo === "no_apto_permanente") {
        addRestriccion(`❌ Vacuna: ${texto} — diferimiento permanente.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else if (data.tipo === "no_apto_temporal") {
        addRestriccion(`⏳ Vacuna: ${texto} — requiere período de espera.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else {
        const esFD = data.fuera_de_dominio || data.tipo === "fuera_de_dominio";
        const msg = esFD
          ? "Esa vacuna no es un impedimento para donar sangre."
          : (data.respuesta || "Esa vacuna no genera diferimiento automático.");
        if (!esFD && data.tipo !== "apto" && data.tipo !== "corpus" && data.tipo !== "info") {
          addRestriccion(`⚠️ Vacuna: ${texto} — consultar en el banco de sangre.`);
        }
        bot(msg + " ✓\n\n" + TEXTOS_PREGUNTAS.q_enfermedades!, esFD ? undefined : data);
        setFase("q_enfermedades");
      }
    } catch { bot("Error conectando con el servidor. ¿Está activo el backend?"); }
    finally { setLoading(false); }
  };

  const procesarEnfermedades = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      bot("¿Cuál enfermedad tenés? " + hint("(Escribí el nombre de la enfermedad)", "Decí el nombre de la enfermedad."));
      setFase("q_enfermedades_cual");
    } else {
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS.q_odontologo!);
      setFase("q_odontologo");
    }
  };

  const procesarEnfermedadCual = async (texto: string) => {
    setInputError(""); setInput(""); usuario(texto);
    const txtLower = texto.toLowerCase();

    // Caso especial: diabetes sin especificar tipo
    const esDiabetes = /\bdiabet(?:es|ico|ica)\b/i.test(txtLower);
    const tieneTipo  = /\btipo\s*[12]\b|tipo\s*(?:uno|dos)\b/i.test(txtLower);
    if (esDiabetes && !tieneTipo) {
      bot("¿Es diabetes tipo 1 o tipo 2?\n• Tipo 1 (insulinodependiente): NO PODÉS DONAR (permanente).\n• Tipo 2 (no insulinodependiente): PODÉS DONAR si está controlada.");
      setFase("q_diabetes_tipo");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API}/consulta`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, origen: "texto" }),
      });
      const data: Consulta = await r.json();
      if (data.tipo === "no_apto_permanente") {
        addRestriccion(`❌ Enfermedad: ${texto} — diferimiento permanente.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else if (data.tipo === "no_apto_temporal") {
        addRestriccion(`⏳ Enfermedad: ${texto} — requiere período de espera.`);
        setMensajes(prev => [...prev, { id: msgIdRef.current++, rol: "bot", texto: data.respuesta, consulta: data, esResultado: true }]);
        if (ttsOnRef.current) playTTS(data.respuesta);
        irAResultado();
      } else {
        const esFD = data.fuera_de_dominio || data.tipo === "fuera_de_dominio";
        if (esFD) {
          bot("No pude identificar la enfermedad que describiste. ¿Podés describirla con más detalle? Por ejemplo: diabetes, hepatitis, hipertensión...");
          return;
        }
        const msg = data.respuesta || "Esa condición no parece ser un impedimento directo para donar.";
        if (data.tipo === "consultar") {
          addRestriccion(`⚠️ Enfermedad: ${texto} — consultar en el banco de sangre.`);
        }
        bot(msg + "\n\n" + TEXTOS_PREGUNTAS.q_odontologo!, data);
        setFase("q_odontologo");
      }
    } catch { bot("Error conectando con el servidor. ¿Está activo el backend?"); }
    finally { setLoading(false); }
  };

  const procesarDiabetesTipo = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const txt = raw.toLowerCase();
    const esTipo1 = /\b(?:tipo\s*1|tipo\s*uno|1|insulina|inyecci[oó]n)\b/i.test(txt);
    const esTipo2 = /\b(?:tipo\s*2|tipo\s*dos|2|pastillas?|metformina|diet[ao]|sin\s*insulina|oral)\b/i.test(txt);
    if (!esTipo1 && !esTipo2) { setInputError("Por favor indicá: tipo 1 (con insulina) o tipo 2 (pastillas o dieta)."); return; }
    if (esTipo1) {
      addRestriccion("❌ Diabetes tipo 1 (insulinodependiente) — diferimiento permanente.");
      bot("La diabetes tipo 1 con insulina impide donar de forma permanente.", mkConsultaResultado("no_apto_permanente"), true);
      irAResultado();
    } else {
      bot("La diabetes tipo 2 controlada con pastillas o dieta generalmente no impide donar. ✓\n\n" + TEXTOS_PREGUNTAS.q_odontologo!);
      setFase("q_odontologo");
    }
  };

  const procesarOdontologo = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      addRestriccion("⚠️ Visita odontológica reciente — el banco de sangre evaluará.");
      bot("Registrado. El personal médico lo tendrá en cuenta. ✓\n\n" + TEXTOS_PREGUNTAS.q_tatuajes_procedimientos!);
    } else {
      bot("Perfecto. ✓\n\n" + TEXTOS_PREGUNTAS.q_tatuajes_procedimientos!);
    }
    setFase("q_tatuajes_procedimientos");
  };

  const procesarTatuajesProcedimientos = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    const r = detectarSiNo(raw);
    if (!r) { setInputError("No entendí tu respuesta. Por favor respondé Sí o No."); return; }
    if (r === "si") {
      addRestriccion("⏳ Tatuaje, piercing o procedimiento invasivo — espera de 6 meses.");
    }
    irAResultado();
  };

  const procesarCiudad = (raw: string) => {
    setInputError(""); setInput(""); usuario(raw);
    if (/^(no|nop|nada|ninguna|no quiero|paso)\b/i.test(raw.toLowerCase().trim())) {
      bot("No hay problema. Acercate al banco de sangre más cercano a tu domicilio. ¡Gracias por querer donar!", mkConsultaResultado("apto"), true);
      setFase("resultado");
      return;
    }
    const res = buscarCentro(raw);
    if (res.tipo === "exacto") {
      const lista = res.centros.map(c =>
        `• ${c.centro_donacion}\n   📍 ${c.direccion}${c.telefono ? `\n   📞 ${c.telefono}` : ""}${c.horarios ? `\n   🕒 ${c.horarios}` : ""}`
      ).join("\n\n");
      bot(`Podés acercarte a cualquiera de estos centros en la zona de ${raw.trim()}:\n\n${lista}\n\n¡Gracias por querer donar sangre!`, mkConsultaResultado("apto"), true);
    } else if (res.tipo === "cercanos") {
      const lista = res.centros.map(c =>
        `• ${c.centro_donacion} (${c.ciudad} - a ${Math.round(c.distancia || 0)} km)\n   📍 ${c.direccion}${c.telefono ? `\n   📞 ${c.telefono}` : ""}${c.horarios ? `\n   🕒 ${c.horarios}` : ""}`
      ).join("\n\n");
      bot(`No tenemos postas registradas exactamente en "${raw.trim()}", pero estos son los centros más cercanos:\n\n${lista}\n\n¡Gracias por querer donar sangre!`, mkConsultaResultado("apto"), true);
    } else {
      bot(`${res.mensaje}\n\nPodés buscar los lugares habilitados en la página oficial del Instituto de Hemoterapia o intentar con una ciudad cercana.`, mkConsultaResultado("apto"), true);
    }
    setFase("resultado");
  };

  // ── Dispatcher principal ──────────────────────────────────────────────────

  const manejarEnvio = (texto: string, _origen = "texto") => {
    const t = texto.trim();
    if (!t) { setInputError("Escribí tu respuesta."); return; }
    if (fase === "confirmar_inicio")          { procesarConfirmacion(t); return; }
    if (fase === "pedir_peso")                { procesarPeso(t); return; }
    if (fase === "pedir_edad")                { procesarEdad(t); return; }
    if (fase === "pedir_sexo")                { procesarSexoPorVoz(t); return; }
    if (fase === "q_frecuencia_donacion")     { procesarFrecuenciaDonacion(t); return; }
    if (fase === "q_ultima_donacion")         { procesarUltimaDonacion(t); return; }
    if (fase === "q_embarazo")                { procesarEmbarazo(t); return; }
    if (fase === "q_salud_general")           { procesarSaludGeneral(t); return; }
    if (fase === "q_salud_cual")              { procesarSaludCual(t); return; }
    if (fase === "q_medicacion")              { procesarMedicacion(t); return; }
    if (fase === "q_medicacion_cual")         { procesarMedicacionCual(t); return; }
    if (fase === "q_vacunas")                 { procesarVacunas(t); return; }
    if (fase === "q_vacuna_cual")             { procesarVacunaCual(t); return; }
    if (fase === "q_enfermedades")            { procesarEnfermedades(t); return; }
    if (fase === "q_enfermedades_cual")       { procesarEnfermedadCual(t); return; }
    if (fase === "q_diabetes_tipo")           { procesarDiabetesTipo(t); return; }
    if (fase === "q_odontologo")              { procesarOdontologo(t); return; }
    if (fase === "q_tatuajes_procedimientos") { procesarTatuajesProcedimientos(t); return; }
    if (fase === "pedir_ciudad")              { procesarCiudad(t); return; }
  };
  manejarEnvioFn.current = manejarEnvio;

  // ── Voz ────────────────────────────────────────────────────────────────────

  const iniciarVoz = () => {
    if (fase === "resultado") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Usá Chrome o Edge para el reconocimiento de voz."); return; }
    const rec = new SR(); rec.lang = "es-AR"; rec.continuous = false;
    setEscuchando(true); rec.start();
    rec.onresult = (e: any) => {
      if (!e.results[0].isFinal) return;
      manejarEnvioFn.current(e.results[0][0].transcript, "voz");
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend   = () => setEscuchando(false);
  };

  const iniciarWhisper = async () => {
    if (fase === "resultado") return;
    if (grabando) { mediaRecRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); setGrabando(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData(); form.append("audio", blob, "audio.webm");
        setLoading(true);
        try {
          const r = await fetch(`${API}/whisper`, { method: "POST", body: form });
          const d = await r.json();
          if (d.texto) manejarEnvioFn.current(d.texto, "whisper");
        } catch { alert("Error en Whisper"); } finally { setLoading(false); }
      };
      mediaRecRef.current = rec; rec.start(); setGrabando(true);
    } catch { alert("No se pudo acceder al micrófono"); }
  };

  const placeholder = fase === "pedir_edad"              ? "Ej: 28"
    : fase === "pedir_peso"                              ? "Ej: 72"
    : fase === "q_ultima_donacion"                       ? "Ej: 2 meses, 6 semanas, 1 año"
    : fase === "q_salud_cual"                            ? "Ej: dolor de cabeza, tos, fiebre..."
    : fase === "q_medicacion_cual"                       ? "Ej: ibuprofeno, insulina, anticoagulante..."
    : fase === "q_vacuna_cual"                           ? "Ej: gripe, varicela, fiebre amarilla..."
    : fase === "q_enfermedades_cual"                     ? "Ej: diabetes, hipertensión, hepatitis..."
    : fase === "q_diabetes_tipo"                         ? "Tipo 1 / Tipo 2 (o escribí 1 o 2)"
    : fase === "pedir_ciudad"                            ? "Ej: La Plata, Mar del Plata..."
    : "Sí / No";

  return {
    input, setInput, inputError, setInputError, loading,
    escuchando, grabando, ttsOn, setTtsOn,
    fase, perfil, restricciones, mensajes, chatEndRef,
    placeholder, reiniciar, procesarSexo, manejarEnvio, iniciarVoz, iniciarWhisper,
  };
}
