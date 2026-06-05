import { useState, useRef } from "react";

// ─────────────────────────────────────────────
// CORPUS BASE
// ─────────────────────────────────────────────
const CORPUS_BASE = {
  requisitos: {
    datos: [
      "Sentirse bien y sano el día de la donación",
      "Tener entre 16 y 65 años (mayores de 65 requieren certificado médico)",
      "Pesar más de 50 kg (se extraen 450 ± 45 ml)",
      "Presentar DNI",
      "No concurrir en ayunas (desayunar o almorzar antes)",
      "Temperatura corporal no mayor a 37°C",
      "Hemoglobina entre 12,5 y 17 gr/dl / Hematocrito entre 38 y 52%",
      "Pulso entre 60 y 100 latidos por minuto",
      "Tensión sistólica: 100–170 mmHg / Diastólica: 60–100 mmHg",
    ]
  },
  frecuencia: {
    datos: [
      "Hombres: mínimo cada 8 semanas, hasta 5 veces por año",
      "Mujeres: mínimo cada 12 semanas, hasta 4 veces por año",
      "Jóvenes de 16–17 años: mínimo cada 6 meses, hasta 2 veces por año",
      "Aféresis: no más frecuente que cada 3 días",
      "Luego de una aféresis, diferir sangre entera al menos 48 horas",
      "Para aféresis: donantes entre 18 y 65 años",
    ]
  },
  antesdurantedespues: {
    antes: [
      "No fumar antes de donar",
      "No concurrir en ayunas — desayunar o almorzar antes",
      "Hidratarse bien antes",
      "Vestimenta cómoda para poder arremangarse",
      "No acercarse solo para saber si tiene una infección (derivar al médico)",
    ],
    durante: [
      "Permanecer recostado en posición cómoda",
      "No mover el brazo con la venopunción",
      "Avisar si hay mareos, náuseas o incomodidad",
      "Al terminar, comprimir la zona con el apósito al menos 5 minutos",
      "No levantarse hasta que el técnico lo indique",
    ],
    despues: [
      "Consumir el refrigerio ofrecido",
      "Aumentar ingesta de líquidos y comer bien ese día",
      "Dejar el apósito al menos 4 horas",
      "Si hay sangrado: presionar, levantar el brazo, aplicar hielo",
      "Evitar ejercicio enérgico y deportes de contacto",
      "No conducir por tiempo prolongado las primeras 2 horas",
      "No fumar las 2 horas siguientes",
      "Si recuerda algo importante que no informó: llamar al centro",
      "Completar el formulario confidencial (HEMO 3) con SÍ o NO — sin este formulario la sangre no puede ser utilizada",
    ]
  },
  medicamentos: {
    permanente: [
      "Digoxina", "Vasodilatadores", "Insulina", "Anticoagulantes",
      "Hormona de crecimiento hipofisaria humana (la recombinante NO difiere)",
      "Etretinato (Tigason)", "Oncológicos",
      "Antipsicóticos (Quetiapina, Risperidona, Olanzapina, Haloperidol, etc.)",
      "Anticonvulsivantes para epilepsia — ver excepción en Casos borde",
      "Betabloqueantes con FC menor a 60/min — ver excepción en Casos borde",
    ],
    transitorio: [
      "Acitretina (Neotigason): 3 años",
      "Dutasteride: 6 meses",
      "Testosterona: 6 meses",
      "Clomifeno: 3 meses",
      "Isotretinoína (Roacutan) / Finasteride: 1 mes",
      "Antibióticos: 7 días (excepto Tetraciclina, Doxiciclina y Eritromicina: sin diferimiento)",
      "Corticoides sistémicos: 48 horas",
    ],
    sinDiferimiento: [
      "Antitabaco", "Adelgazantes", "Anticonceptivos", "Hormonales sustitutivos",
      "Anticolesterol", "Antihemorroidales", "Descongestivos nasales y broncodilatadores",
      "Cortisona interarticular", "Vitaminas y minerales", "Tranquilizantes, ansiolíticos y antidepresivos",
      "Analgésicos menores", "Relajantes musculares", "Diuréticos", "Profilaxis antiviral",
      "Antiespasmódicos", "Agentes uricosúricos", "Laxantes", "Antifúngicos para micosis ungueal",
      "Tetraciclina / Doxiciclina / Eritromicina",
    ]
  },
  vacunas: {
    diferir1mes: [
      "Polio oral (Sabin)", "Fiebre tifoidea oral", "Parotiditis",
      "Triple viral (paperas, sarampión y rubéola)", "Doble viral (sarampión y rubéola)",
      "Fiebre amarilla", "Sarampión", "BCG", "Rubéola",
      "Varicela / Herpes zóster", "Rotavirus", "Dengue", "FHA",
    ],
    diferir1anio: ["Antirrábica: solo si hubo mordedura"],
    sinDiferimiento: [
      "Polio inyectable (Salk)", "Doble Adulto dT", "DTPa", "Tetra",
      "Tétano", "Cólera", "Fiebre tifoidea inyectable", "Meningitis",
      "Coqueluche", "Neumococo", "HPV", "Influenza", "Leptospirosis",
      "Haemophilus influenzae tipo b",
      "Hepatitis A sin exposición (posexposición: 6 semanas)",
      "Hepatitis B recombinante sin exposición (posexposición: 12 meses)",
    ]
  },
  diferimientos: {
    cardiovascular: [
      { codigo: "CV1", tipo: "Permanente", detalle: "FC menor a 60/min sin entrenamiento deportivo" },
      { codigo: "CV2", tipo: "Permanente", detalle: "Coronariopatía" },
      { codigo: "CV3", tipo: "Permanente", detalle: "Endocarditis" },
      { codigo: "CV4", tipo: "Permanente", detalle: "Valvulopatías / Arteritis / Arteriopatía" },
      { codigo: "CV5", tipo: "Permanente", detalle: "Fibrilación auricular (salvo autorización de cardiólogo)" },
      { codigo: "CV6", tipo: "Permanente", detalle: "HTA grave: más de 2 hipotensores y FC menor a 60" },
      { codigo: "CV7", tipo: "1 año", detalle: "Pericarditis viral sin secuela" },
      { codigo: "CV8", tipo: "6 meses", detalle: "Flebitis / TVP — solo si está tomando anticoagulantes" },
      { codigo: "CV9", tipo: "6 meses", detalle: "Cateterismo / Estudios hemodinámicos" },
      { codigo: "CV10", tipo: "1 mes", detalle: "HTA al momento de la donación con o sin medicación — derivar" },
      { codigo: "CV11", tipo: "1 mes", detalle: "Taquicardia más de 100/min sin causa — derivar" },
      { codigo: "CV12", tipo: "15 días", detalle: "Esclerosis de varices" },
      { codigo: "CV13", tipo: "7 días", detalle: "Hipotensión al momento de la donación" },
      { codigo: "—", tipo: "No diferir", detalle: "Cardiopatía congénita operada CIA/CIV" },
      { codigo: "—", tipo: "No diferir", detalle: "Arritmias: extrasístoles / palpitaciones aisladas" },
    ],
    dermatologia: [
      { codigo: "DR1", tipo: "Permanente", detalle: "Micosis fungoide / Sínd. de Sézary / Sarcoma de Kaposi" },
      { codigo: "DR2", tipo: "Permanente", detalle: "Melanoma extendido" },
      { codigo: "DR3", tipo: "Permanente", detalle: "Enf. de Von Recklinhausen" },
      { codigo: "DR4", tipo: "5 años", detalle: "Epitelioma espinocelular" },
      { codigo: "DR5", tipo: "3 años", detalle: "Tratamiento de psoriasis con Acitretina/Tigason" },
      { codigo: "DR6", tipo: "1 año", detalle: "Melanoma in situ — con alta médica en seguimiento" },
      { codigo: "DR7", tipo: "1 año (6m con NAT)", detalle: "Tatuajes / Maquillaje permanente / Acupuntura con material NO propio" },
      { codigo: "DR8", tipo: "6 meses", detalle: "Piercing / Tatuaje / Maquillaje permanente / Acupuntura con material propio" },
      { codigo: "DR9", tipo: "6 meses (3m con NAT)", detalle: "Tratamiento cosmético invasivo / Escarificación (botox, rellenos, plasma rico en plaquetas)" },
      { codigo: "DR10", tipo: "6 meses", detalle: "Epitelioma basocelular" },
      { codigo: "DR11", tipo: "6 meses", detalle: "Psoriasis luego de un brote no tratado con Acitretina" },
      { codigo: "DR12", tipo: "1 mes", detalle: "Trat. del acné con Roacután / Trat. alopecia con Finasteride" },
      { codigo: "DR13", tipo: "1 mes", detalle: "Lesiones multicausal en zona de venopunción resuelta" },
      { codigo: "DR14", tipo: "15 días", detalle: "Erisipela desde el alta" },
      { codigo: "—", tipo: "No diferir", detalle: "Herpes simple oral / genital" },
    ],
    endocrinologia: [
      { codigo: "ED1", tipo: "Permanente", detalle: "Diabetes insulinodependiente Tipo 1 / Insípida" },
      { codigo: "ED2", tipo: "Permanente", detalle: "Enf. de glándulas suprarrenales / Cushing / Addison" },
      { codigo: "ED3", tipo: "Permanente", detalle: "Insuf. hipofisaria / Enanismo tratado con hormona de crecimiento hipofisaria" },
      { codigo: "ED4", tipo: "Permanente", detalle: "Hipertiroidismo / Enf. de Graves Basedow" },
      { codigo: "ED5", tipo: "7 días", detalle: "Centello tiroideo con resultado normal" },
    ],
    gastroenterologia: [
      { codigo: "GE1", tipo: "Permanente", detalle: "Cirrosis" },
      { codigo: "GE2", tipo: "Permanente", detalle: "Enf. de Crohn" },
      { codigo: "GE3", tipo: "Permanente", detalle: "Síndrome ascítico edematoso (SAE)" },
      { codigo: "GE4", tipo: "Permanente", detalle: "Hemocromatosis con otros criterios asociados" },
      { codigo: "GE5", tipo: "Permanente", detalle: "Pancreatitis alcohólica o crónica" },
      { codigo: "GE6", tipo: "Permanente", detalle: "Hipertensión portal" },
      { codigo: "GE7", tipo: "1 año", detalle: "Pancreatitis aguda luego de curada" },
      { codigo: "GE8", tipo: "1 año", detalle: "Úlcera gastroduodenal curada si recibió transfusión" },
      { codigo: "GE9", tipo: "6 meses", detalle: "Diverticulitis tratada-curada" },
      { codigo: "GE10", tipo: "6 meses", detalle: "Endoscopias con o sin biopsia resultado normal (VEDA-VCC)" },
      { codigo: "GE11", tipo: "15 días", detalle: "Diarrea desde el alta" },
    ],
    ginecologia: [
      { codigo: "GO1", tipo: "Permanente", detalle: "Histerectomía por neoplasias cervicales o endometriales" },
      { codigo: "GO2", tipo: "Permanente", detalle: "Trat. con gonadotrofinas por probable Creutzfeld Jacob" },
      { codigo: "GO3", tipo: "1 año", detalle: "Parto / Cesárea / Aborto CON transfusiones" },
      { codigo: "GO4", tipo: "6 meses", detalle: "Parto / Cesárea / Aborto SIN transfusiones" },
      { codigo: "—", tipo: "No diferir", detalle: "Ca. in situ de cérvix" },
    ],
    hematologia: [
      { codigo: "HE1", tipo: "Permanente", detalle: "Anemias hereditarias o congénitas: talasemia mayor, drepanocitosis, etc." },
      { codigo: "HE2", tipo: "Permanente", detalle: "Coagulopatías / Hemofilia" },
      { codigo: "HE3", tipo: "Permanente", detalle: "Crioglobulinemia" },
      { codigo: "HE4", tipo: "Permanente", detalle: "Leucemias / Linfomas" },
      { codigo: "HE5", tipo: "Permanente", detalle: "Porfirias" },
      { codigo: "HE6", tipo: "1 año", detalle: "Transfusiones de hemocomponentes" },
      { codigo: "HE7", tipo: "6 meses", detalle: "Hb baja (menos de 12,5 gr/dl) — derivar para estudio y tratamiento" },
      { codigo: "HE8", tipo: "6 meses", detalle: "Hb alta (mayor a 17,5 gr/dl) — derivar y reevaluar con resultados" },
      { codigo: "HE9", tipo: "1 mes", detalle: "Trat. anticoagulante luego de suspendido — ver causas" },
      { codigo: "—", tipo: "No diferir", detalle: "Talasemia MENOR sin anemia — candidatos a plaquetoaféresis" },
      { codigo: "—", tipo: "No diferir", detalle: "PTI sin recaídas en remisión curada más de 5 años" },
      { codigo: "—", tipo: "No diferir", detalle: "Trombofilia sin tratamiento" },
      { codigo: "—", tipo: "No diferir", detalle: "Poliglobulias secundarias (descartada policitemia vera)" },
    ],
    infectologia: [
      { codigo: "IN1", tipo: "Permanente", detalle: "Toxicomanía IV" },
      { codigo: "IN2", tipo: "Permanente", detalle: "Alcoholismo crónico (más de 1 litro por día)" },
      { codigo: "IN3", tipo: "Permanente", detalle: "ITT confirmada: Chagas / Brucelosis / Sífilis / Hep B / Hep C / VIH / HTLV" },
      { codigo: "IN4", tipo: "Permanente", detalle: "Lepra" },
      { codigo: "IN5", tipo: "Permanente", detalle: "Paludismo / Parasitosis sistémicas (diagnóstico establecido)" },
      { codigo: "IN6", tipo: "3 años", detalle: "Paludismo/Malaria: residente de zona endémica (Venezuela, Colombia, Brasil)" },
      { codigo: "IN7", tipo: "2 años", detalle: "Uso inyectable de PREP, PEP o ART" },
      { codigo: "IN8", tipo: "2 años", detalle: "TBC luego de curación" },
      { codigo: "IN9", tipo: "2 años", detalle: "Osteomielitis crónica curada" },
      { codigo: "IN10", tipo: "1 año", detalle: "Exposición a mordedura de animal desconocido" },
      { codigo: "IN11", tipo: "1 año", detalle: "Abuso de sustancias no IV + otros factores de riesgo" },
      { codigo: "IN12", tipo: "1 año", detalle: "Enfermedad de transmisión sexual" },
      { codigo: "IN13", tipo: "1 año", detalle: "Toxoplasmosis luego de curada" },
      { codigo: "IN14", tipo: "6 meses", detalle: "Riesgo individual con parejas nuevas / Uso de PREP o PEP oral" },
      { codigo: "IN15", tipo: "6 meses", detalle: "Mononucleosis infecciosa" },
      { codigo: "IN16", tipo: "4 meses", detalle: "Dengue hemorrágico" },
      { codigo: "IN17", tipo: "3 meses", detalle: "CMV" },
      { codigo: "IN18", tipo: "3 meses", detalle: "Botulismo" },
      { codigo: "IN19", tipo: "3 meses", detalle: "Paludismo: viaje a zona endémica (sin residencia)" },
      { codigo: "IN20", tipo: "2 meses", detalle: "Osteomielitis aguda curada" },
      { codigo: "IN21", tipo: "1 mes", detalle: "Parotiditis / Rubéola / Sarampión / Erisipela" },
      { codigo: "IN22", tipo: "1 mes", detalle: "Varicela / Herpes zóster" },
      { codigo: "IN23", tipo: "1 mes", detalle: "Dengue / Fiebre amarilla" },
      { codigo: "IN24", tipo: "15 días", detalle: "Fiebre de origen desconocido (evaluar con estudios)" },
      { codigo: "IN25", tipo: "15 días", detalle: "Estafilococo cutánea / Forúnculo / Ántrax luego de curada" },
      { codigo: "IN26", tipo: "15 días", detalle: "Infecciones bacterianas comunes no complicadas: sinusitis, otitis, infección urinaria baja" },
      { codigo: "—", tipo: "No diferir", detalle: "Herpes labial (herpes simple)" },
    ],
    neurologia: [
      { codigo: "SN1", tipo: "Permanente", detalle: "Enf. crónicas: ELA / Parkinson / EM / Miopatías / Miastenia" },
      { codigo: "SN2", tipo: "Permanente", detalle: "Epilepsia EN tratamiento actual" },
      { codigo: "SN3", tipo: "Permanente", detalle: "Hematoma subdural/extradural con secuelas" },
      { codigo: "SN4", tipo: "Permanente", detalle: "ACV" },
      { codigo: "SN5", tipo: "2 años", detalle: "Guillén Barré asintomático y sin recaídas" },
      { codigo: "SN6", tipo: "1 mes", detalle: "TEC con pérdida de conocimiento y sin secuelas" },
      { codigo: "SN7", tipo: "1 mes", detalle: "Sínd. vestibular periférico sin tratamiento" },
      { codigo: "—", tipo: "No diferir", detalle: "Antecedente de epilepsia SIN tratamiento y sin crisis en 3 años" },
    ],
    reumatologia: [
      { codigo: "RM1", tipo: "Permanente", detalle: "Colagenopatía / LES / AR / Reiter / Esclerodermia, etc." },
      { codigo: "RM2", tipo: "Permanente", detalle: "Fiebre reumática con secuelas (valvulopatía/nefropatía)" },
      { codigo: "RM3", tipo: "1 año", detalle: "Fiebre reumática tratada, curada, sin secuelas cardíacas" },
      { codigo: "RM4", tipo: "2 meses", detalle: "Gota luego de una crisis" },
    ],
    respiratorio: [
      { codigo: "SR1", tipo: "Permanente", detalle: "Asma severo con uso diario de broncodilatadores" },
      { codigo: "SR2", tipo: "Permanente", detalle: "EPOC" },
      { codigo: "SR3", tipo: "Permanente", detalle: "Edema agudo de pulmón / Embolia pulmonar" },
      { codigo: "SR4", tipo: "Permanente", detalle: "Pneumoconiosis / Sarcoidosis" },
      { codigo: "SR5", tipo: "15 días", detalle: "Asma leve que recibió corticoides sistémicos" },
      { codigo: "SR6", tipo: "15 días", detalle: "NAC luego de terminado el tratamiento" },
      { codigo: "—", tipo: "No diferir", detalle: "Asma leve en tratamiento de mantenimiento SIN corticoides orales" },
    ],
    nefroUrologia: [
      { codigo: "NU1", tipo: "Permanente", detalle: "IRC / Nefropatías crónicas" },
      { codigo: "NU2", tipo: "Permanente", detalle: "Tumores malignos del sistema urinario / Próstata" },
      { codigo: "NU3", tipo: "6 meses", detalle: "Procedimientos invasivos endoscópicos" },
      { codigo: "NU4", tipo: "1 mes", detalle: "Pielonefritis aguda / Prostatitis luego del alta" },
      { codigo: "NU5", tipo: "1 mes", detalle: "Nefrolitotomía extracorpórea" },
      { codigo: "NU6", tipo: "1 mes", detalle: "Urograma excretor / Estudios con contraste" },
      { codigo: "NU7", tipo: "15 días", detalle: "Cólico renal / Infección urinaria" },
    ],
    quirurgicas: [
      { codigo: "QX1", tipo: "Permanente", detalle: "Cirugía por cáncer" },
      { codigo: "QX2", tipo: "Permanente", detalle: "Cirugía cardíaca (excepto cardiopatía congénita CIA/CIV operada)" },
      { codigo: "QX3", tipo: "Permanente", detalle: "Cirugía de aneurisma o trombosis arteriales" },
      { codigo: "QX4", tipo: "Permanente", detalle: "Gastrectomía — NO incluye cirugía bariátrica" },
      { codigo: "QX5", tipo: "Permanente", detalle: "Neumonectomías / Lobectomías" },
      { codigo: "QX6", tipo: "Permanente", detalle: "Suprarrenalectomía" },
      { codigo: "QX7", tipo: "Permanente", detalle: "Esplenectomía salvo postotrauma" },
      { codigo: "QX8", tipo: "Permanente", detalle: "Neurocirugías" },
      { codigo: "QX9", tipo: "1 año", detalle: "Cirugía con transfusiones — con alta médica" },
      { codigo: "QX10", tipo: "6 meses", detalle: "Implante dental fase remoción ósea" },
      { codigo: "QX11", tipo: "6 meses", detalle: "Cirugía sin transfusiones — con alta médica y en actividad" },
      { codigo: "QX12", tipo: "2 meses", detalle: "Cirugía de miopía / cataratas — hasta alta oftalmológica" },
      { codigo: "QX13", tipo: "15 días", detalle: "Cirugía odontológica / Suturas / Abscesos con ATB — luego de suspendido" },
      { codigo: "QX14", tipo: "3 días", detalle: "Extracción dental sin ATB" },
    ],
    otros: [
      { codigo: "OT1", tipo: "1 año", detalle: "Autoexcluido en donación anterior — verificar si persiste la situación de riesgo" },
      { codigo: "OT2", tipo: "1 año", detalle: "Accidente punzocortante con material de riesgo" },
      { codigo: "OT3", tipo: "6 meses", detalle: "Entrevista no confiable — se descarta la bolsa posdonación" },
      { codigo: "OT4", tipo: "variable", detalle: "Fracturas sin tratamiento quirúrgico" },
      { codigo: "OT5", tipo: "15 días", detalle: "Mala red venosa" },
      { codigo: "OT6", tipo: "15 días", detalle: "Yeso luego de retirado" },
      { codigo: "OT7–11", tipo: "1 día", detalle: "Lipotimia transitoria / Aguja tapada / Bolsa rota / Se retiró sin donar / Escaso volumen" },
      { codigo: "OT12", tipo: "hasta 50 kg", detalle: "Peso menor a 50 kg" },
      { codigo: "OT13", tipo: "hasta resolución", detalle: "Pérdida de peso inexplicable mayor al 10% en 6 meses" },
    ]
  },
  conductasRiesgo: [
    "Parejas nuevas en los últimos 6 meses con conductas sexuales (oral, vaginal, anal) sin preservativo → diferir 6 meses",
    "Uso de PREP o PEP oral → diferir 6 meses",
    "Uso inyectable de PREP, PEP o ART → diferir 2 años",
    "Uso de drogas IV → diferimiento permanente",
    "La evaluación es individual e independiente del género u orientación sexual",
  ],
  componentes: {
    composicion: [
      "Glóbulos blancos (leucocitos): 4.000–9.000/mm³ — defensa contra infecciones",
      "Glóbulos rojos (eritrocitos): 4,5–5,5 millones/mm³ — transportan oxígeno, viven 120 días",
      "Plaquetas: 150.000–400.000/mm³ — detienen hemorragias",
      "Plasma: 91% agua, contiene albúmina, inmunoglobulinas, factores de coagulación",
    ],
    hemocomponentes: [
      "Glóbulos rojos → cirugías, accidentes, hemorragias, trasplantes, anemia",
      "Plasma → quemaduras, elaboración de hemoderivados",
      "Plaquetas → leucemias, trasplantes, quimioterapia, grandes hemorragias",
      "Crioprecipitados → trastornos específicos de la coagulación",
    ]
  },
  cuestionario: [
    "¿Se siente bien y 'sano' hoy?",
    "¿Está en ayunas?",
    "¿Está tomando alguna medicación (crónica, aspirina, analgésicos, antibióticos)?",
    "Si donó antes: ¿tuvo algún inconveniente posterior a la donación?",
    "¿Lo rechazaron como donante o le dijeron que no puede donar?",
    "¿Padece o padeció enfermedades del corazón (infarto, angina)?",
    "¿Padece enfermedades renales crónicas?",
    "¿Tuvo enfermedades pulmonares, tuberculosis o asma?",
    "¿Tuvo convulsiones, desmayos, ausencias o epilepsia?",
    "¿Le diagnosticaron cáncer? ¿Recibió quimioterapia o radiaciones?",
    "¿Recibió hormona de crecimiento hipofisaria?",
    "¿Tuvo hemorragias o problemas de coagulación?",
    "¿Es diabético insulinodependiente?",
    "¿Tiene o conoce la Enfermedad de Chagas? ¿Viajó a zonas endémicas?",
    "¿Tiene presión alta? ¿Está medicado?",
    "¿Tomó medicación para acné, psoriasis o próstata (Accutane, Proscar, Tigason)?",
    "¿Tuvo fatiga, sudoración nocturna o pérdida de peso inexplicable en los últimos 6 meses?",
    "¿Tuvo ganglios, lesiones en piel o mucosas (boca, nariz, pene, ano)?",
    "¿Tuvo ictericia, hepatitis o pruebas positivas para Hepatitis o enfermedad hepática?",
    "¿Recibió tratamiento odontológico? ¿Cuál? ¿Cuándo?",
    "¿Tuvo diarrea o fiebre en las últimas 72 hs?",
    "¿Tuvo Brucelosis, Malaria o Paludismo, o viajó a zonas endémicas?",
    "¿Usó agujas para inyectarse drogas?",
    "¿Usó cocaína, paco, éxtasis, tusi u otras drogas?",
    "¿Toma bebidas alcohólicas? ¿Cuánto? ¿Con qué frecuencia?",
    "¿Se realizó tatuajes, piercings, acupuntura, botox, plasma rico en plaquetas o sustancias de relleno? ¿Con material propio descartable?",
    "¿Ud. o su pareja recibieron transfusiones o trasplantes? ¿Se cuidaron con preservativos?",
    "¿Tuvo contacto accidental con sangre humana o secreciones?",
    "¿Le realizaron cirugía mayor, menor, laparoscopía o endoscopía?",
    "¿Tuvo contacto sexual de riesgo sin preservativo con persona expuesta o infectada con VIH, Hep B o C?",
    "¿Tuvo relaciones sexuales con varias parejas sin preservativo?",
    "¿Recibió tratamiento PREP/PEP/ART? ¿Inyectable o comprimidos?",
    "¿Tuvo contacto íntimo sin preservativo con paciente en diálisis o que recibe sangre?",
    "¿Fue tratado por sífilis, gonorrea u otra ETS?",
    "¿Tiene VIH o pruebas positivas?",
    "¿Estuvo detenido en institución carcelaria o policial?",
    "¿Recibió tratamiento antirrábico?",
    "¿Recibió inmunoglobulina anti-hepatitis B (no vacuna)?",
    "¿Recibió vacunas? ¿Cuáles?",
    "SI ES MUJER: ¿Cuántos embarazos tuvo? ¿Está embarazada? ¿Tiempo desde último parto/aborto/cesárea? (Con 3+ gestas NO apta para plaquetoaféresis — marcar como MULTIPARA en bolsa triple)",
  ],
  glosario: [
    { termino: "Donante habitual", def: "Presenta 2 donaciones en el último año calendario o en los últimos 12 meses previos" },
    { termino: "Donante de reposición", def: "Persona condicionada a donar para reponer stock de un paciente. Riesgo: puede omitir datos bajo presión" },
    { termino: "Donante voluntario", def: "Motivado por acto solidario y altruista, con compromiso social" },
    { termino: "Donante diferido permanente", def: "No cumple en forma permanente los criterios habilitantes (ej: diabéticos tipo I, oncológicos, coronarios)" },
    { termino: "Donante diferido temporario", def: "Debe esperar un tiempo determinado antes de poder donar" },
    { termino: "Período ventana", def: "Tiempo entre que el agente infeccioso entra al organismo y es detectable por laboratorio. Importante explicárselo al donante" },
    { termino: "Hemocomponente", def: "Fracción obtenida por separación física: glóbulos rojos, plasma, plaquetas y crioprecipitados" },
    { termino: "Hemoderivado", def: "Producto obtenido de la manufactura del plasma (albúmina, factores de coagulación, gammaglobulina). En Argentina se procesa en la UNC" },
    { termino: "ITT", def: "Infecciones transmisibles por transfusión: sífilis, Chagas, brucelosis, Hepatitis B y C, VIH, HTLV I y II" },
    { termino: "Seguridad transfusional", def: "Conjunto de medidas para garantizar la seguridad de transfusiones y sus componentes" },
    { termino: "Anemia", def: "Descenso de la hemoglobina por debajo de lo normal para edad y sexo" },
    { termino: "Poliglobulia", def: "Aumento de la masa total de glóbulos rojos según sexo y edad" },
    { termino: "NAT", def: "Técnica de amplificación de ácidos nucleicos — reduce plazos de diferimiento en tatuajes y procedimientos cosméticos" },
    { termino: "Aféresis", def: "Extracción de un componente específico (plasma, plaquetas). Requiere donante entre 18 y 65 años" },
    { termino: "HEMO 3", def: "Planilla confidencial donde el donante indica si su sangre puede o no ser usada. Sin ella la sangre no puede utilizarse" },
    { termino: "Principio de Precaución", def: "Ante duda, siempre en favor del receptor. Prevalece sobre las normas generales" },
  ],
};

