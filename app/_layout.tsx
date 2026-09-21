import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sembrar } from '@/db/seed';

/**
 * Antes de montar cualquier pantalla se siembran las plantillas predefinidas
 * (paso 2.4). Asi ninguna pantalla lee la base antes de que esten.
 */
export default function RootLayout() {
  const [lista, setLista] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sembrar()
      .then(() => setLista(true))
      .catch((e: unknown) => setError(String(e)));
  }, []);

  // Diagnostico de desarrollo: si la semilla falla, la app no sirve y hay que verlo.
  if (error !== null) {
    return (
      <View style={styles.error}>
        <Text>{error}</Text>
      </View>
    );
  }

  // Es un instante: una lectura y, solo la primera vez, dos inserciones.
  if (!lista) return null;

  return <Stack />;
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
