import { Pressable, StyleSheet, Text, View } from 'react-native';

import { puntajeDeReglaEnRonda, reglasDeLaRonda } from '@/domain/rondas';
import type { Plantilla, RondaDefinida } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { colores, espacios, numerales, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';
import { Card } from './Card';
import { Chip } from './Chip';
import { Etiqueta } from './Etiqueta';

interface Props {
  /** El borrador: con sus reglas y rondas se calcula lo que vale cada regla en cada ronda. */
  plantilla: Plantilla;
  onEditar: (ronda: RondaDefinida) => void;
  onAgregar: () => void;
  /** -1 sube, 1 baja. */
  onMover: (numero: number, direccion: -1 | 1) => void;
}

/**
 * La seccion «RONDAS · n» del editor de plantilla (paso 5.4, RF-501 a RF-505).
 *
 * Cada ronda muestra su objetivo y un chip por regla con lo que vale en ESA
 * ronda: el ajuste si lo tiene, si no el base. Las reglas que son solo de una
 * ronda aparecen unicamente en la suya. El orden, con flechas (cambio 58).
 */
export function ListaDeRondas({ plantilla, onEditar, onAgregar, onMover }: Props) {
  const { rondas } = plantilla;

  return (
    <View style={styles.seccion}>
      <Etiqueta texto={es.plantilla.rondas(rondas.length)} />
      <Text style={styles.ayuda}>{rondas.length > 0 ? es.plantilla.ayudaRondas : es.plantilla.ayudaSinRondas}</Text>

      {rondas.map((ronda) => (
        <FilaDeRonda
          key={ronda.numero}
          ronda={ronda}
          plantilla={plantilla}
          ultima={ronda.numero === rondas.length}
          onEditar={() => onEditar(ronda)}
          onMover={(direccion) => onMover(ronda.numero, direccion)}
        />
      ))}

      <Card estado="punteada" onPress={onAgregar} etiqueta={es.plantilla.agregarRonda}>
        <Text style={styles.agregar}>{`${iconos.mas}  ${es.plantilla.agregarRonda}`}</Text>
      </Card>
    </View>
  );
}

interface FilaProps {
  ronda: RondaDefinida;
  plantilla: Plantilla;
  ultima: boolean;
  onEditar: () => void;
  onMover: (direccion: -1 | 1) => void;
}

function FilaDeRonda({ ronda, plantilla, ultima, onEditar, onMover }: FilaProps) {
  const titulo = ronda.objetivo ?? es.ronda.sinObjetivo;

  return (
    // Como la fila de regla: la card no es tocable entera porque las flechas son
    // botones, y en web un boton no puede ir adentro de otro (cambio 87).
    <Card style={styles.fila}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${es.ronda.titulo(ronda.numero)}. ${titulo}`}
        onPress={onEditar}
        style={({ pressed }) => [styles.textos, pressed && styles.presionada]}
      >
        <View style={styles.encabezado}>
          <View style={styles.numero}>
            <Text style={[styles.numeroTexto, numerales]}>{ronda.numero}</Text>
          </View>
          <Text style={[styles.objetivo, ronda.objetivo === undefined && styles.sinObjetivo]}>{titulo}</Text>
        </View>

        <View style={styles.chips}>
          {reglasDeLaRonda(plantilla, ronda.numero).map((regla) => (
            <Chip
              key={regla.id}
              texto={regla.titulo}
              valor={conSigno(puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id))}
              punto={regla.alcance === 'todas' ? 'lleno' : 'vacio'}
              variante={regla.alcance === 'todas' ? 'relleno' : 'borde'}
            />
          ))}
        </View>
      </Pressable>

      <View style={styles.flechas}>
        <BotonIcono
          icono={iconos.arriba}
          etiqueta={es.regla.subir}
          tamano={28}
          deshabilitado={ronda.numero === 1}
          onPress={() => onMover(-1)}
        />
        <BotonIcono
          icono={iconos.abajo}
          etiqueta={es.regla.bajar}
          tamano={28}
          deshabilitado={ultima}
          onPress={() => onMover(1)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: espacios.xs },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  agregar: { ...tipografia.cuerpoFuerte, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: espacios.sm },
  textos: { flex: 1, gap: espacios.sm },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs },
  numero: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: espacios.xxs,
    borderRadius: 6,
    backgroundColor: colores.tinta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { ...tipografia.chico, fontWeight: '700', color: colores.fondo },
  objetivo: { ...tipografia.cuerpoFuerte, color: colores.tinta, flexShrink: 1 },
  sinObjetivo: { color: colores.grisMedio },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacios.xxs },
  flechas: { gap: espacios.xxs },
  presionada: { opacity: 0.7 },
});