// ─────────────────────────────────────────────
// CAPA A — CASOS BORDE
// ─────────────────────────────────────────────
const CAPA_A = [
  { pregunta: "¿Puede donar alguien que toma betabloqueantes?", respuesta_corta: "Depende del motivo y la FC", regla_general: "Diferimiento PERMANENTE si la FC es menor a 60/min", excepcion: "SIN diferimiento si el tratamiento es para cefaleas Y la FC es mayor a 60/min", variables: ["Motivo del tratamiento", "Frecuencia cardíaca actual"], alerta: "No diferir automáticamente por el medicamento. Preguntar siempre el diagnóstico.", tags: ["betabloqueantes","FC","cefaleas","medicamentos"] },
  { pregunta: "¿Puede donar alguien que toma anticonvulsivantes?", respuesta_corta: "Depende del diagnóstico", regla_general: "Diferimiento PERMANENTE si el tratamiento es para epilepsia", excepcion: "SIN diferimiento si el tratamiento es para dolor crónico", variables: ["Diagnóstico por el que se prescribió"], alerta: "El diferimiento es por la enfermedad, no por el medicamento.", tags: ["anticonvulsivantes","epilepsia","dolor crónico","medicamentos"] },
  { pregunta: "¿Puede donar alguien con fibrilación auricular?", respuesta_corta: "En general no, con excepción posible", regla_general: "Diferimiento PERMANENTE (CV5)", excepcion: "Puede donar con autorización escrita del cardiólogo", variables: ["Autorización del cardiólogo"], alerta: "Requerir documentación antes de aceptar.", tags: ["fibrilación auricular","cardíaco"] },
  { pregunta: "¿Puede donar alguien con tatuajes o piercing?", respuesta_corta: "Depende del material y si se realizó NAT", casos: [{ condicion: "Material NO propio", resultado: "1 año (6 meses con NAT)" },{ condicion: "Material propio descartable", resultado: "6 meses" }], variables: ["¿El material era propio?","¿Se realizó NAT?"], alerta: "Profundizar cómo, dónde y con qué materiales.", tags: ["tatuaje","piercing","acupuntura","NAT"] },
  { pregunta: "¿Puede donar alguien que se hizo botox, rellenos o plasma rico en plaquetas?", respuesta_corta: "Diferir, con posibilidad de reducción", regla_general: "6 meses (DR9)", excepcion: "Se reduce a 3 meses si se realiza NAT", variables: ["¿Se realizó NAT?"], tags: ["botox","rellenos","cosmético","NAT"] },
  { pregunta: "¿Puede donar alguien vacunado contra la hepatitis B?", respuesta_corta: "Depende de si hubo exposición", casos: [{ condicion: "Vacunación preventiva SIN exposición", resultado: "Sin diferimiento" },{ condicion: "Posexposición", resultado: "12 meses" }], variables: ["¿Fue preventiva o posexposición?"], tags: ["hepatitis B","vacuna","posexposición"] },
  { pregunta: "¿Puede donar alguien vacunado contra la hepatitis A?", respuesta_corta: "Depende de si hubo exposición", casos: [{ condicion: "Vacunación preventiva SIN exposición", resultado: "Sin diferimiento" },{ condicion: "Posexposición", resultado: "6 semanas" }], variables: ["¿Fue preventiva o posexposición?"], tags: ["hepatitis A","vacuna","posexposición"] },
  { pregunta: "¿Puede donar alguien que usa o usó PREP o PEP?", respuesta_corta: "Depende de la vía de administración", casos: [{ condicion: "Vía oral (comprimidos)", resultado: "6 meses" },{ condicion: "Vía inyectable", resultado: "2 años" }], variables: ["¿Fue oral o inyectable?"], alerta: "Preguntar explícitamente la vía. No asumir oral.", tags: ["PREP","PEP","ART","VIH"] },
  { pregunta: "¿Puede donar alguien que viajó a zona palúdica?", respuesta_corta: "Depende de si reside o solo viajó", casos: [{ condicion: "Viaje a zona endémica sin residencia", resultado: "3 meses (IN19)" },{ condicion: "Residente de zona endémica (Venezuela, Colombia, Brasil)", resultado: "3 años (IN6)" },{ condicion: "Diagnóstico de paludismo confirmado", resultado: "Permanente (IN5)" }], variables: ["¿Residía o solo viajó?","¿Tuvo diagnóstico?"], tags: ["paludismo","malaria","viaje","zona endémica"] },
  { pregunta: "¿Puede donar alguien con epilepsia o antecedente de epilepsia?", respuesta_corta: "Depende del estado actual", casos: [{ condicion: "Epilepsia EN tratamiento actual", resultado: "Permanente (SN2)" },{ condicion: "Antecedente SIN tratamiento y sin crisis en 3 años", resultado: "No diferir" }], variables: ["¿Está en tratamiento?","¿Cuándo fue la última crisis?"], alerta: "No diferir automáticamente por antecedente. Verificar si hay tratamiento activo.", tags: ["epilepsia","convulsiones","neurología"] },
  { pregunta: "¿Puede donar alguien con herpes?", respuesta_corta: "Depende del tipo", casos: [{ condicion: "Herpes simple labial o genital", resultado: "No diferir" },{ condicion: "Herpes zóster (culebrilla)", resultado: "1 mes (IN22)" }], variables: ["¿Qué tipo de herpes?"], alerta: "El herpes labial no difiere. El zóster sí.", tags: ["herpes","herpes labial","herpes zóster"] },
  { pregunta: "¿Puede donar alguien con talasemia?", respuesta_corta: "Depende del tipo", casos: [{ condicion: "Talasemia MAYOR", resultado: "Permanente (HE1)" },{ condicion: "Talasemia MENOR sin anemia", resultado: "No diferir — candidatos a plaquetoaféresis" }], variables: ["¿Mayor o menor?","¿Tiene anemia?"], alerta: "No confundir: la menor sin anemia puede donar.", tags: ["talasemia","anemia","hematología"] },
  { pregunta: "¿Puede donar alguien con psoriasis?", respuesta_corta: "Depende del tratamiento", casos: [{ condicion: "Brote sin Acitretina", resultado: "6 meses (DR11)" },{ condicion: "Tratamiento con Acitretina/Neotigason", resultado: "3 años luego de suspendido (DR5)" }], variables: ["¿Está en brote?","¿Usa Acitretina?"], tags: ["psoriasis","acitretina","neotigason"] },
  { pregunta: "¿Puede donar una mujer que está amamantando?", respuesta_corta: "Sí, con condiciones", regla_general: "A partir de los 6 meses del parto si cumple peso y Hb", excepcion: "El embarazo en sí contraindica la donación", variables: ["Tiempo desde el parto","Peso y Hb actuales"], tags: ["lactancia","parto","mujer"] },
  { pregunta: "¿Puede donar una mujer en período menstrual?", respuesta_corta: "Sí, en general", regla_general: "Durante el período menstrual se puede donar", excepcion: "La hipermenorrea u otras patologías deben ser evaluadas", variables: ["¿Hay patología menstrual?"], tags: ["menstruación","mujer"] },
  { pregunta: "¿Puede donar alguien con trombofilia?", respuesta_corta: "Sí, si no tiene tratamiento", casos: [{ condicion: "Sin tratamiento anticoagulante", resultado: "No diferir" },{ condicion: "Con tratamiento anticoagulante", resultado: "Permanente (por los anticoagulantes)" }], variables: ["¿Está en tratamiento anticoagulante?"], tags: ["trombofilia","anticoagulante","hematología"] },
  { pregunta: "¿Puede donar alguien mayor de 65 años?", respuesta_corta: "Sí, con autorización médica", regla_general: "El rango habitual es 16–65 años", excepcion: "Los mayores de 65 pueden donar con certificado de su médico de cabecera", variables: ["Certificado médico"], tags: ["edad","65 años"] },
  { pregunta: "¿Puede donar alguien con asma?", respuesta_corta: "Depende de la severidad y el tratamiento", casos: [{ condicion: "Asma SEVERO con broncodilatadores diarios", resultado: "Permanente (SR1)" },{ condicion: "Asma leve que recibió corticoides sistémicos", resultado: "15 días (SR5)" },{ condicion: "Asma leve — mantenimiento sin corticoides orales", resultado: "No diferir" }], variables: ["¿Severidad?","¿Usa broncodilatadores diariamente?","¿Recibió corticoides sistémicos?"], tags: ["asma","broncodilatadores","corticoides"] },
  { pregunta: "¿Puede donar alguien que usa aspirina (AAS)?", respuesta_corta: "Sí para sangre entera. No para plaquetoaféresis", regla_general: "Marcar en la bolsa triple como 'AAS'", excepcion: "Si la donación es plaquetoaféresis: diferir", variables: ["¿Tipo de donación prevista?"], alerta: "No rechazar automáticamente. Distinguir tipo de donación.", tags: ["aspirina","AAS","plaquetas"] },
  { pregunta: "¿Puede donar alguien que recibió la vacuna antirrábica?", respuesta_corta: "Depende del motivo", casos: [{ condicion: "Vacunación profiláctica sin mordedura", resultado: "Sin diferimiento" },{ condicion: "Vacunación post-mordedura", resultado: "1 año (VC1)" }], variables: ["¿Hubo mordedura?"], tags: ["rabia","antirrábica","mordedura","vacuna"] },
  { pregunta: "¿Puede donar alguien que tuvo cirugía bariátrica?", respuesta_corta: "No aplica diferimiento permanente de gastrectomía", regla_general: "La gastrectomía es diferimiento permanente (QX4)", excepcion: "QX4 excluye expresamente la cirugía bariátrica", variables: ["¿Qué tipo de cirugía exactamente?"], alerta: "Distinguir entre gastrectomía total y cirugía bariátrica.", tags: ["cirugía bariátrica","gastrectomía","quirúrgico"] },
  { pregunta: "¿Puede donar alguien con PTI (púrpura trombocitopénica)?", respuesta_corta: "Sí, si está en remisión hace más de 5 años", casos: [{ condicion: "Remisión curada, sin recaídas más de 5 años", resultado: "No diferir" },{ condicion: "PTI activa o reciente", resultado: "Diferir — evaluar individualmente" }], variables: ["Tiempo desde la última recaída"], tags: ["PTI","plaquetas","hematología"] },
];

