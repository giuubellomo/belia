import { StyleSheet, Text } from 'react-native';

import { colores, espacios, tipografia } from '@/theme/tokens';

/** La linea que explica una lista vacia (RNF-6): «Todavía no tenés partidas guardadas». */
export function Vacio({ texto }: { texto: string }) {
  return <Text style={styles.texto}>{texto}</Text>;
}

const styles = StyleSheet.create({
  texto: { ...tipografia.secundario, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
});
