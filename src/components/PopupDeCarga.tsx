import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { puntajeDeReglaEnRonda, quienesTienenRegla, reglasDeLaRonda } from '@/domain/rondas';
import type { Participante, Partida, Regla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { Chip } from './Chip';
import { Etiqueta } from './Etiqueta';
import { Popup } from './Popup';
import { Stepper } from './Stepper';

/** De a cuanto va el stepper; el numero ademas se puede escribir (cambio 76). */
const PASO = 5;
const MAXIMO = 9999;

interface Props {
  visible: boolean;
  partida: Partida;
  numeroRonda: number;
  /** A quien se le carga. Queda puesto mientras el popup se desvanece al cerrarse. */
  participanteId: string | null;
  /** La ✕, el velo o el boton atras: no guarda nada. */
  onCerrar: () => void;
  /** Escribe en la base. El popup se cierra solo si sale bien. */
  onGuardar: (puntos: number, reglasMarcadas: string[]) => Promise<void>;
}

/**
 * Popup de carga (paso 7.4, RF-705, mockup 4): el puntaje de la ronda con un
 * stepper, siempre positivo (A-2) y con el signo de `modoPuntos` a la vista, y
 * las reglas de la ronda con lo que valen y un tilde. Nada se escribe hasta
 * GUARDAR: ahi va todo junto (`partidas.guardarCarga`).
 */
export function PopupDeCarga({ visible, partida, numeroRonda, participanteId, onCerrar, onGuardar }: Props) {
  // Cada apertura arranca de lo que hay en la base, no de lo que quedo a medio
  // tocar la vez anterior (igual que PopupParticipante).
  const [apertura, setApertura] = useState(0);
  useEffect(() => {
    if (visible) setApertura((n) => n + 1);
  }, [visible]);

  const participante = partida.participantes.find((p) => p.id === participanteId);
  const ronda = partida.rondas.find((r) => r.numero === numeroRonda);

  return (
    <Popup
      visible={visible}
      onCerrar={onCerrar}
      etiquetaCerrar={es.comun.cerrar}
      encabezado={
        participante !== undefined && (
          <View style={styles.encabezado}>
            <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
            <View style={styles.textos}>
              <Text accessibilityRole="header" style={styles.nombre}>
                {participante.nombre}
              </Text>
              <Text style={styles.subtitulo}>{es.carga.subtitulo(numeroRonda, ronda?.objetivo)}</Text>
            </View>
          </View>
        )
      }
    >
      {participante !== undefined && ronda !== undefined && (
        <Formulario
          key={apertura}
          partida={partida}
          ronda={ronda}
          participante={participante}
          onGuardar={async (puntos, reglas) => {
            await onGuardar(puntos, reglas);
            onCerrar();
          }}
        />
      )}
    </Popup>
  );
}

interface PropsFormulario {
  partida: Partida;
  ronda: RondaJugada;
  participante: Participante;
  onGuardar: (puntos: number, reglasMarcadas: string[]) => Promise<void>;
}

function Formulario({ partida, ronda, participante, onGuardar }: PropsFormulario) {
  const { plantilla } = partida;
  const entrada = ronda.entradas.find((e) => e.participanteId === participante.id);
  const [puntos, setPuntos] = useState(entrada?.puntosManuales ?? 0);
  const [marcadas, setMarcadas] = useState<string[]>(Object.keys(entrada?.marcas ?? {}));
  const [guardando, setGuardando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState(false);

  const reglas = reglasDeLaRonda(plantilla, ronda.numero);
  const signo = plantilla.modoPuntos === 'suma' ? 1 : -1;

  function alternar(reglaId: string) {
    Keyboard.dismiss();
    setMarcadas((actuales) =>
      actuales.includes(reglaId) ? actuales.filter((id) => id !== reglaId) : [...actuales, reglaId],
    );
  }

  async function guardar() {
    Keyboard.dismiss();
    setGuardando(true);
    setErrorAlGuardar(false);
    try {
      await onGuardar(puntos, marcadas);
    } catch {
      setErrorAlGuardar(true);
      setGuardando(false);
    }
  }

  return (
    <>
      <View style={styles.seccion}>
        <Etiqueta texto={es.carga.puntajeDeLaRonda} />
        <Stepper
          valor={puntos}
          onCambiar={setPuntos}
          etiquetaRestar={es.comun.restar}
          etiquetaSumar={es.comun.sumar}
          paso={PASO}
          minimo={0}
          maximo={MAXIMO}
          // A-2: se carga positivo y se ve con el signo que le pone el modo.
          formato={(valor) => conSigno(signo * valor)}
          tamano="grande"
          escribible
          etiquetaEscribir={es.carga.escribirPuntaje}
        />
      </View>

      {reglas.length > 0 && (
        <View>
          <Etiqueta texto={es.carga.reglasDeLaRonda} />
          {reglas.map((regla, i) => (
            <FilaDeRegla
              key={regla.id}
              regla={regla}
              puntos={puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id)}
              marcada={marcadas.includes(regla.id)}
              otros={otrosQueLaTienen(regla, ronda, partida, participante.id)}
              primera={i === 0}
              onPress={() => alternar(regla.id)}
            />
          ))}
        </View>
      )}

      {errorAlGuardar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
      <Boton titulo={es.carga.guardar} onPress={guardar} deshabilitado={guardando} />
    </>
  );
}

interface PropsFila {
  regla: Regla;
  puntos: number;
  marcada: boolean;
  /** Quienes mas la tienen, si es de asignacion unica: «La tiene Tú». */
  otros: string[];
  primera: boolean;
  onPress: () => void;
}

/** ● regla de alcance todas, ○ opcional; lo que vale en esta ronda y el tilde. */
function FilaDeRegla({ regla, puntos, marcada, otros, primera, onPress }: PropsFila) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={`${regla.titulo}, ${es.comun.puntos(puntos)}`}
      accessibilityHint={otros.length > 0 ? es.carga.laTiene(otros) : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.regla, !primera && styles.reglaConLinea, pressed && styles.presionada]}
    >
      <View style={[styles.punto, regla.alcance === 'opcional' && styles.puntoVacio]} />
      <View style={styles.textos}>
        <Text style={styles.titulo}>{regla.titulo}</Text>
        {otros.length > 0 && <Text style={styles.laTiene}>{es.carga.laTiene(otros)}</Text>}
      </View>
      <Chip valor={conSigno(puntos)} variante="borde" />
      <View style={[styles.tilde, marcada && styles.tildeMarcado]}>
        {marcada && (
          <Text allowFontScaling={false} style={styles.tildeTexto}>
            {iconos.tilde}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** Los nombres de quienes tienen marcada una regla unica, sin contar al de este popup. */
function otrosQueLaTienen(regla: Regla, ronda: RondaJugada, partida: Partida, participanteId: string): string[] {
  if (!regla.asignacionUnica) return [];
  return quienesTienenRegla(ronda, regla.id)
    .filter((id) => id !== participanteId)
    .map((id) => partida.participantes.find((p) => p.id === id)?.nombre ?? '');
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: 2 },
  nombre: { ...tipografia.tituloChico, color: colores.tinta },
  subtitulo: { ...tipografia.secundario, color: colores.grisOscuro },
  seccion: { gap: espacios.sm },
  regla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: AREA_TOCABLE_MINIMA + 4,
    paddingVertical: espacios.xs,
  },
  reglaConLinea: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.linea },
  presionada: { opacity: 0.7 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.tinta },
  puntoVacio: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colores.grisMedio },
  titulo: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  laTiene: { ...tipografia.chico, color: colores.grisOscuro },
  tilde: {
    width: 28,
    height: 28,
    borderRadius: radios.xs - 2,
    borderWidth: 1.5,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tildeMarcado: { backgroundColor: colores.tinta, borderColor: colores.tinta },
  tildeTexto: { color: colores.fondo, fontSize: 15, fontWeight: '700' },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
});
