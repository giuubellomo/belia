import { Pressable, StyleSheet, Text } from 'react-native';

import { AREA_TOCABLE_MINIMA, colores, espacios, radios, tipografia } from '@/theme/tokens';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  /** Un glifo de `theme/iconos` a la izquierda del titulo. */
  icono?: string;
}

/** Primario: lleno en tinta. Secundario: blanco con borde. Deshabilitado: gris, en cualquiera de los dos. */
export function Boton({ titulo, onPress, variante = 'primario', deshabilitado = false, icono }: Props) {
  const primario = variante === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primario ? styles.primario : styles.secundario,
        deshabilitado && styles.deshabilitado,
        pressed && styles.presionado,
      ]}
    >
      <Text
        style={[
          styles.texto,
          { color: primario ? colores.fondo : colores.tinta },
          deshabilitado && styles.textoDeshabilitado,
        ]}
      >
        {icono !== undefined ? `${icono}  ${titulo}` : titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(AREA_TOCABLE_MINIMA, 52),
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.sm,
    borderRadius: radios.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: colores.tinta, borderColor: colores.tinta },
  secundario: { backgroundColor: colores.fondo, borderColor: colores.tinta },
  deshabilitado: { backgroundColor: colores.superficie, borderColor: colores.linea },
  presionado: { opacity: 0.8 },
  texto: { ...tipografia.boton, textAlign: 'center' },
  textoDeshabilitado: { color: colores.grisMedio },
});
