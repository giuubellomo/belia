import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { LARGO_MAXIMO_NOMBRE_PARTIDA } from '@/domain/partidas';
import type { Participante, Partida } from '@/domain/types';
import { useArmadoDePartida } from '@/hooks/useArmadoDePartida';
import { usePlantillas } from '@/hooks/usePlantillas';
import { es } from '@/i18n/es';
import { iconoDePlantilla, iconos } from '@/theme/iconos';
import { colores, espacios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';
import { Card } from './Card';
import { Etiqueta } from './Etiqueta';
import { PopupParticipante } from './PopupParticipante';

const LADO_AVATAR = 60;

interface Props {
  visible: boolean;
  onCerrar: () => void;
}

/**
 * Sheet «Nueva partida» (paso 6.1, RF-601 a RF-605).
 *
 * Arriba, las plantillas de a dos por fila; abajo, los jugadores de esta
 * partida, que se cargan acá y no se guardan aparte (registro, cambio 65).
 * EMPEZAR se habilita con una plantilla y dos jugadores (RF-604) y crea la
 * partida (6.2).
 *
 * Asume que no hay partida en curso: el Home ya resolvió ese caso (4.2, A-5).
 */
export function SheetDeArmado({ visible, onCerrar }: Props) {
  const { plantillas } = usePlantillas();
  const router = useRouter();
  const armado = useArmadoDePartida();
  // null = popup cerrado. Con un jugador se edita ese; con 'nuevo', se da de alta.
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState<Participante | 'nuevo' | null>(null);
  const [empezando, setEmpezando] = useState(false);
  const [errorAlEmpezar, setErrorAlEmpezar] = useState(false);

  // Cada apertura arranca vacía: una partida no hereda lo que se eligió para otra.
  const { reiniciar } = armado;
  useEffect(() => {
    if (!visible) return;
    reiniciar();
    setJugadorEnEdicion(null);
    setEmpezando(false);
    setErrorAlEmpezar(false);
  }, [visible, reiniciar]);

  // Paso 6.2: crea la partida, cierra el sheet y la abre (7.1).
  const empezar = async () => {
    setEmpezando(true);
    setErrorAlEmpezar(false);
    let partida: Partida;
    try {
      partida = await armado.empezar();
    } catch {
      setErrorAlEmpezar(true);
      setEmpezando(false);
      return;
    }
    onCerrar();
    router.push({ pathname: '/partida/[id]', params: { id: partida.id } });
  };

  // Tocar otra cosa suelta el campo del nombre: si no, el teclado queda abierto, y
  // al cerrarse el popup de participante iOS le devuelve el foco y vuelve a subir.
  const abrirJugador = (jugador: Participante | 'nuevo') => {
    Keyboard.dismiss();
    setJugadorEnEdicion(jugador);
  };

  const editado = jugadorEnEdicion === 'nuevo' || jugadorEnEdicion === null ? undefined : jugadorEnEdicion;
  // RF-202: el nombre no se repite entre los jugadores de esta partida.
  const nombresOcupados = armado.jugadores.filter((otro) => otro.id !== editado?.id).map((otro) => otro.nombre);

  return (
    <BottomSheet
      visible={visible}
      onCerrar={onCerrar}
      titulo={es.nuevaPartida.titulo}
      pie={
        <View style={styles.pie}>
          {errorAlEmpezar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <Boton
            titulo={es.nuevaPartida.empezar}
            deshabilitado={!armado.puedeEmpezar || empezando}
            onPress={() => {
              Keyboard.dismiss();
              void empezar();
            }}
          />
        </View>
      }
    >
      {/* Obligatorio: sin nombre, EMPEZAR no se habilita (registro, cambio 71). */}
      <CampoTexto
        etiqueta={es.nuevaPartida.nombre}
        valor={armado.nombre}
        onCambiar={armado.cambiarNombre}
        placeholder={es.nuevaPartida.nombreEjemplo}
        maxLength={LARGO_MAXIMO_NOMBRE_PARTIDA}
        returnKeyType="done"
      />

      <View style={styles.seccion}>
        <Etiqueta texto={es.nuevaPartida.tipoDeJuego} />
        <Grilla>
          {plantillas.map((plantilla) => (
            <Card
              key={plantilla.id}
              estado={plantilla.id === armado.plantillaId ? 'seleccionada' : 'normal'}
              onPress={() => {
                Keyboard.dismiss();
                armado.elegirPlantilla(plantilla.id);
              }}
              etiqueta={plantilla.nombre}
              style={styles.plantilla}
            >
              <Text allowFontScaling={false} style={styles.glifo}>
                {iconoDePlantilla(plantilla.icono)}
              </Text>
              <Text style={styles.nombrePlantilla} numberOfLines={2}>
                {plantilla.nombre}
              </Text>
            </Card>
          ))}
        </Grilla>
      </View>

      <View style={styles.seccion}>
        <Etiqueta texto={es.nuevaPartida.participantes} />
        <Grilla>
          {[
            ...armado.jugadores.map((jugador) => (
              <Pressable
                key={jugador.id}
                accessibilityRole="button"
                accessibilityLabel={`${es.participante.editarTitulo}: ${jugador.nombre}`}
                onPress={() => abrirJugador(jugador)}
                style={({ pressed }) => [styles.jugador, pressed && styles.presionado]}
              >
                <Avatar
                  tipo={jugador.avatarTipo}
                  valor={jugador.avatarValor}
                  nombre={jugador.nombre}
                  tamano={LADO_AVATAR}
                />
                <Text style={styles.nombreJugador} numberOfLines={1}>
                  {jugador.nombre}
                </Text>
              </Pressable>
            )),
            // RF-605: con ocho, el «agregar» desaparece.
            ...(armado.hayLugar
              ? [
                  <Pressable
                    key="agregar"
                    accessibilityRole="button"
                    accessibilityLabel={es.participante.agregarTitulo}
                    onPress={() => abrirJugador('nuevo')}
                    style={({ pressed }) => [styles.jugador, pressed && styles.presionado]}
                  >
                    <View style={styles.agregar}>
                      <Text style={styles.agregarGlifo}>{iconos.mas}</Text>
                    </View>
                    <Text style={styles.agregarTexto}>{es.nuevaPartida.agregar}</Text>
                  </Pressable>,
                ]
              : []),
          ]}
        </Grilla>
      </View>

      {/* Va adentro del sheet y no al lado: en iOS un Modal solo se puede abrir
          encima de otro si esta anidado en él (como en SheetDeRonda). */}
      <PopupParticipante
        visible={jugadorEnEdicion !== null}
        onCerrar={() => setJugadorEnEdicion(null)}
        participante={editado}
        nombresOcupados={nombresOcupados}
        onConfirmar={(datos) =>
          editado === undefined ? armado.agregarJugador(datos) : armado.editarJugador(editado.id, datos)
        }
        onEliminar={
          editado === undefined
            ? undefined
            : () => {
                armado.sacarJugador(editado.id);
                setJugadorEnEdicion(null);
              }
        }
      />
    </BottomSheet>
  );
}

/** De a dos por fila (RF-601). Si queda uno solo en la última, ocupa media fila. */
function Grilla({ children }: { children: ReactNode[] }) {
  const filas: ReactNode[][] = [];
  for (let i = 0; i < children.length; i += 2) filas.push(children.slice(i, i + 2));

  return (
    <View style={styles.grilla}>
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila}>
          {fila.map((celda, j) => (
            <View key={j} style={styles.celda}>
              {celda}
            </View>
          ))}
          {fila.length === 1 && <View style={styles.celda} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: espacios.xs },
  pie: { gap: espacios.xs },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
  grilla: { gap: espacios.sm },
  fila: { flexDirection: 'row', gap: espacios.sm },
  celda: { flex: 1 },
  plantilla: { alignItems: 'center', justifyContent: 'center', gap: espacios.xs, minHeight: 112 },
  glifo: { fontSize: 26, color: colores.tinta },
  nombrePlantilla: { ...tipografia.cuerpoFuerte, color: colores.tinta, textAlign: 'center' },
  jugador: { alignItems: 'center', gap: espacios.xxs, paddingVertical: espacios.xxs },
  presionado: { opacity: 0.6 },
  nombreJugador: { ...tipografia.secundario, color: colores.grisOscuro },
  agregar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarGlifo: { fontSize: 24, color: colores.grisMedio },
  agregarTexto: { ...tipografia.secundario, color: colores.grisMedio },
});