// ─────────────────────────────────────────────
// CAPA B — CONDICIONES COMPUESTAS
// ─────────────────────────────────────────────
const CAPA_B = [
  { categoria: "Tatuajes y procedimientos en piel", filas: [
    { v1: "Tatuaje / Maquillaje permanente / Acupuntura", v2: "Material NO propio", resultado: "1 año", nota: "6 meses con NAT" },
    { v1: "Tatuaje / Maquillaje permanente / Acupuntura", v2: "Material propio descartable", resultado: "6 meses", nota: "" },
    { v1: "Tratamiento cosmético invasivo / Escarificación", v2: "Cualquier material", resultado: "6 meses", nota: "3 meses con NAT" },
    { v1: "Piercing", v2: "Evaluar infección local", resultado: "6 meses", nota: "Preguntar dónde, cómo y con qué materiales" },
  ]},
  { categoria: "Vacunas según contexto de exposición", filas: [
    { v1: "Hepatitis B recombinante", v2: "Sin exposición (preventiva)", resultado: "Sin diferimiento", nota: "" },
    { v1: "Hepatitis B recombinante", v2: "Posexposición", resultado: "12 meses", nota: "" },
    { v1: "Hepatitis A", v2: "Sin exposición (preventiva)", resultado: "Sin diferimiento", nota: "" },
    { v1: "Hepatitis A", v2: "Posexposición", resultado: "6 semanas", nota: "" },
    { v1: "Antirrábica", v2: "Sin mordedura", resultado: "Sin diferimiento", nota: "" },
    { v1: "Antirrábica", v2: "Con mordedura", resultado: "1 año", nota: "" },
    { v1: "Vacuna viva/atenuada (varicela, triple viral, etc.)", v2: "Cualquier contexto", resultado: "1 mes", nota: "" },
    { v1: "Vacuna inactivada / toxoide / recombinante", v2: "Clínicamente bien y sin exposición", resultado: "Sin diferimiento", nota: "" },
  ]},
  { categoria: "PREP / PEP / ART", filas: [
    { v1: "PREP / PEP oral", v2: "Profilaxis pre o post exposición", resultado: "6 meses", nota: "" },
    { v1: "PREP / PEP / ART inyectable", v2: "Cualquier indicación", resultado: "2 años", nota: "" },
  ]},
  { categoria: "Paludismo / Malaria", filas: [
    { v1: "Viaje a zona endémica", v2: "Sin residencia / sin diagnóstico", resultado: "3 meses", nota: "IN19" },
    { v1: "Residente de zona endémica", v2: "Venezuela, Colombia, Brasil u otras", resultado: "3 años", nota: "IN6" },
    { v1: "Diagnóstico confirmado de paludismo", v2: "Cualquier contexto", resultado: "Permanente", nota: "IN5" },
  ]},
  { categoria: "Parto / Cesárea / Aborto", filas: [
    { v1: "Parto / Cesárea / Aborto", v2: "SIN transfusiones", resultado: "6 meses", nota: "GO4" },
    { v1: "Parto / Cesárea / Aborto", v2: "CON transfusiones", resultado: "1 año", nota: "GO3" },
  ]},
  { categoria: "Epilepsia y anticonvulsivantes", filas: [
    { v1: "Epilepsia", v2: "En tratamiento actual", resultado: "Permanente", nota: "SN2" },
    { v1: "Antecedente de epilepsia", v2: "Sin tratamiento + sin crisis en 3 años", resultado: "No diferir", nota: "" },
    { v1: "Anticonvulsivantes", v2: "Prescritos para epilepsia", resultado: "Permanente", nota: "" },
    { v1: "Anticonvulsivantes", v2: "Prescritos para dolor crónico", resultado: "No diferir", nota: "" },
  ]},
  { categoria: "Betabloqueantes", filas: [
    { v1: "Betabloqueantes", v2: "FC menor a 60/min", resultado: "Permanente", nota: "CV1" },
    { v1: "Betabloqueantes para cefaleas", v2: "FC mayor a 60/min", resultado: "No diferir", nota: "Excepción explícita" },
  ]},
  { categoria: "Herpes", filas: [
    { v1: "Herpes simple", v2: "Oral o genital", resultado: "No diferir", nota: "" },
    { v1: "Herpes zóster (culebrilla)", v2: "Cualquier localización", resultado: "1 mes", nota: "IN22" },
  ]},
  { categoria: "Talasemia", filas: [
    { v1: "Talasemia mayor", v2: "Cualquier contexto", resultado: "Permanente", nota: "HE1" },
    { v1: "Talasemia menor", v2: "Sin anemia", resultado: "No diferir (candidatos a plaquetoaféresis)", nota: "" },
  ]},
  { categoria: "Asma", filas: [
    { v1: "Asma severo", v2: "Uso diario de broncodilatadores", resultado: "Permanente", nota: "SR1" },
    { v1: "Asma leve", v2: "Recibió corticoides sistémicos", resultado: "15 días", nota: "SR5" },
    { v1: "Asma leve", v2: "Mantenimiento sin corticoides orales", resultado: "No diferir", nota: "" },
  ]},
  { categoria: "Aspirina (AAS)", filas: [
    { v1: "AAS", v2: "Dona sangre entera", resultado: "No diferir — marcar bolsa como 'AAS'", nota: "" },
    { v1: "AAS", v2: "Dona plaquetoaféresis", resultado: "Diferir", nota: "" },
  ]},
  { categoria: "Mujer y plaquetoaféresis", filas: [
    { v1: "Mujer con 1 o 2 gestas (incluye abortos)", v2: "Sin otras restricciones", resultado: "Apta para plaquetoaféresis", nota: "" },
    { v1: "Mujer con 3 o más gestas", v2: "Cualquier contexto", resultado: "NO apta para plaquetoaféresis. Marcar bolsa como MULTIPARA", nota: "Razones inmunológicas" },
  ]},
  { categoria: "Hormona de crecimiento", filas: [
    { v1: "Hormona de crecimiento hipofisaria humana", v2: "Cualquier indicación", resultado: "Permanente", nota: "" },
    { v1: "Hormona de crecimiento recombinante", v2: "Cualquier indicación", resultado: "Sin diferimiento", nota: "Excepción explícita" },
  ]},
  { categoria: "Antibióticos", filas: [
    { v1: "Antibióticos en general", v2: "Cualquier indicación", resultado: "7 días luego de suspendido", nota: "MD6" },
    { v1: "Tetraciclina / Doxiciclina / Eritromicina", v2: "Cualquier indicación", resultado: "Sin diferimiento", nota: "Excepción explícita dentro del grupo" },
  ]},
];

