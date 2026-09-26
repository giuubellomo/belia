import { LARGO_MAXIMO_NOMBRE_PARTIDA, nombreDePartida } from '../partidas';

describe('nombreDePartida', () => {
  it('saca los espacios de los costados', () => {
    expect(nombreDePartida('  Viernes de juegos ')).toBe('Viernes de juegos');
  });

  it('vacio o solo espacios es null', () => {
    expect(nombreDePartida('')).toBeNull();
    expect(nombreDePartida('   ')).toBeNull();
  });

  it('corta en el largo maximo sin dejar un espacio al final', () => {
    const largo = `${'a'.repeat(LARGO_MAXIMO_NOMBRE_PARTIDA - 1)} bcd`;
    expect(nombreDePartida(largo)).toBe('a'.repeat(LARGO_MAXIMO_NOMBRE_PARTIDA - 1));
  });
});
