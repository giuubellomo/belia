/**
 * Tokens del sistema de diseño (paso 3.1).
 *
 * El mockup es monocromo a proposito. Si mas adelante entra color, entra aca y en
 * ningun otro lado: ningun componente escribe un color, un tamaño o un radio suelto.
 *
 * Colores, radios y el area tocable minima salen del mockup. La tipografia y el
 * espaciado se tomaron de las capturas del mockup en el paso 3.2 (docs/mockup/) y se
 * ajustan mirando los componentes en el telefono.
 */
import type { TextStyle } from 'react-native';

export const colores = {
  tinta: '#1C1C1E',
  /** Solo aparece como color de avatar, entre la tinta y el gris medio. */
  grisOscuro: '#636366',
  grisMedio: '#9A9AA0',
  linea: '#D8D8DC',
  superficie: '#F2F2F4',
  fondo: '#FFFFFF',
  /** Lo que oscurece la pantalla detras de un popup o un bottom sheet. */
  velo: 'rgba(28, 28, 30, 0.45)',
} as const;

/** Los cinco radios del mockup. */
export const radios = {
  /** casillas de puntaje, tilde */
  xs: 10,
  /** campos de texto, segmented */
  sm: 12,
  /** botones */
  md: 14,
  /** cards */
  lg: 16,
  /** popup y bottom sheet */
  xl: 18,
} as const;

/** Colores que se pueden elegir para un avatar (RF-201), de oscuro a claro. */
export const COLORES_AVATAR = [colores.tinta, colores.grisOscuro, colores.grisMedio, colores.linea] as const;

/** Escala de 4. */
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
 * Unica excepcion: un glifo dentro de un circulo de tamaño fijo (avatar, boton de
 * icono), que si crece se sale del circulo.
 */
export const tipografia = {
  /** «BELIA» en el Home. */
  marca: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: 2 },
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  tituloChico: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  cuerpo: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  cuerpoFuerte: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  secundario: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  chico: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  /** Titulos de seccion: «TIPO DE JUEGO», «NOMBRE». Las mayusculas las pone el estilo. */
  etiqueta: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  boton: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  /** El numero del stepper grande, en el popup de carga. */
  numeroGrande: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
} as const satisfies Record<string, TextStyle>;

/**
 * RNF-4: todo puntaje va con numerales tabulares, para que las columnas no
 * bailen cuando cambia un digito. Se suma al estilo de texto que corresponda.
 */
export const numerales: TextStyle = { fontVariant: ['tabular-nums'] };
