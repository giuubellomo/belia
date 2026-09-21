/**
 * Tokens del sistema de diseño (paso 3.1).
 *
 * El mockup es monocromo a proposito. Si mas adelante entra color, entra aca y en
 * ningun otro lado: ningun componente escribe un color, un tamaño o un radio suelto.
 *
 * Colores, radios y el area tocable minima salen del mockup. La tipografia y el
 * espaciado son provisionales: el plan no los fija y se ajustan mirando los
 * componentes en el telefono (paso 3.2).
 */
import type { TextStyle } from 'react-native';

export const colores = {
  tinta: '#1C1C1E',
  grisMedio: '#9A9AA0',
  linea: '#D8D8DC',
  superficie: '#F2F2F4',
  fondo: '#FFFFFF',
} as const;

/** Los cinco radios del mockup. Cual va en cada componente se decide en el 3.2. */
export const radios = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
} as const;

/** Escala de 4. Provisional. */
export const espacios = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** RNF-3: ningun area tocable por debajo de esto, ni de alto ni de ancho. */
export const AREA_TOCABLE_MINIMA = 44;

/**
 * Tipografia del sistema: sin fuentes propias, y respetando el tamaño que la
 * usuaria elige en el telefono (RNF-7), asi que ningun texto desactiva el escalado.
 * Tamaños provisionales.
 */
export const tipografia = {
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  cuerpo: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  cuerpoFuerte: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  secundario: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  chico: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

/**
 * RNF-4: todo puntaje va con numerales tabulares, para que las columnas no
 * bailen cuando cambia un digito. Se suma al estilo de texto que corresponda.
 */
export const numerales: TextStyle = { fontVariant: ['tabular-nums'] };