// ─────────────────────────────────────────────
// CAPA C — FALSOS NEGATIVOS
// ─────────────────────────────────────────────
const CAPA_C = [
  { condicion: "Herpes labial", intuicion: "Diferir", correcto: "No diferir", nota: "Solo el herpes zóster difiere 1 mes. El simple oral o genital no.", tags: ["herpes"] },
  { condicion: "Talasemia menor sin anemia", intuicion: "Diferimiento permanente", correcto: "No diferir — candidatos ideales a plaquetoaféresis", nota: "Solo la talasemia mayor es permanente.", tags: ["talasemia"] },
  { condicion: "Antecedente de epilepsia sin tratamiento y sin crisis en 3 años", intuicion: "Diferimiento permanente", correcto: "No diferir", nota: "La epilepsia activa sí es permanente. El antecedente resuelto no.", tags: ["epilepsia"] },
  { condicion: "Trombofilia sin tratamiento anticoagulante", intuicion: "Diferimiento permanente", correcto: "No diferir", nota: "El diferimiento sería por el anticoagulante, no por la trombofilia.", tags: ["trombofilia"] },
  { condicion: "PTI en remisión curada sin recaídas en más de 5 años", intuicion: "Diferimiento permanente", correcto: "No diferir", nota: "Solo el PTI activo o reciente genera diferimiento.", tags: ["PTI"] },
  { condicion: "Fibrilación auricular con autorización del cardiólogo", intuicion: "Diferimiento permanente automático", correcto: "Puede donar con autorización escrita del cardiólogo", nota: "Sin esa autorización, el diferimiento es permanente.", tags: ["fibrilación auricular"] },
  { condicion: "Mujer en período menstrual", intuicion: "No puede donar", correcto: "Puede donar salvo patología asociada (hipermenorrea, etc.)", nota: "Evaluar profesionalmente si hay patología menstrual.", tags: ["menstruación","mujer"] },
  { condicion: "Mujer amamantando", intuicion: "No puede donar", correcto: "Puede donar a partir de los 6 meses del parto si cumple peso y Hb", nota: "El embarazo sí contraindica. La lactancia no.", tags: ["lactancia","mujer"] },
  { condicion: "Persona mayor de 65 años", intuicion: "No puede donar", correcto: "Puede donar con certificado de su médico de cabecera", nota: "No es diferimiento automático, requiere evaluación.", tags: ["edad"] },
  { condicion: "Asma leve en mantenimiento sin corticoides orales", intuicion: "Diferir por asma", correcto: "No diferir", nota: "El asma severo con broncodilatadores diarios sí es permanente.", tags: ["asma"] },
  { condicion: "Cardiopatía congénita operada (CIA/CIV)", intuicion: "Permanente por cirugía cardíaca", correcto: "No diferir — excepción explícita a QX2", nota: "QX2 excluye expresamente CIA/CIV operada.", tags: ["cardiopatía congénita","cirugía"] },
  { condicion: "Cirugía bariátrica", intuicion: "Permanente como gastrectomía", correcto: "No aplica permanente — QX4 excluye expresamente la bariátrica", nota: "La gastrectomía total sí es permanente.", tags: ["bariátrica","gastrectomía"] },
  { condicion: "Poliglobulia secundaria con policitemia vera descartada", intuicion: "Diferir por valores altos", correcto: "No diferir", nota: "Solo la policitemia vera requeriría diferimiento.", tags: ["poliglobulia"] },
  { condicion: "Hormona de crecimiento recombinante", intuicion: "Permanente como la hipofisaria", correcto: "Sin diferimiento — solo la hipofisaria humana es permanente", nota: "Distinción crítica: hipofisaria humana vs. recombinante.", tags: ["hormona de crecimiento"] },
  { condicion: "Tetraciclina, Doxiciclina o Eritromicina", intuicion: "Diferir 7 días como cualquier antibiótico", correcto: "Sin diferimiento — excepción dentro de la regla de antibióticos", nota: "Los demás antibióticos sí difieren 7 días.", tags: ["antibiótico","tetraciclina"] },
  { condicion: "Ansiolíticos, antidepresivos o tranquilizantes", intuicion: "Diferir por ser psicofármacos", correcto: "Sin diferimiento — están en la lista explícita", nota: "Los antipsicóticos (Quetiapina, Risperidona, etc.) sí son permanentes.", tags: ["ansiolíticos","antidepresivos","psicofármacos"] },
  { condicion: "Ca. in situ de cérvix", intuicion: "Permanente por neoplasia", correcto: "No diferir", nota: "La histerectomía por neoplasia cervical o endometrial sí es permanente.", tags: ["cérvix","cáncer","ginecología"] },
];

