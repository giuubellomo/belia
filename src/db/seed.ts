/**
 * Semilla de plantillas predefinidas (paso 2.4, RF-301).
 *
 * Los ids son fijos: asi `asegurarPredefinidas` reconoce las que ya estan y no
 * las duplica, y una predefinida nueva en un build futuro entra sola en el
 * proximo arranque. Estos ids no se cambian nunca.
 *
 * Nombres y titulos son datos de la plantilla, no textos de interfaz: se guardan
 * en la base y la usuaria los ve igual en la copia que haga.
 *
 * `icono` es una clave. El set de iconos lo define el sistema de diseño (fase 3).
 */
import type { Plantilla } from '@/domain/types';
import { asegurarPredefinidas } from '@/repositories/plantillas';

const BAJO_PRIMERO = '583c88cf-c86e-4275-99d9-fbf12121350d';
const CORTO = '841a8dd9-f409-4553-9826-79e0ea157cfc';
const PUNTAJE_BASE = -10;

/** A-1 (provisional): el objetivo de cada ronda y lo que valen Bajó primero y Cortó. */
const RONDAS_KARIOKA: Array<[objetivo: string, puntaje: number]> = [
  ['2 piernas', -10],
  ['1 pierna + 1 escalera', -20],
  ['2 escaleras', -30],
  ['3 piernas', -40],
  ['2 piernas + 1 escalera', -50],
  ['1 pierna + 2 escaleras', -60],
  ['3 escaleras', -70],
];

export const KARIOKA: Plantilla = {
  id: 'ef056daf-4cba-4370-81b9-0568005c3bcb',
  nombre: 'Karioka',
  icono: 'cartas',
  modoPuntos: 'suma',
  criterioVictoria: 'menor',
  rondasIlimitadas: false,
  reglas: [
    { id: BAJO_PRIMERO, titulo: 'Bajó primero', puntajeBase: PUNTAJE_BASE, alcance: 'todas', asignacionUnica: true, orden: 0 },
    { id: CORTO, titulo: 'Cortó', puntajeBase: PUNTAJE_BASE, alcance: 'todas', asignacionUnica: true, orden: 1 },
  ],
  rondas: RONDAS_KARIOKA.map(([objetivo, puntaje], i) => {
    // Como en el editor (5.4): solo se guarda ajuste si difiere del base. La ronda 1
    // vale -10, igual que el base, y no tiene que aparecer como ajustada.
    const ajustes: Record<string, number> =
      puntaje === PUNTAJE_BASE ? {} : { [BAJO_PRIMERO]: puntaje, [CORTO]: puntaje };
    return { numero: i + 1, objetivo, ajustes };
  }),
};

export const SIMPLE: Plantilla = {
  id: '0391b4e3-e991-431c-ac4f-df61b13d62ee',
  nombre: 'Simple',
  icono: 'numeral',
  modoPuntos: 'suma',
  criterioVictoria: 'mayor',
  rondasIlimitadas: true,
  reglas: [],
  rondas: [],
};

export const PLANTILLAS_PREDEFINIDAS: Plantilla[] = [KARIOKA, SIMPLE];

/** Corre en cada arranque; solo inserta la primera vez. Devuelve cuantas inserto. */
export function sembrar(): Promise<number> {
  return asegurarPredefinidas(PLANTILLAS_PREDEFINIDAS);
}
