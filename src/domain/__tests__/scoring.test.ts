import { puntajeDeRonda, totalDeParticipante, totalesDePartida } from '../scoring';
import type {
  EntradaRonda,
  ModoPuntos,
  Participante,
  Partida,
  Plantilla,
  RondaJugada,
} from '../types';

// --- ayudantes de armado -------------------------------------------------

function entrada(
  participanteId: string,
  puntosManuales: number | null,
  marcas: Record<string, number> = {},
): EntradaRonda {
  return { participanteId, puntosManuales, marcas };
}

function participante(id: string, nombre = id): Participante {
  return { id, nombre, avatarTipo: 'color', avatarValor: '#000000' };
}

function plantilla(modoPuntos: ModoPuntos): Plantilla {
  return {
    id: 'p1',
    nombre: 'Prueba',
    icono: 'cartas',
    modoPuntos,
    criterioVictoria: 'menor',
    rondasIlimitadas: false,
    reglas: [],
    rondas: [],
  };
}

function partida(
  modoPuntos: ModoPuntos,
  participantes: Participante[],
  rondas: RondaJugada[],
): Partida {
  return {
    id: 'g1',
    nombre: 'Partida de prueba',
    estado: 'en_curso',
    plantilla: plantilla(modoPuntos),
    participantes,
    rondas,
  };
}

// --- puntajeDeRonda (C-1, A-2) -------------------------------------------

describe('puntajeDeRonda', () => {
  it('modo suma: 25 puntos manuales, sin marcas', () => {
    expect(puntajeDeRonda(entrada('a', 25), 'suma')).toBe(25);
  });

  it('modo resta: 25 puntos manuales, sin marcas', () => {
    expect(puntajeDeRonda(entrada('a', 25), 'resta')).toBe(-25);
  });

  it('modo suma: 25 manuales mas una marca de -20', () => {
    expect(puntajeDeRonda(entrada('a', 25, { r1: -20 }), 'suma')).toBe(5);
  });

  it('modo resta: 25 manuales mas una marca de -20 dan -45, porque el signo de la marca no se invierte (A-2)', () => {
    // `modo` manda sobre el puntaje manual y sobre nada mas: 25 -> -25, y la
    // marca entra tal como se congelo. Si alguna vez esto da -5, alguien
    // "arreglo" el signo de las marcas y rompio C-4.
    expect(puntajeDeRonda(entrada('a', 25, { r1: -20 }), 'resta')).toBe(-45);
  });

  it('puntosManuales null cuenta como 0 y deja pasar la marca', () => {
    expect(puntajeDeRonda(entrada('a', null, { r1: -20 }), 'suma')).toBe(-20);
    expect(puntajeDeRonda(entrada('a', null, { r1: -20 }), 'resta')).toBe(-20);
  });

  it('sin puntaje ni marcas da 0 positivo, no -0', () => {
    // -0 !== 0 para Object.is, que es lo que usa toBe: si se escapara un -0,
    // los tests del podio fallarian por una razon incomprensible.
    const resultado = puntajeDeRonda(entrada('a', null), 'resta');
    expect(Object.is(resultado, 0)).toBe(true);
  });

  it('suma varias marcas de la misma ronda', () => {
    expect(puntajeDeRonda(entrada('a', 10, { r1: -20, r2: -30 }), 'suma')).toBe(-40);
  });
});

// --- totalDeParticipante (C-2) -------------------------------------------

describe('totalDeParticipante', () => {
  it('suma las tres rondas, incluida la que esta en curso', () => {
    const juego = partida('suma', [participante('a')], [
      { numero: 1, estado: 'cerrada', entradas: [entrada('a', 25)] },
      { numero: 2, estado: 'cerrada', entradas: [entrada('a', 30, { r1: -20 })] },
      { numero: 3, estado: 'en_curso', entradas: [entrada('a', 15)] },
    ]);
    expect(totalDeParticipante(juego, 'a')).toBe(50);
  });

  it('ignora las rondas donde el participante no tiene entrada', () => {
    const juego = partida('suma', [participante('a'), participante('b')], [
      { numero: 1, estado: 'cerrada', entradas: [entrada('a', 25), entrada('b', 10)] },
      { numero: 2, estado: 'en_curso', entradas: [entrada('a', 5)] },
    ]);
    expect(totalDeParticipante(juego, 'b')).toBe(10);
  });

  it('usa el modo de la plantilla congelada en la partida', () => {
    const juego = partida('resta', [participante('a')], [
      { numero: 1, estado: 'cerrada', entradas: [entrada('a', 25)] },
    ]);
    expect(totalDeParticipante(juego, 'a')).toBe(-25);
  });
});

// --- totalesDePartida ----------------------------------------------------

describe('totalesDePartida', () => {
  it('devuelve un total por participante, incluidos los que no cargaron nada', () => {
    const juego = partida(
      'suma',
      [participante('a'), participante('b'), participante('c')],
      [
        {
          numero: 1,
          estado: 'en_curso',
          entradas: [entrada('a', 25), entrada('b', null, { r1: -10 })],
        },
      ],
    );

    expect(totalesDePartida(juego)).toEqual([
      { participanteId: 'a', total: 25 },
      { participanteId: 'b', total: -10 },
      { participanteId: 'c', total: 0 },
    ]);
  });

  it('respeta el orden de participantes de la partida', () => {
    const juego = partida('suma', [participante('c'), participante('a')], []);
    expect(totalesDePartida(juego).map((t) => t.participanteId)).toEqual(['c', 'a']);
  });
});
