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
  | "q_salud_general" | "q_salud_cual"
  | "q_medicacion" | "q_medicacion_cual"
  | "q_vacunas" | "q_vacuna_cual"
  | "q_enfermedades" | "q_enfermedades_cual" | "q_diabetes_tipo"
  | "q_odontologo"
  | "q_tatuajes_procedimientos"
  | "pedir_ciudad"
  | "resultado";