// ─────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────
const SECTIONS = [
  { id: "casosBorde", label: "Casos borde", icon: "⚡", capa: true },
  { id: "condicionesCompuestas", label: "Condiciones compuestas", icon: "⚖", capa: true },
  { id: "falsosNegativos", label: "Falsos negativos", icon: "🔄", capa: true },
  { id: "requisitos", label: "Requisitos", icon: "✓" },
  { id: "frecuencia", label: "Frecuencia", icon: "⏱" },
  { id: "antesdurantedespues", label: "Antes / Durante / Después", icon: "📋" },
  { id: "medicamentos", label: "Medicamentos", icon: "💊" },
  { id: "vacunas", label: "Vacunas", icon: "💉" },
  { id: "diferimientos", label: "Diferimientos", icon: "🗂" },
  { id: "conductasRiesgo", label: "Conductas de riesgo", icon: "⚠" },
  { id: "componentes", label: "Sangre y componentes", icon: "🩸" },
  { id: "cuestionario", label: "Cuestionario", icon: "📝" },
  { id: "glosario", label: "Glosario", icon: "📖" },
];

const DIFF_SYSTEMS = [
  { key: "cardiovascular", label: "Cardiovascular" },
  { key: "dermatologia", label: "Dermatología" },
  { key: "endocrinologia", label: "Endocrinología" },
  { key: "gastroenterologia", label: "Gastroenterología" },
  { key: "ginecologia", label: "Gineco-obstetricia" },
  { key: "hematologia", label: "Hematología" },
  { key: "infectologia", label: "Infectología" },
  { key: "neurologia", label: "Neurología" },
  { key: "reumatologia", label: "Reumatología" },
  { key: "respiratorio", label: "Respiratorio" },
  { key: "nefroUrologia", label: "Nefro-urología" },
  { key: "quirurgicas", label: "Quirúrgicas" },
  { key: "otros", label: "Otros" },
];

