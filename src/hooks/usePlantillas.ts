import * as plantillas from '@/repositories/plantillas';
import type { PlantillaGuardada } from '@/repositories/plantillas';

import { mutar, useConsulta } from './useConsulta';

/** Todas las plantillas, predefinidas primero. */
export function usePlantillas(): {
  plantillas: PlantillaGuardada[];
  cargando: boolean;
  error: unknown;
  mutar: typeof mutar;
} {
  const { datos, cargando, error } = useConsulta(() => plantillas.listar(), 'plantillas');
  return { plantillas: datos ?? [], cargando, error, mutar };
}
