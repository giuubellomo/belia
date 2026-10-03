import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { esBaseAbiertaEnOtraPestana } from '@/db/client';
import { sembrar } from '@/db/seed';
import { es } from '@/i18n/es';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * El Home queda siempre debajo en la pila, aunque se entre directo a otra ruta.
 * En web pasa al recargar una pantalla interna: sin esto no habria a donde
 * volver, y con la app agregada a inicio no hay boton atras del navegador
 * (fase 10, cambio 87).
 */
export const unstable_settings = { anchor: 'index' };

/**
 * Antes de montar cualquier pantalla se siembran las plantillas predefinidas
 * (paso 2.4). Asi ninguna pantalla lee la base antes de que esten.
 */
export default function RootLayout() {
  const [lista, setLista] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    sembrar()
      .then(() => setLista(true))
      .catch((e: unknown) => setError(e ?? 'Error'));
  }, []);

  // En web, la app ya abierta en otra pestaña: un aviso para la usuaria, no un error.
  if (error !== null && esBaseAbiertaEnOtraPestana(error)) {
    return <PantallaError mensaje={es.comun.abiertaEnOtraPestana} />;
  }
  // Diagnostico de desarrollo: si la semilla falla, la app no sirve y hay que verlo.
  if (error !== null) return <PantallaError mensaje={String(error)} />;

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
      <Text style={styles.mensaje}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacios.xl, backgroundColor: colores.fondo },
  mensaje: { ...tipografia.cuerpo, color: colores.tinta, textAlign: 'center' },
});
