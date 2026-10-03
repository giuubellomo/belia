import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Regla } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';
import { Card } from './Card';
import { Chip } from './Chip';
import { Etiqueta } from './Etiqueta';

interface Props {
  reglas: Regla[];
  onEditar: (regla: Regla) => void;
  onAgregar: () => void;
  /** -1 sube, 1 baja. */
  onMover: (id: string, direccion: -1 | 1) => void;
}

/**
 * La seccion «REGLAS · n» del editor de plantilla (paso 5.3).
 *
 * El orden se cambia con flechas y no arrastrando: arrastrar necesita una
 * libreria de gestos que el plan no incluye (ver registro, cambio 58).
 */
export function ListaDeReglas({ reglas, onEditar, onAgregar, onMover }: Props) {
  return (
    <View style={styles.seccion}>
      <Etiqueta texto={es.plantilla.reglas(reglas.length)} />

      {reglas.map((regla, i) => (
        <FilaDeRegla
          key={regla.id}
          regla={regla}
          primera={i === 0}
          ultima={i === reglas.length - 1}
          onEditar={() => onEditar(regla)}
          onMover={(direccion) => onMover(regla.id, direccion)}
        />
      ))}

      <Card estado="punteada" onPress={onAgregar} etiqueta={es.plantilla.agregarRegla}>
        <Text style={styles.agregar}>{`${iconos.mas}  ${es.plantilla.agregarRegla}`}</Text>
      </Card>
    </View>
  );
}

interface FilaProps {
  regla: Regla;
  primera: boolean;
  ultima: boolean;
  onEditar: () => void;
  onMover: (direccion: -1 | 1) => void;
}

function FilaDeRegla({ regla, primera, ultima, onEditar, onMover }: FilaProps) {
  return (
    // La card no es tocable entera: las flechas son botones y en web un boton no
    // puede ir adentro de otro (cambio 87). Se toca la parte de los textos.
    <Card style={styles.fila}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${regla.titulo}. ${es.comun.puntos(regla.puntajeBase)}`}
        onPress={onEditar}
        style={({ pressed }) => [styles.editar, pressed && styles.presionada]}
      >
        <View style={styles.textos}>
          <Text style={styles.titulo}>{regla.titulo}</Text>
          <View style={styles.etiquetas}>
            <Chip
              texto={regla.alcance === 'todas' ? es.regla.enTodasLasRondas : es.regla.opcional}
              punto={regla.alcance === 'todas' ? 'lleno' : 'vacio'}
            />
            {/* Lo comun es que se la lleve una sola persona: se marca la excepcion. */}
            {!regla.asignacionUnica && <Chip texto={es.regla.varias} variante="borde" />}
          </View>
        </View>

        <Chip valor={conSigno(regla.puntajeBase)} variante="borde" />
      </Pressable>

      <View style={styles.flechas}>
        <BotonIcono
          icono={iconos.arriba}
          etiqueta={es.regla.subir}
          tamano={28}
          deshabilitado={primera}
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
  agregar: { ...tipografia.cuerpoFuerte, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: espacios.xs },
  titulo: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacios.xxs },
  flechas: { gap: espacios.xxs },
  editar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacios.sm, minHeight: AREA_TOCABLE_MINIMA },
  presionada: { opacity: 0.7 },
});
