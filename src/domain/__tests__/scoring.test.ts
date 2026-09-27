import { REGLA_CORTO } from '../rondas';
import {
  mejoresDeRonda,
  puntajeCargado,
  puntajeDeRonda,
  totalDeParticipante,
  totalesDePartida,
  totalHastaRonda,
} from '../scoring';
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

// --- mejoresDeRonda ------------------------------------------------------

describe('mejoresDeRonda', () => {
  function ronda(entradas: EntradaRonda[]): RondaJugada {
    return { numero: 1, estado: 'cerrada', entradas };
  }

  it('con criterio mayor gana el puntaje mas alto', () => {
    const simple = { ...plantilla('suma'), criterioVictoria: 'mayor' as const };
    const r = ronda([entrada('a', 10), entrada('b', 30), entrada('c', 5)]);
    expect(mejoresDeRonda(r, simple)).toEqual({ participanteIds: ['b'], puntaje: 30 });
  });

  it('con criterio menor gana el mas bajo, con el signo de modo y las marcas', () => {
    // resta: a = -10 - 20 = -30, b = -5
    const r = ronda([entrada('a', 10, { corto: -20 }), entrada('b', 5)]);
    expect(mejoresDeRonda(r, plantilla('resta'))).toEqual({ participanteIds: ['a'], puntaje: -30 });
  });

  it('si empatan vienen todos, en el orden de la ronda', () => {
    const simple = { ...plantilla('suma'), criterioVictoria: 'mayor' as const };
    const r = ronda([entrada('a', 20), entrada('b', 5), entrada('c', 20)]);
    expect(mejoresDeRonda(r, simple)).toEqual({ participanteIds: ['a', 'c'], puntaje: 20 });
  });

  it('sin entradas devuelve null', () => {
    expect(mejoresDeRonda(ronda([]), plantilla('suma'))).toBeNull();
  });
});

describe('puntajeCargado', () => {
  const r: RondaJugada = {
    numero: 2,
    estado: 'en_curso',
    entradas: [entrada('a', 10, { corto: -20 }), entrada('b', null, { bajo: -20 })],
  };

  it('con puntaje manual devuelve el de la ronda, con el signo de modo y las marcas', () => {
    expect(puntajeCargado(r, plantilla('resta'), 'a')).toBe(-30);
  });

  it('con una marca pero sin puntaje manual todavia no cargo', () => {
    expect(puntajeCargado(r, plantilla('resta'), 'b')).toBeNull();
  });

  it('sin entrada todavia no cargo', () => {
    expect(puntajeCargado(r, plantilla('resta'), 'c')).toBeNull();
  });

  it('en una ronda con la Cortó de Karioka, el 0 de quien no corto se ve vacio', () => {
    const karioka = {
      ...plantilla('resta'),
      reglas: [{ id: REGLA_CORTO, titulo: 'Cortó', puntajeBase: -10, alcance: 'todas' as const, asignacionUnica: true, orden: 0 }],
    };
    const conCorte = { ...r, entradas: [entrada('a', 0, { [REGLA_CORTO]: -10 }), entrada('b', 0)] };
    expect(puntajeCargado(conCorte, karioka, 'a')).toBe(-10);
    expect(puntajeCargado(conCorte, karioka, 'b')).toBeNull();
  });

  it('un cero cargado es un puntaje, no un vacio', () => {
    expect(puntajeCargado({ ...r, entradas: [entrada('a', 0)] }, plantilla('suma'), 'a')).toBe(0);
  });
});

describe('totalHastaRonda', () => {
  const r = (numero: number, entradas: EntradaRonda[]): RondaJugada => ({ numero, estado: 'cerrada', entradas });
  const p = partida('suma', [participante('a')], [r(1, [entrada('a', 10)]), r(2, [entrada('a', 5)]), r(3, [entrada('a', 1)])]);

  it('suma esa ronda y las anteriores', () => {
    expect(totalHastaRonda(p, 'a', 2)).toBe(15);
  });

  it('en la ultima es el total de la partida', () => {
    expect(totalHastaRonda(p, 'a', 3)).toBe(totalDeParticipante(p, 'a'));
  });
});
