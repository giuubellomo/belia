/**
 * Turno para abrir la base (fase 10, cambio 87). En el telefono hay una sola
 * app abierta a la vez: el turno siempre esta libre. La version web esta en
 * `turno.web.ts`.
 */
export async function esperarTurno(): Promise<boolean> {
  return true;
}
