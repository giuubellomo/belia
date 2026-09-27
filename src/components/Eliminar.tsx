import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { es } from '@/i18n/es';
import { AREA_TOCABLE_MINIMA, colores, espacios, tipografia } from '@/theme/tokens';

import { Boton } from './Boton';

interface Props {
  /** «¿Eliminar "Cortó"?»: lo que se pregunta antes de eliminar. Sin pregunta, elimina directo. */
  pregunta?: string;
  onEliminar: () => void;
}

/**
 * «Eliminar» al pie de un popup o un sheet (cambio 59), con confirmacion (paso
 * 9.2, RNF-6, cambio 83). Al tocarlo se reemplaza por la pregunta, con Cancelar y
 * Eliminar: la confirmacion va en el mismo lugar y no en otro popup, porque en
 * iOS un Modal no se abre encima de otro si no esta anidado en él. Un jugador
 * del armado se saca sin preguntar: se recupera volviendolo a agregar.
 */
export function Eliminar({ pregunta, onEliminar }: Props) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Keyboard.dismiss();
          if (pregunta === undefined) onEliminar();
          else setConfirmando(true);
        }}
        style={styles.eliminar}
      >
        <Text style={styles.eliminarTexto}>{es.comun.eliminar}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.confirmacion}>
      <Text accessibilityLiveRegion="polite" style={styles.pregunta}>
        {pregunta}
      </Text>
      <View style={styles.botones}>
        <View style={styles.boton}>
          <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmando(false)} />
        </View>
        <View style={styles.boton}>
          <Boton titulo={es.comun.eliminar} onPress={onEliminar} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eliminar: { minHeight: AREA_TOCABLE_MINIMA, alignItems: 'center', justifyContent: 'center' },
  eliminarTexto: { ...tipografia.secundario, fontWeight: '700', color: colores.tinta },
  confirmacion: { gap: espacios.sm },
  pregunta: { ...tipografia.cuerpo, color: colores.tinta, textAlign: 'center' },
  botones: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
});
