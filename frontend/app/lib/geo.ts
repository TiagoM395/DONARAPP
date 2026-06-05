import centrosDatos from './centros_donacion.json';
import localidadesDatos from './localidades_ba.json';

export interface CentroDonacion {
  id: number;
  ciudad: string;
  centro_donacion: string;
  direccion: string;
  partido: string;
  provincia: string;
  region_sanitaria: string | null;
  telefono: string;
  horarios: string;
  zona: string;
  tags: string;
  latitud: number | null;
  longitud: number | null;
  ultima_actualizacion: string;
  distancia?: number; // Se calcula dinámicamente según el usuario
}

export interface Localidad {
  nombre: string;
  latitud: number;
  longitud: number;
}

// Fórmula de Haversine para calcular distancia en km entre 2 puntos geográficos
export function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buscarCentro(ciudadIngresada: string): { tipo: 'exacto' | 'cercanos' | 'error', centros: CentroDonacion[], mensaje?: string } {
  const centros = centrosDatos as CentroDonacion[];
  const localidades = localidadesDatos as Localidad[];
  const ciudadLimpia = ciudadIngresada.trim().toLowerCase();

  // 1. Búsqueda por coincidencia exacta de texto en centros_donacion.json
  const centrosEnCiudad = centros.filter(c => c.ciudad.toLowerCase() === ciudadLimpia);
  if (centrosEnCiudad.length > 0) {
    return { tipo: 'exacto', centros: centrosEnCiudad };
  }

  // 2. Si no hay posta, buscamos la localidad en localidades_ba.json
  const localidadEncontrada = localidades.find(l => l.nombre.toLowerCase() === ciudadLimpia);
  
  if (!localidadEncontrada) {
    return { 
      tipo: 'error', 
      centros: [], 
      mensaje: `No pudimos encontrar la localidad "${ciudadIngresada}". Verificá cómo está escrita.` 
    };
  }

  // 3. Calculamos la distancia desde el pueblo del usuario a TODOS los centros de donación con coordenadas
  const centrosConDistancia = centros
    .filter(c => c.latitud !== null && c.longitud !== null)
    .map(c => {
      const distancia = calcularDistanciaKm(
        localidadEncontrada.latitud, 
        localidadEncontrada.longitud, 
        c.latitud!, 
        c.longitud!
      );
      return { ...c, distancia };
    });

  // 4. Ordenamos de menor a mayor distancia y devolvemos los 3 más cercanos
  centrosConDistancia.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
  const centrosMasCercanos = centrosConDistancia.slice(0, 3);

  return { tipo: 'cercanos', centros: centrosMasCercanos };
}