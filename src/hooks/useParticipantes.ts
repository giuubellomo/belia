import type { Participante } from '@/domain/types';
import * as participantes from '@/repositories/participantes';

import { mutar, useConsulta } from './useConsulta';

/** Los participantes activos, el dueño primero. */
export function useParticipantes(): {
  participantes: Participante[];
  cargando: boolean;
  error: unknown;
  mutar: typeof mutar;
} {
  const { datos, cargando, error } = useConsulta(() => participantes.listar(), 'participantes');
  return { participantes: datos ?? [], cargando, error, mutar };
}
