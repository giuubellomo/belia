import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sembrar } from '@/db/seed';
import { es } from '@/i18n/es';
import { useDueno } from '@/hooks/useDueno';

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
 * Paso 4.1 (RF-205): sin dueño del dispositivo solo existe la bienvenida; con
 * dueño, el resto de la app. Cuando se crea el dueño, el guard cambia y el router
 * saca la bienvenida del historial: no hay forma de volver a ella.
 */
function Navegacion() {
  const { dueno, cargando, error } = useDueno();

  if (error !== null) return <PantallaError mensaje={String(error)} />;
  if (cargando) return null;

  const hayDueno = dueno !== null;

  return (
    <Stack>
      <Stack.Protected guard={!hayDueno}>
        <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={hayDueno}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="plantillas/index"
          options={{ title: es.plantillas.titulo, headerBackTitle: es.comun.volver }}
        />
        {/* El editor dibuja su propio encabezado (mockup 3) y confirma antes de salir
            con cambios sin guardar: sin gesto de arrastrar, la ‹ es la unica salida. */}
        <Stack.Screen name="plantillas/[id]" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
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
