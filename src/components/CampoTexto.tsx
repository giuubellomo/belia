import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AREA_TOCABLE_MINIMA, colores, espacios, radios, tipografia } from '@/theme/tokens';

import { Etiqueta } from './Etiqueta';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
  valor: string;
  onCambiar: (texto: string) => void;
  /** El titulo de arriba: «Nombre». */
  etiqueta?: string;
  /** Si viene, el borde se pone en tinta y el mensaje aparece abajo. */
  error?: string;
}

export function CampoTexto({ valor, onCambiar, etiqueta, error, ...resto }: Props) {
  return (
    <View style={styles.contenedor}>
      {etiqueta !== undefined && <Etiqueta texto={etiqueta} />}
      <TextInput
        {...resto}
        accessibilityLabel={resto.accessibilityLabel ?? etiqueta}
        value={valor}
        onChangeText={onCambiar}
        placeholderTextColor={colores.grisMedio}
        style={[styles.campo, error !== undefined && styles.campoConError]}
      />
      {error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: espacios.xs },
  campo: {
    ...tipografia.cuerpo,
    color: colores.tinta,
    minHeight: Math.max(AREA_TOCABLE_MINIMA, 50),
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.sm,
  },
  // Monocromo: el error se marca con el borde en tinta y el texto, no con rojo.
  campoConError: { borderColor: colores.tinta },
  error: { ...tipografia.chico, color: colores.tinta },
});