function Badge({ tipo }) {
  if (!tipo) return null;
  const p = tipo === "Permanente";
  const n = tipo === "No diferir" || tipo?.startsWith("No diferir");
  const cls = p ? "bg-red-100 text-red-700 border-red-200" : n ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls} whitespace-nowrap`}>{tipo}</span>;
}

function SearchPanel({ query, onClose }) {
  const q = query.toLowerCase();
  const results = [];
  CAPA_A.forEach(item => {
    if (item.tags?.some(t => t.includes(q)) || item.pregunta.toLowerCase().includes(q))
      results.push({ source: "⚡ Casos borde", texto: item.pregunta, sub: item.respuesta_corta });
  });
  CAPA_C.forEach(item => {
    if (item.tags?.some(t => t.includes(q)) || item.condicion.toLowerCase().includes(q))
      results.push({ source: "🔄 Falsos negativos", texto: item.condicion, sub: `✓ ${item.correcto}` });
  });
  CAPA_B.forEach(cat => {
    cat.filas.forEach(f => {
      if (f.v1.toLowerCase().includes(q) || f.v2.toLowerCase().includes(q) || f.resultado.toLowerCase().includes(q))
        results.push({ source: `⚖ ${cat.categoria}`, texto: `${f.v1} + ${f.v2}`, sub: f.resultado });
    });
  });
  Object.entries(CORPUS_BASE.diferimientos).forEach(([sys, rows]) => {
    if (!Array.isArray(rows)) return;
    const label = DIFF_SYSTEMS.find(s => s.key === sys)?.label || sys;
    rows.forEach(row => {
      if (row.detalle.toLowerCase().includes(q) || row.codigo.toLowerCase().includes(q))
        results.push({ source: `🗂 ${label}`, tipo: row.tipo, texto: row.detalle });
    });
  });
  ["permanente","transitorio","sinDiferimiento"].forEach(cat => {
    CORPUS_BASE.medicamentos[cat]?.forEach(med => {
      if (med.toLowerCase().includes(q)) {
        const label = cat === "permanente" ? "Permanente" : cat === "transitorio" ? "Transitorio" : "Sin diferimiento";
        results.push({ source: "💊 Medicamentos", tipo: label, texto: med });
      }
    });
  });
  CORPUS_BASE.glosario.forEach(t => {
    if (t.termino.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
      results.push({ source: "📖 Glosario", texto: t.termino, sub: t.def });
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[75vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <span className="font-semibold text-slate-700 text-sm">
            "<em className="text-rose-600">{query}</em>" · {results.length} resultados
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-50">
          {results.length === 0
            ? <div className="p-8 text-center text-slate-400 text-sm">No se encontraron resultados.</div>
            : results.map((r, i) => (
              <div key={i} className="px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">{r.source}</span>
                  {r.tipo && <Badge tipo={r.tipo} />}
                </div>
                <p className="text-sm text-slate-700">{r.texto}</p>
                {r.sub && <p className="text-xs text-slate-500 mt-0.5">{r.sub}</p>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("casosBorde");
  const [diffSys, setDiffSys] = useState("cardiovascular");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi .2s ease forwards}
        .sh::-webkit-scrollbar{display:none}.sh{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {showSearch && <SearchPanel query={search} onClose={() => setShowSearch(false)} />}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebar(!sidebar)} className="lg:hidden text-slate-500">☰</button>
          <span className="text-lg">🩸</span>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Donación de Sangre · Guía completa</h1>
            <p className="text-xs text-slate-400">Instituto de Hemoterapia PBA · 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-1 max-w-sm">
            <input type="text" placeholder="Buscar… (Enter)" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && search.trim()) setShowSearch(true); }}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-400 bg-slate-50" />
            {search && <button onClick={() => setShowSearch(true)} className="text-rose-500 text-xs font-semibold whitespace-nowrap">Buscar</button>}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        <aside className={`${sidebar ? "block" : "hidden"} lg:block w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto sh py-4 pr-2`}>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider px-2 mb-2">Anti-perplejidad</p>
          {SECTIONS.filter(s => s.capa).map(s => (
            <button key={s.id} onClick={() => { setActive(s.id); setSidebar(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs mb-1 flex items-center gap-2 font-semibold transition-all ${active === s.id ? "bg-rose-600 text-white shadow" : "text-rose-700 bg-rose-50 hover:bg-rose-100"}`}>
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 mt-4">Corpus base</p>
          {SECTIONS.filter(s => !s.capa).map(s => (
            <button key={s.id} onClick={() => { setActive(s.id); setSidebar(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs mb-1 flex items-center gap-2 transition-all ${active === s.id ? "bg-slate-700 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}>
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-4 py-6 fi" key={active}>

          {active === "casosBorde" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">⚡ Casos borde — Capa A</h2>
              <p className="text-xs text-slate-500 mb-4">Preguntas con respuesta intuitiva frecuentemente incorrecta. Cada caso explicita la regla general, la excepción y las variables críticas a verificar.</p>
              <div className="space-y-2">
                {CAPA_A.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.pregunta}</p>
                        <p className="text-xs text-slate-500 mt-0.5">→ <span className="font-semibold text-rose-600">{item.respuesta_corta}</span></p>
                      </div>
                      <span className="text-slate-300 shrink-0 text-xs">{expanded === i ? "▲" : "▼"}</span>
                    </button>
                    {expanded === i && (
                      <div className="px-5 pb-4 pt-3 border-t border-slate-50 space-y-3">
                        {item.regla_general && <div className="flex gap-2 items-start"><span className="text-xs font-bold text-red-500 shrink-0 mt-0.5 w-20">REGLA</span><p className="text-sm text-slate-700">{item.regla_general}</p></div>}
                        {item.excepcion && <div className="flex gap-2 items-start"><span className="text-xs font-bold text-emerald-600 shrink-0 mt-0.5 w-20">EXCEPCIÓN</span><p className="text-sm text-slate-700">{item.excepcion}</p></div>}
                        {item.casos && (
                          <div className="space-y-1.5">
                            {item.casos.map((c, j) => (
                              <div key={j} className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                                <span className="text-slate-600 min-w-[180px]">{c.condicion}</span>
                                <span className="text-slate-300">→</span>
                                <Badge tipo={c.resultado} />
                              </div>
                            ))}
                          </div>
                        )}
                        {item.variables && <div className="flex gap-2 items-start"><span className="text-xs font-bold text-amber-600 shrink-0 mt-0.5 w-20">VERIFICAR</span><p className="text-xs text-slate-600">{item.variables.join(" · ")}</p></div>}
                        {item.alerta && <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">⚠ {item.alerta}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "condicionesCompuestas" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">⚖ Condiciones compuestas — Capa B</h2>
              <p className="text-xs text-slate-500 mb-4">Casos donde el resultado depende de dos variables simultáneas. Una fila por cada combinación posible.</p>
              <div className="space-y-4">
                {CAPA_B.map((cat, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                      <h3 className="font-bold text-slate-700 text-xs">{cat.categoria}</h3>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="border-b border-slate-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-slate-400 font-semibold">Condición</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-semibold">Variable 2</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-semibold">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {cat.filas.map((f, j) => (
                          <tr key={j} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-700">{f.v1}</td>
                            <td className="px-4 py-2 text-slate-600">{f.v2}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge tipo={f.resultado} />
                                {f.nota && <span className="text-slate-400">{f.nota}</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "falsosNegativos" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">🔄 Falsos negativos — Capa C</h2>
              <p className="text-xs text-slate-500 mb-4">Condiciones donde la respuesta intuitiva es rechazar al donante, pero la norma indica lo contrario. Son los errores más costosos porque descartan donantes aptos.</p>
              <div className="grid gap-3">
                {CAPA_C.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <p className="font-semibold text-slate-800 text-sm mb-3">{item.condicion}</p>
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-red-600 font-bold">✗ </span>
                        <span className="text-xs text-red-700">{item.intuicion}</span>
                      </div>
                      <span className="text-slate-300 text-sm">→</span>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-emerald-600 font-bold">✓ </span>
                        <span className="text-xs text-emerald-800">{item.correcto}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 border-t border-slate-50 pt-2">{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "requisitos" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Requisitos para donar</h2>
              <div className="grid gap-2">
                {CORPUS_BASE.requisitos.datos.map((d, i) => (
                  <div key={i} className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm flex gap-3 items-start">
                    <span className="text-rose-400 shrink-0 mt-0.5 text-xs">●</span>
                    <span className="text-sm text-slate-700">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "frecuencia" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Frecuencia de donación</h2>
              <div className="grid gap-2">
                {CORPUS_BASE.frecuencia.datos.map((d, i) => (
                  <div key={i} className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm flex gap-3 items-start">
                    <span className="text-rose-400 shrink-0 mt-0.5">⏱</span>
                    <span className="text-sm text-slate-700">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "antesdurantedespues" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Antes, durante y después</h2>
              {[
                { label:"Antes", items: CORPUS_BASE.antesdurantedespues.antes, color:"bg-blue-50 border-blue-100", icon:"🕐" },
                { label:"Durante", items: CORPUS_BASE.antesdurantedespues.durante, color:"bg-amber-50 border-amber-100", icon:"🩸" },
                { label:"Después", items: CORPUS_BASE.antesdurantedespues.despues, color:"bg-emerald-50 border-emerald-100", icon:"✅" },
              ].map(g => (
                <div key={g.label} className={`rounded-xl border ${g.color} p-4 mb-4`}>
                  <h3 className="font-bold text-slate-700 mb-3 text-sm">{g.icon} {g.label}</h3>
                  <ul className="space-y-2">
                    {g.items.map((item,i) => <li key={i} className="flex gap-2 items-start text-sm text-slate-700"><span className="text-slate-400 shrink-0">›</span>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {active === "medicamentos" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Medicamentos</h2>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mb-4 text-xs text-amber-800">
                ⚠ Los demás se evalúan según la enfermedad prescripta, no por el medicamento. Ver Capas A y C para excepciones clave.
              </div>
              {[
                { label:"Diferimiento permanente", items: CORPUS_BASE.medicamentos.permanente, color:"border-red-200 bg-red-50" },
                { label:"Diferimiento transitorio (una vez suspendido)", items: CORPUS_BASE.medicamentos.transitorio, color:"border-amber-200 bg-amber-50" },
                { label:"Sin diferimiento", items: CORPUS_BASE.medicamentos.sinDiferimiento, color:"border-emerald-200 bg-emerald-50" },
              ].map(g => (
                <div key={g.label} className={`rounded-xl border ${g.color} p-4 mb-4`}>
                  <h3 className="font-bold text-slate-700 mb-3 text-xs">{g.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((item,i) => <span key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-700 shadow-sm">{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {active === "vacunas" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Vacunas</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 mb-4 text-xs text-blue-800">
                Para hepatitis A, hepatitis B y antirrábica el diferimiento depende del contexto. Ver Capa B.
              </div>
              {[
                { label:"Diferir 1 mes — vivas y atenuadas", items: CORPUS_BASE.vacunas.diferir1mes, color:"border-amber-200 bg-amber-50" },
                { label:"Diferir 1 año — solo si hubo mordedura", items: CORPUS_BASE.vacunas.diferir1anio, color:"border-red-200 bg-red-50" },
                { label:"Sin diferimiento (clínicamente bien) — inactivadas, toxoides, recombinantes", items: CORPUS_BASE.vacunas.sinDiferimiento, color:"border-emerald-200 bg-emerald-50" },
              ].map(g => (
                <div key={g.label} className={`rounded-xl border ${g.color} p-4 mb-4`}>
                  <h3 className="font-bold text-slate-700 mb-3 text-xs">{g.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((item,i) => <span key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-700 shadow-sm">{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {active === "diferimientos" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Diferimientos por sistema</h2>
              <div className="flex gap-2 overflow-x-auto sh pb-2 mb-4">
                {DIFF_SYSTEMS.map(s => (
                  <button key={s.key} onClick={() => setDiffSys(s.key)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${diffSys === s.key ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2 text-slate-500 font-semibold w-14">Código</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-semibold w-28">Plazo</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(CORPUS_BASE.diferimientos[diffSys] || []).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-slate-400">{row.codigo}</td>
                        <td className="px-4 py-2"><Badge tipo={row.tipo} /></td>
                        <td className="px-4 py-2 text-slate-700">{row.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === "conductasRiesgo" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Conductas de riesgo</h2>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-slate-600">
                Evaluación individual e independiente del género u orientación sexual. Ver Capa B para oral vs. inyectable.
              </div>
              <div className="grid gap-2">
                {CORPUS_BASE.conductasRiesgo.map((d, i) => (
                  <div key={i} className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm flex gap-3 items-start">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                    <span className="text-sm text-slate-700">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "componentes" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Composición de la sangre y hemocomponentes</h2>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Componentes celulares</h3>
                <ul className="space-y-2">
                  {CORPUS_BASE.componentes.composicion.map((d,i) => <li key={i} className="flex gap-2 items-start text-sm text-slate-700"><span className="text-rose-400 shrink-0">🩸</span>{d}</li>)}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Hemocomponentes — una donación puede salvar hasta 3 vidas</h3>
                <ul className="space-y-2">
                  {CORPUS_BASE.componentes.hemocomponentes.map((d,i) => <li key={i} className="flex gap-2 items-start text-sm text-slate-700"><span className="text-emerald-500 shrink-0">›</span>{d}</li>)}
                </ul>
              </div>
            </div>
          )}

          {active === "cuestionario" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Cuestionario orientativo</h2>
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 mb-4 font-semibold">USO EXCLUSIVO DEL PERSONAL QUE REALIZA LA ENTREVISTA PREDONACIÓN</p>
              <div className="grid gap-2">
                {CORPUS_BASE.cuestionario.map((q, i) => (
                  <div key={i} className={`rounded-xl px-5 py-3 border shadow-sm flex gap-3 items-start ${q.startsWith("SI ES MUJER") ? "bg-pink-50 border-pink-100" : "bg-white border-slate-100"}`}>
                    <span className="text-xs text-slate-400 shrink-0 w-5 mt-0.5">{i+1}.</span>
                    <span className="text-sm text-slate-700">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "glosario" && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Glosario</h2>
              <div className="grid gap-3">
                {CORPUS_BASE.glosario.map((t, i) => (
                  <div key={i} className="bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm">
                    <span className="font-bold text-rose-600 text-sm">{t.termino}</span>
                    <p className="text-sm text-slate-600 mt-1">{t.def}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
