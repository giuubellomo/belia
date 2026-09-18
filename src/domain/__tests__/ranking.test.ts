import { rankear } from '../ranking';
import type { CriterioVictoria, Participante, Partida } from '../types';

/**
 * Arma una partida cuyos participantes terminan con los totales pedidos.
 *
 * Los totales se consiguen con marcas, no con puntaje manual, porque A-2 obliga
 * a que el manual sea siempre positivo y aca hacen falta negativos.
 */
function partidaConTotales(
  criterioVictoria: CriterioVictoria,
  totales: Record<string, number>,
): Partida {
  const participantes: Participante[] = Object.keys(totales).map((id) => ({
    id,
    nombre: id,
    avatarTipo: 'color',
    avatarValor: '#000000',
  }));

  return {
    id: 'g1',
    nombre: 'Partida de prueba',
    estado: 'finalizada',
    plantilla: {
      id: 'p1',
      nombre: 'Prueba',
      icono: 'cartas',
      modoPuntos: 'suma',
      criterioVictoria,
      rondasIlimitadas: false,
      reglas: [],
      rondas: [],
    },
    participantes,
    rondas: [
      {
        numero: 1,
        estado: 'cerrada',
        entradas: participantes.map((p) => ({
          participanteId: p.id,
          puntosManuales: null,
          marcas: { r1: totales[p.id] as number },
        })),
      },
    ],
  };
}

describe('rankear', () => {
  it('criterio menor: gana el total mas bajo', () => {
    const puestos = rankear(
      partidaConTotales('menor', { a: -25, b: -55, c: -10, d: -40 }),
    );

    expect(puestos).toEqual([
      { posicion: 1, participanteId: 'b', total: -55 },
      { posicion: 2, participanteId: 'd', total: -40 },
      { posicion: 3, participanteId: 'a', total: -25 },
      { posicion: 4, participanteId: 'c', total: -10 },
    ]);
  });

  it('criterio mayor: con los mismos totales, el orden se invierte', () => {
    const puestos = rankear(
      partidaConTotales('mayor', { a: -25, b: -55, c: -10, d: -40 }),
    );

    expect(puestos.map((p) => p.participanteId)).toEqual(['c', 'a', 'd', 'b']);
    expect(puestos.map((p) => p.posicion)).toEqual([1, 2, 3, 4]);
  });

  it('empate en el primer puesto da 1, 1, 3: el 2 se saltea (RF-804)', () => {
    const puestos = rankear(
      partidaConTotales('menor', { a: -50, b: -50, c: -20 }),
    );

    expect(puestos.map((p) => p.posicion)).toEqual([1, 1, 3]);
    expect(puestos.map((p) => p.participanteId)).toEqual(['a', 'b', 'c']);
  });

  it('empate en el medio da 1, 2, 2, 4', () => {
    const puestos = rankear(
      partidaConTotales('menor', { a: -50, b: -30, c: -30, d: -10 }),
    );

    expect(puestos.map((p) => p.posicion)).toEqual([1, 2, 2, 4]);
  });

  it('todos empatados comparten el primer puesto', () => {
    const puestos = rankear(partidaConTotales('menor', { a: -10, b: -10, c: -10 }));
    expect(puestos.map((p) => p.posicion)).toEqual([1, 1, 1]);
  });

  it('dos participantes devuelven dos puestos, sin huecos', () => {
    const puestos = rankear(partidaConTotales('menor', { a: -30, b: -10 }));

    expect(puestos).toHaveLength(2);
    expect(puestos.map((p) => p.posicion)).toEqual([1, 2]);
  });

  it('dos participantes empatados comparten el primer puesto', () => {
    const puestos = rankear(partidaConTotales('menor', { a: -30, b: -30 }));
    expect(puestos.map((p) => p.posicion)).toEqual([1, 1]);
  });

  it('devuelve un puesto por participante y no pierde a nadie', () => {
    const puestos = rankear(
      partidaConTotales('mayor', { a: 10, b: 20, c: 20, d: 5, e: 0 }),
    );

    expect(puestos).toHaveLength(5);
    expect([...puestos].map((p) => p.participanteId).sort()).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
  });

  it('entre empatados respeta el orden de participantes de la partida', () => {
    const puestos = rankear(partidaConTotales('menor', { c: -10, a: -10, b: -10 }));
    expect(puestos.map((p) => p.participanteId)).toEqual(['c', 'a', 'b']);
  });

  it('no muta la partida que recibe', () => {
    const juego = partidaConTotales('menor', { a: -10, b: -50 });
    const ordenOriginal = juego.participantes.map((p) => p.id);

    rankear(juego);

    expect(juego.participantes.map((p) => p.id)).toEqual(ordenOriginal);
  });
});
