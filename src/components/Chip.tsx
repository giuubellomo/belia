import { StyleSheet, Text, View } from 'react-native';

import { colores, espacios, numerales, tipografia } from '@/theme/tokens';

interface Props {
  texto: string;
  /** El puntaje, en negrita a la derecha del texto. */
  valor?: string;
  /** ● regla de todas las rondas, ○ regla opcional. */
  punto?: 'lleno' | 'vacio';
  /** relleno: fondo gris (reglas). borde: fondo blanco con borde (opcionales, «EN JUEGO»). */
  variante?: 'relleno' | 'borde';
}

export function Chip({ texto, valor, punto, variante = 'relleno' }: Props) {
  return (
    <View style={[styles.base, variante === 'relleno' ? styles.relleno : styles.borde]}>
      {punto !== undefined && <View style={[styles.punto, punto === 'vacio' && styles.puntoVacio]} />}
      <Text style={styles.texto}>{texto}</Text>
      {valor !== undefined && <Text style={[styles.valor, numerales]}>{valor}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacios.xxs + 2,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xxs + 2,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  relleno: { backgroundColor: colores.superficie, borderColor: colores.superficie },
  borde: { backgroundColor: colores.fondo, borderColor: colores.linea },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.tinta },
  puntoVacio: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colores.grisMedio },
  texto: { ...tipografia.chico, color: colores.grisOscuro },
  valor: { ...tipografia.chico, fontWeight: '700', color: colores.tinta },
});
