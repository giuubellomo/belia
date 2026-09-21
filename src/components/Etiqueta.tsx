import { StyleSheet, Text } from 'react-native';

import { colores, tipografia } from '@/theme/tokens';

/** Titulo de seccion: «TIPO DE JUEGO», «NOMBRE». El texto llega en minuscula; el estilo lo pasa a mayuscula. */
export function Etiqueta({ texto }: { texto: string }) {
  return (
    <Text accessibilityRole="header" style={styles.texto}>
      {texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  texto: { ...tipografia.etiqueta, color: colores.grisMedio },
});
