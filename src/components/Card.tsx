import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { iconos } from '@/theme/iconos';
import { colores, espacios, radios } from '@/theme/tokens';

export type EstadoCard = 'normal' | 'seleccionada' | 'activa' | 'suave' | 'punteada';

interface Props {
  children: ReactNode;
  /**
   * normal: borde gris. seleccionada: borde tinta, fondo gris y tilde (plantilla elegida).
   * activa: borde tinta (ronda en juego). suave: fondo gris (ronda completada).
   * punteada: borde punteado (agregar, próximamente, ronda bloqueada).
   */
  estado?: EstadoCard;
  onPress?: () => void;
  /** Lo que lee el lector de pantalla cuando la card es tocable. */
  etiqueta?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, estado = 'normal', onPress, etiqueta, style }: Props) {
  const cuerpo = [styles.base, estilosPorEstado[estado], style];
  const tilde = estado === 'seleccionada' && (
    <View style={styles.tilde}>
      <Text allowFontScaling={false} style={styles.tildeTexto}>
        {iconos.tilde}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return (
      <View style={cuerpo}>
        {children}
        {tilde}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: estado === 'seleccionada' }}
      onPress={onPress}
      style={({ pressed }) => [cuerpo, pressed && styles.presionada]}
    >
      {children}
      {tilde}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radios.lg,
    borderWidth: 1.5,
    borderColor: colores.linea,
    backgroundColor: colores.fondo,
    padding: espacios.md,
  },
  presionada: { opacity: 0.7 },
  tilde: {
    position: 'absolute',
    top: espacios.xs,
    right: espacios.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colores.tinta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tildeTexto: { color: colores.fondo, fontSize: 12, fontWeight: '700' },
});

const estilosPorEstado = StyleSheet.create({
  normal: {},
  seleccionada: { borderColor: colores.tinta, borderWidth: 2, backgroundColor: colores.superficie },
  activa: { borderColor: colores.tinta, borderWidth: 2 },
  suave: { backgroundColor: colores.superficie, borderColor: colores.superficie },
  punteada: { borderStyle: 'dashed' },
});
