import {
  desmarcarRegla,
  marcarRegla,
  puedeCerrarRonda,
  puntajeDeReglaEnRonda,
  reglasSinAsignar,
  todosCargaron,
} from '../rondas';
import type {
  EntradaRonda,
  Participante,
  Plantilla,
  Regla,
  RondaJugada,
} from '../types';

// --- ayudantes de armado -------------------------------------------------

function regla(id: string, extra: Partial<Regla> = {}): Regla {
  return {
    id,
    titulo: id,
    puntajeBase: -10,
    alcance: 'todas',
    asignacionUnica: true,
    orden: 1,
    ...extra,
  };
}

function participante(id: string): Participante {
  return { id, nombre: id, avatarTipo: 'color', avatarValor: '#000000' };
}

function entrada(
  participanteId: string,
  puntosManuales: number | null = null,
  marcas: Record<string, number> = {},
): EntradaRonda {
  return { participanteId, puntosManuales, marcas };
}

function plantilla(extra: Partial<Plantilla> = {}): Plantilla {
  return {
    id: 'p1',
    nombre: 'Prueba',
    icono: 'cartas',
    modoPuntos: 'suma',
    criterioVictoria: 'menor',
    rondasIlimitadas: false,
    reglas: [regla('bajo'), regla('corto')],
    rondas: [
      { numero: 1, objetivo: '2 piernas', ajustes: { bajo: -10 } },
      { numero: 2, objetivo: '1 pierna + 1 escalera', ajustes: { bajo: -20, corto: -20 } },
    ],
    ...extra,
  };
}

function ronda(numero: number, entradas: EntradaRonda[]): RondaJugada {
  return { numero, estado: 'en_curso', entradas };
}

// --- puntajeDeReglaEnRonda (RF-503) --------------------------------------

describe('puntajeDeReglaEnRonda', () => {
  it('devuelve el ajuste de la ronda cuando existe', () => {
    expect(puntajeDeReglaEnRonda(plantilla(), 2, 'bajo')).toBe(-20);
  });

  it('devuelve el puntaje base cuando esa ronda no ajusta esa regla', () => {
    // La ronda 1 solo ajusta `bajo`; `corto` cae al base.
    expect(puntajeDeReglaEnRonda(plantilla(), 1, 'corto')).toBe(-10);
  });

  it('devuelve el base cuando la ronda no esta definida (plantilla de rondas ilimitadas)', () => {
    expect(puntajeDeReglaEnRonda(plantilla({ rondas: [] }), 7, 'bajo')).toBe(-10);
  });

  it('rompe si la regla no existe en la plantilla, en vez de devolver 0', () => {
    expect(() => puntajeDeReglaEnRonda(plantilla(), 1, 'fantasma')).toThrow();
  });
});

// --- todosCargaron (RF-707) ----------------------------------------------

describe('todosCargaron', () => {
  it('es true cuando todos tienen puntaje', () => {
    const r = ronda(1, [entrada('a', 25), entrada('b', 0)]);
    expect(todosCargaron(r, [participante('a'), participante('b')])).toBe(true);
  });

  it('es false cuando alguien tiene puntosManuales en null', () => {
    const r = ronda(1, [entrada('a', 25), entrada('b', null)]);
    expect(todosCargaron(r, [participante('a'), participante('b')])).toBe(false);
  });

  it('es false cuando a alguien le falta la entrada entera', () => {
    const r = ronda(1, [entrada('a', 25)]);
    expect(todosCargaron(r, [participante('a'), participante('b')])).toBe(false);
  });

  it('un puntaje de 0 cuenta como cargado', () => {
    const r = ronda(1, [entrada('a', 0)]);
    expect(todosCargaron(r, [participante('a')])).toBe(true);
  });
});

// --- reglasSinAsignar (RF-706) -------------------------------------------

describe('reglasSinAsignar', () => {
  it('nombra las reglas de alcance todas que nadie tiene', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30)]);
    expect(reglasSinAsignar(r, plantilla()).map((x) => x.id)).toEqual(['corto']);
  });

  it('no devuelve nada cuando estan todas asignadas', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30, { corto: -10 })]);
    expect(reglasSinAsignar(r, plantilla())).toEqual([]);
  });

  it('ignora las reglas de alcance opcional', () => {
    const p = plantilla({ reglas: [regla('bonus', { alcance: 'opcional' })] });
    const r = ronda(1, [entrada('a', 25)]);
    expect(reglasSinAsignar(r, p)).toEqual([]);
  });
});

// --- puedeCerrarRonda (RF-706 + RF-707) ----------------------------------

describe('puedeCerrarRonda', () => {
  const participantes = [participante('a'), participante('b')];

  it('con un participante sin puntaje devuelve faltan_puntajes', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10, corto: -10 }), entrada('b', null)]);
    expect(puedeCerrarRonda(r, plantilla(), participantes)).toEqual({
      puede: false,
      motivo: 'faltan_puntajes',
    });
  });

  it('con todos cargados pero una regla todas sin asignar devuelve faltan_reglas y la nombra', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30)]);
    const resultado = puedeCerrarRonda(r, plantilla(), participantes);

    expect(resultado.puede).toBe(false);
    if (resultado.puede) throw new Error('deberia poder cerrar');
    expect(resultado.motivo).toBe('faltan_reglas');
    expect(resultado.reglas?.map((x) => x.id)).toEqual(['corto']);
  });

  it('una regla opcional sin marcar no bloquea', () => {
    const p = plantilla({
      reglas: [regla('bajo'), regla('bonus', { alcance: 'opcional' })],
    });
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30)]);

    expect(puedeCerrarRonda(r, p, participantes)).toEqual({ puede: true });
  });

  it('con todo en orden se puede cerrar', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30, { corto: -10 })]);
    expect(puedeCerrarRonda(r, plantilla(), participantes)).toEqual({ puede: true });
  });

  it('los puntajes se revisan antes que las reglas', () => {
    // Falta todo: el motivo tiene que ser faltan_puntajes, no faltan_reglas.
    const r = ronda(1, [entrada('a', null), entrada('b', null)]);
    const resultado = puedeCerrarRonda(r, plantilla(), participantes);
    expect(resultado).toEqual({ puede: false, motivo: 'faltan_puntajes' });
  });
});

