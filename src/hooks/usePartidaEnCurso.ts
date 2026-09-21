import type { Partida } from '@/domain/types';
import * as partidas from '@/repositories/partidas';

import { mutar, useConsulta } from './useConsulta';

/** La partida en curso (A-5), o null si no hay. Es lo que consulta el Home (4.2). */
export function usePartidaEnCurso(): {
  partida: Partida | null;
  cargando: boolean;
  error: unknown;
  mutar: typeof mutar;
} {
  const { datos, cargando, error } = useConsulta(() => partidas.obtenerEnCurso(), 'partida-en-curso');
  return { partida: datos ?? null, cargando, error, mutar };
}
