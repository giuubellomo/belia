import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sembrar } from '@/db/seed';
import { es } from '@/i18n/es';

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
  if (error !== null) return <PantallaError mensaje={error} />;

  // Es un instante: una lectura y, solo la primera vez, dos inserciones.
  if (!lista) return null;

  return <Navegacion />;
}

/**
 * Sin bienvenida desde el paso 9.1 (cambio 82): la app abre directo en el Home.
 */
function Navegacion() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="plantillas/index" options={{ title: es.plantillas.titulo, headerBackTitle: es.comun.volver }} />
      {/* El editor dibuja su propio encabezado (mockup 3) y confirma antes de salir
          con cambios sin guardar: sin gesto de arrastrar, la ‹ es la unica salida. */}
      <Stack.Screen name="plantillas/[id]" options={{ headerShown: false, gestureEnabled: false }} />
      {/* La partida dibuja su propio encabezado (mockup 4). */}
      <Stack.Screen name="partida/[id]/index" options={{ headerShown: false }} />
      {/* El podio (8.2): se llega con replace desde la partida, asi que atras es el Home. */}
      <Stack.Screen name="partida/[id]/final" options={{ headerShown: false }} />
      <Stack.Screen name="config/index" options={{ title: es.home.configuracion, headerBackTitle: es.comun.volver }} />
    </Stack>
  );
}

function PantallaError({ mensaje }: { mensaje: string }) {
  return (
    <View style={styles.error}>
      <Text>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