// --- marcarRegla (RF-406, C-4) -------------------------------------------

describe('marcarRegla', () => {
  it('con asignacionUnica deja exactamente una marca de esa regla en toda la ronda', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30)]);
    const resultado = marcarRegla(r, plantilla(), 'bajo', 'b');

    const conLaMarca = resultado.entradas.filter((e) => 'bajo' in e.marcas);
    expect(conLaMarca).toHaveLength(1);
    expect(conLaMarca[0]?.participanteId).toBe('b');
  });

  it('con asignacionUnica false permite dos participantes marcados', () => {
    const p = plantilla({ reglas: [regla('bonus', { asignacionUnica: false })] });
    const r = ronda(1, [entrada('a', 25, { bonus: -10 }), entrada('b', 30)]);
    const resultado = marcarRegla(r, p, 'bonus', 'b');

    expect(resultado.entradas.filter((e) => 'bonus' in e.marcas)).toHaveLength(2);
  });

  it('congela el puntaje que la regla vale en ESA ronda, no el base (C-4)', () => {
    const r = ronda(2, [entrada('a', 25)]);
    const resultado = marcarRegla(r, plantilla(), 'bajo', 'a');

    expect(resultado.entradas[0]?.marcas['bajo']).toBe(-20);
  });

  it('es pura: no muta la ronda que recibe', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 }), entrada('b', 30)]);
    const copia = JSON.parse(JSON.stringify(r)) as RondaJugada;

    marcarRegla(r, plantilla(), 'bajo', 'b');

    expect(r).toEqual(copia);
  });

  it('no toca los puntajes manuales ni las demas marcas', () => {
    const r = ronda(1, [entrada('a', 25, { corto: -10 }), entrada('b', 30)]);
    const resultado = marcarRegla(r, plantilla(), 'bajo', 'b');

    expect(resultado.entradas[0]?.puntosManuales).toBe(25);
    expect(resultado.entradas[0]?.marcas).toEqual({ corto: -10 });
    expect(resultado.entradas[1]?.puntosManuales).toBe(30);
  });

  it('crea la entrada si el participante todavia no tiene, con puntaje en null', () => {
    const r = ronda(1, [entrada('a', 25)]);
    const resultado = marcarRegla(r, plantilla(), 'bajo', 'b');

    const nueva = resultado.entradas.find((e) => e.participanteId === 'b');
    expect(nueva).toEqual({ participanteId: 'b', puntosManuales: null, marcas: { bajo: -10 } });
  });

  it('remarcar al mismo participante es idempotente', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 })]);
    const resultado = marcarRegla(r, plantilla(), 'bajo', 'a');

    expect(resultado.entradas[0]?.marcas).toEqual({ bajo: -10 });
  });

  it('rompe si la regla no existe en la plantilla', () => {
    const r = ronda(1, [entrada('a', 25)]);
    expect(() => marcarRegla(r, plantilla(), 'fantasma', 'a')).toThrow();
  });
});

// --- desmarcarRegla ------------------------------------------------------

describe('desmarcarRegla', () => {
  it('saca esa marca y deja intactos los puntajes manuales y las demas marcas', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10, corto: -10 }), entrada('b', 30)]);
    const resultado = desmarcarRegla(r, 'bajo', 'a');

    expect(resultado.entradas[0]?.marcas).toEqual({ corto: -10 });
    expect(resultado.entradas[0]?.puntosManuales).toBe(25);
    expect(resultado.entradas[1]).toEqual(entrada('b', 30));
  });

  it('sobre una regla que no estaba marcada devuelve una ronda equivalente, sin romper', () => {
    const r = ronda(1, [entrada('a', 25, { corto: -10 })]);
    expect(desmarcarRegla(r, 'bajo', 'a')).toEqual(r);
  });

  it('sobre un participante que no esta en la ronda no rompe', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 })]);
    expect(desmarcarRegla(r, 'bajo', 'z')).toEqual(r);
  });

  it('solo desmarca al participante pedido', () => {
    const p = plantilla({ reglas: [regla('bonus', { asignacionUnica: false })] });
    const r = ronda(1, [entrada('a', 25, { bonus: -10 }), entrada('b', 30, { bonus: -10 })]);
    const resultado = desmarcarRegla(r, 'bonus', 'a');

    expect(resultado.entradas[0]?.marcas).toEqual({});
    expect(resultado.entradas[1]?.marcas).toEqual({ bonus: -10 });
    expect(p.reglas).toHaveLength(1);
  });

  it('es pura: no muta la ronda que recibe', () => {
    const r = ronda(1, [entrada('a', 25, { bajo: -10 })]);
    const copia = JSON.parse(JSON.stringify(r)) as RondaJugada;

    desmarcarRegla(r, 'bajo', 'a');

    expect(r).toEqual(copia);
  });

  it('marcar y desmarcar vuelve al estado original (el tilde es un toggle)', () => {
    const r = ronda(1, [entrada('a', 25), entrada('b', 30)]);
    const ida = marcarRegla(r, plantilla(), 'bajo', 'a');
    const vuelta = desmarcarRegla(ida, 'bajo', 'a');

    expect(vuelta).toEqual(r);
  });
});
