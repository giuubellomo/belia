import { LARGO_MAXIMO_NOMBRE, normalizarNombre, validarNombre } from '../participantes';

describe('validarNombre (RF-202)', () => {
  test('un nombre comun pasa', () => {
    expect(validarNombre('Ana', ['Beto'])).toBeNull();
  });

  test('vacio o solo espacios es obligatorio', () => {
    expect(validarNombre('', [])).toBe('vacio');
    expect(validarNombre('   ', [])).toBe('vacio');
  });

  test('el maximo son 20 caracteres, sin contar los espacios de los costados', () => {
    const veinte = 'a'.repeat(LARGO_MAXIMO_NOMBRE);
    expect(validarNombre(veinte, [])).toBeNull();
    expect(validarNombre(`  ${veinte}  `, [])).toBeNull();
    expect(validarNombre(`${veinte}a`, [])).toBe('largo');
  });

  test('cuenta caracteres reales, no unidades UTF-16', () => {
    expect(validarNombre('😀'.repeat(LARGO_MAXIMO_NOMBRE), [])).toBeNull();
  });

  test('no se repite entre activos, sin importar mayusculas ni espacios', () => {
    expect(validarNombre('ana', ['Ana'])).toBe('repetido');
    expect(validarNombre(' Ana  ', ['ana'])).toBe('repetido');
    expect(validarNombre('Ana María', ['ana   maría'])).toBe('repetido');
  });

  test('sin el propio nombre en la lista, editar sin cambiarlo no choca', () => {
    expect(validarNombre('Ana', [])).toBeNull();
  });
});

describe('normalizarNombre', () => {
  test('saca espacios de los costados y junta los del medio', () => {
    expect(normalizarNombre('  Ana   María ')).toBe('Ana María');
  });
});
