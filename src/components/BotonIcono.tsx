import { Pressable, StyleSheet, Text } from 'react-native';

import { AREA_TOCABLE_MINIMA, colores } from '@/theme/tokens';

interface Props {
  /** Un glifo de `theme/iconos`. */
  icono: string;
  /** Lo que lee el lector de pantalla: el boton no tiene texto visible. */
  etiqueta: string;
  onPress: () => void;
  /** Diametro dibujado. El area tocable nunca baja de 44 (RNF-3). */
  tamano?: number;
  deshabilitado?: boolean;
}

/** Boton redondo con borde: cerrar, atras, y los − / + del stepper. */
export function BotonIcono({ icono, etiqueta, onPress, tamano = 36, deshabilitado = false }: Props) {
  const margen = Math.max(0, (AREA_TOCABLE_MINIMA - tamano) / 2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      hitSlop={margen}
      style={({ pressed }) => [
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
        deshabilitado && styles.deshabilitado,
        pressed && styles.presionado,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.icono, { fontSize: Math.round(tamano * 0.45) }, deshabilitado && styles.iconoDeshabilitado]}
      >
        {icono}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colores.tinta,
    backgroundColor: colores.fondo,
  },
  deshabilitado: { borderColor: colores.linea },
  presionado: { backgroundColor: colores.superficie },
  icono: { color: colores.tinta, fontWeight: '500' },
  iconoDeshabilitado: { color: colores.linea },
});
