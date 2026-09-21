import type { Partida } from '@/domain/types';
import * as partidas from '@/repositories/partidas';

import { mutar, useConsulta } from './useConsulta';

/** La Partida completa y un mutar() que escribe y recarga. `partida` es null si no existe. */
export function usePartida(id: string): {
  partida: Partida | null;
  cargando: boolean;
  error: unknown;
  mutar: typeof mutar;
} {
  const { datos, cargando, error } = useConsulta(() => partidas.obtener(id), `partida:${id}`);
  return { partida: datos ?? null, cargando, error, mutar };
}
