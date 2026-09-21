import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { estadoBase } from '@/db/client';
import { usePlantillas } from '@/hooks/usePlantillas';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Placeholder. El Home de verdad es el paso 4.2.
 * El cartel de la base es temporal: es el checkpoint de los pasos 2.2 y 2.4 y se va con el 4.2.
 * `estadoBase` es un diagnostico de db/, no un repositorio: por eso no pasa por un hook.
 */
export default function Home() {
  const [estado, setEstado] = useState('abriendo la base...');
  const { plantillas, error } = usePlantillas();
  const resumen =
    error !== null
      ? `error: ${String(error)}`
      : plantillas
          .map((p) => `${p.nombre}: ${p.reglas.length} reglas, ${p.rondasIlimitadas ? 'ilimitadas' : `${p.rondas.length} rondas`}`)
          .join('\n');

  useEffect(() => {
    let vigente = true;
    estadoBase()
      .then((base) => {
        if (vigente) {
          setEstado(
            `${base.nombre} · user_version ${base.version} de ${base.versionObjetivo} · ${base.tablas} tablas`,
          );
        }
      })
      .catch((error: unknown) => {
        if (vigente) setEstado(`error: ${String(error)}`);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.texto}>BELIA</Text>
      <Text style={styles.estado}>{estado}</Text>
      <Text style={styles.estado}>{resumen}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacios.sm, padding: espacios.xl },
  texto: tipografia.subtitulo,
  estado: { ...tipografia.chico, color: colores.grisMedio, textAlign: 'center' },
});
