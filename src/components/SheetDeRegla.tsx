import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AlcanceRegla, Regla } from '@/domain/types';
import type { DatosRegla } from '@/hooks/useBorradorDePlantilla';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, tipografia } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';
import { Card } from './Card';
import { Etiqueta } from './Etiqueta';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';

/** El puntaje se mueve de a 5, nunca llega a cero (RF-404) y no se va de escala. */
const PASO = 5;
const MINIMO = 5;
const MAXIMO = 500;
const PUNTAJE_INICIAL = 10;

type Signo = 'suma' | 'resta';
type Reparto = 'unica' | 'varias';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** Si viene, se edita esa regla; si no, es una regla nueva. */
  regla?: Regla;
  onGuardar: (datos: DatosRegla) => void;
  /** Solo al editar: saca la regla del borrador. */
  onBorrar?: () => void;
}

/**
 * Alta y edicion de una regla (paso 5.3, RF-401 a RF-406).
 *
 * Trabaja sobre el borrador del editor: lo que se guarda acá entra en la
 * plantilla en memoria y se escribe en la base recien con GUARDAR PLANTILLA
 * (cambio 54). El puntaje se edita como magnitud + signo y se guarda con signo,
 * que es como lo pide A-2.
 */
export function SheetDeRegla({ visible, onCerrar, regla, onGuardar, onBorrar }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [signo, setSigno] = useState<Signo>('suma');
  const [magnitud, setMagnitud] = useState(PUNTAJE_INICIAL);
  const [alcance, setAlcance] = useState<AlcanceRegla>('todas');
  const [reparto, setReparto] = useState<Reparto>('unica');
  const [errorTitulo, setErrorTitulo] = useState(false);

  // Cada apertura arranca de los datos de la regla, o en blanco si es nueva.
  useEffect(() => {
    if (!visible) return;
    setTitulo(regla?.titulo ?? '');
    setDescripcion(regla?.descripcion ?? '');
    setSigno(regla !== undefined && regla.puntajeBase < 0 ? 'resta' : 'suma');
    setMagnitud(regla === undefined ? PUNTAJE_INICIAL : Math.abs(regla.puntajeBase));
    setAlcance(regla?.alcance ?? 'todas');
    setReparto(regla === undefined || regla.asignacionUnica ? 'unica' : 'varias');
    setErrorTitulo(false);
  }, [visible, regla]);

  const guardar = () => {
    const limpio = titulo.trim();
    if (limpio.length === 0) {
      setErrorTitulo(true);
      return;
    }
    const descripcionLimpia = descripcion.trim();
    onGuardar({
      id: regla?.id,
      titulo: limpio,
      descripcion: descripcionLimpia.length === 0 ? undefined : descripcionLimpia,
      puntajeBase: signo === 'resta' ? -magnitud : magnitud,
      alcance,
      asignacionUnica: reparto === 'unica',
    });
    onCerrar();
  };

  return (
    <BottomSheet
      visible={visible}
      onCerrar={onCerrar}
      titulo={regla === undefined ? es.regla.nueva : es.regla.editar}
      etiquetaCerrar={es.comun.cerrar}
      pie={<Boton titulo={es.regla.guardar} onPress={guardar} />}
    >
      <CampoTexto
        etiqueta={es.regla.titulo}
        valor={titulo}
        onCambiar={(texto) => {
          setTitulo(texto);
          setErrorTitulo(false);
        }}
        maxLength={40}
        autoCapitalize="sentences"
        returnKeyType="done"
        error={errorTitulo ? es.regla.errorTituloVacio : undefined}
      />

      <CampoTexto
        etiqueta={es.regla.descripcion}
        valor={descripcion}
        onCambiar={setDescripcion}
        maxLength={80}
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      <View style={styles.seccion}>
        <Etiqueta texto={es.regla.puntaje} />
        <Segmented<Signo>
          opciones={[
            { valor: 'suma', etiqueta: es.regla.suma, icono: iconos.mas },
            { valor: 'resta', etiqueta: es.regla.resta, icono: iconos.menos },
          ]}
          seleccionado={signo}
          onCambiar={setSigno}
        />
        <Stepper
          valor={magnitud}
          onCambiar={setMagnitud}
          etiquetaRestar={es.comun.restar}
          etiquetaSumar={es.comun.sumar}
          paso={PASO}
          minimo={MINIMO}
          maximo={MAXIMO}
          formato={(valor) => conSigno(signo === 'resta' ? -valor : valor)}
        />
      </View>

      <View style={styles.seccion}>
        <Etiqueta texto={es.regla.cuandoSeAplica} />
        <Opcion
          titulo={es.regla.enTodasLasRondas}
          ayuda={es.regla.enTodasLasRondasAyuda}
          elegida={alcance === 'todas'}
          onPress={() => setAlcance('todas')}
        />
        <Opcion
          titulo={es.regla.opcional}
          ayuda={es.regla.opcionalAyuda}
          elegida={alcance === 'opcional'}
          onPress={() => setAlcance('opcional')}
        />
      </View>

      <View style={styles.seccion}>
        <Etiqueta texto={es.regla.quienLaRecibe} />
        <Segmented<Reparto>
          opciones={[
            { valor: 'unica', etiqueta: es.regla.unaPersona },
            { valor: 'varias', etiqueta: es.regla.varias },
          ]}
          seleccionado={reparto}
          onCambiar={setReparto}
        />
        <Text style={styles.ayuda}>{es.regla.quienLaRecibeAyuda}</Text>
      </View>

      {/* Al editar: saca la regla del borrador. Como todo lo del editor, se
          deshace saliendo sin guardar la plantilla. */}
      {onBorrar !== undefined && (
        <Pressable accessibilityRole="button" onPress={onBorrar} style={styles.eliminar}>
          <Text style={styles.eliminarTexto}>{es.comun.eliminar}</Text>
        </Pressable>
      )}
    </BottomSheet>
  );
}

/** Una de las dos tarjetas de «¿Cuándo se aplica?»: título, explicación y tilde. */
function Opcion({
  titulo,
  ayuda,
  elegida,
  onPress,
}: {
  titulo: string;
  ayuda: string;
  elegida: boolean;
  onPress: () => void;
}) {
  return (
    <Card estado={elegida ? 'seleccionada' : 'normal'} onPress={onPress} etiqueta={`${titulo}. ${ayuda}`}>
      <Text style={styles.opcionTitulo}>{titulo}</Text>
      <Text style={styles.opcionAyuda}>{ayuda}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: espacios.xs },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  opcionTitulo: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  opcionAyuda: { ...tipografia.secundario, color: colores.grisMedio },
  eliminar: { minHeight: AREA_TOCABLE_MINIMA, alignItems: 'center', justifyContent: 'center' },
  eliminarTexto: { ...tipografia.secundario, fontWeight: '700', color: colores.tinta },
});
