import type { Participante } from '@/domain/types';
import * as participantes from '@/repositories/participantes';

import { mutar, useConsulta } from './useConsulta';

/** El dueño del dispositivo (RF-205), o null si todavia no se dio de alta. */
export function useDueno(): {
  dueno: Participante | null;
  cargando: boolean;
  error: unknown;
  mutar: typeof mutar;
} {
  const { datos, cargando, error } = useConsulta(() => participantes.obtenerDueno(), 'dueno');
  return { dueno: datos ?? null, cargando, error, mutar };
}
