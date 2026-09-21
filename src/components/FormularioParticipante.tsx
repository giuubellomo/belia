import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LARGO_MAXIMO_NOMBRE, normalizarNombre, validarNombre, type ErrorNombre } from '@/domain/participantes';
import type { AvatarTipo, Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import { ICONOS_AVATAR } from '@/theme/iconos';
import { COLORES_AVATAR, colores, espacios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';
import { Etiqueta } from './Etiqueta';

export type DatosFormularioParticipante = Omit<Participante, 'id'>;

interface Props {
  /** Nombres de los participantes activos, sin el que se esta editando (RF-202). */
  nombresOcupados: string[];
  textoConfirmar: string;
  /** Recibe el nombre ya normalizado. Si tira error, el formulario lo muestra y sigue abierto. */
  onConfirmar: (datos: DatosFormularioParticipante) => Promise<void>;
  /** Sin esto no hay boton Cancelar: en la bienvenida no se puede salir sin completar. */
  onCancelar?: () => void;
  inicial?: DatosFormularioParticipante;
}

/**
 * Nombre y avatar de un participante. Es el contenido del popup «Agregar
 * participante» del mockup, y la bienvenida (4.1) lo usa igual.
 */
export function FormularioParticipante({ nombresOcupados, textoConfirmar, onConfirmar, onCancelar, inicial }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [avatarTipo, setAvatarTipo] = useState<AvatarTipo>(inicial?.avatarTipo ?? 'color');
  const [avatarValor, setAvatarValor] = useState<string>(inicial?.avatarValor ?? COLORES_AVATAR[0]);
  // El error del nombre aparece recien al intentar confirmar, y se va al escribir.
  const [errorNombre, setErrorNombre] = useState<ErrorNombre | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const elegir = (tipo: AvatarTipo, valor: string) => {
    setAvatarTipo(tipo);
    setAvatarValor(valor);
  };

  const confirmar = async () => {
    const error = validarNombre(nombre, nombresOcupados);
    if (error !== null) {
      setErrorNombre(error);
      return;
    }
    setGuardando(true);
    setErrorGuardar(false);
    try {
      await onConfirmar({ nombre: normalizarNombre(nombre), avatarTipo, avatarValor });
    } catch {
      setErrorGuardar(true);
      setGuardando(false);
    }
    // Si salio bien, quien llama cierra o navega: no se toca el estado de un
    // componente que probablemente ya se desmonto.
  };

  return (
    <View style={styles.contenedor}>
      <CampoTexto
        etiqueta={es.participante.nombre}
        valor={nombre}
        onCambiar={(texto) => {
          setNombre(texto);
          setErrorNombre(null);
        }}
        placeholder={es.participante.nombreEjemplo}
        maxLength={LARGO_MAXIMO_NOMBRE}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        error={errorNombre === null ? undefined : es.participante.errorNombre[errorNombre]}
      />

      <View style={styles.seccion}>
        <Etiqueta texto={es.participante.iconoOColor} />
        <View accessibilityRole="radiogroup" style={styles.avatares}>
          {COLORES_AVATAR.map((color, i) => (
            <Avatar
              key={color}
              tipo="color"
              valor={color}
              nombre={nombre}
              tamano={40}
              onPress={() => elegir('color', color)}
              seleccionado={avatarTipo === 'color' && avatarValor === color}
              etiqueta={es.participante.colorNumero(i + 1)}
            />
          ))}
          {ICONOS_AVATAR.map((icono) => (
            <Avatar
              key={icono}
              tipo="icono"
              valor={icono}
              nombre={nombre}
              tamano={40}
              onPress={() => elegir('icono', icono)}
              seleccionado={avatarTipo === 'icono' && avatarValor === icono}
              etiqueta={es.participante.icono(icono)}
            />
          ))}
        </View>
      </View>

      {errorGuardar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}

      <View style={styles.botones}>
        {onCancelar !== undefined && (
          <View style={styles.boton}>
            <Boton titulo={es.comun.cancelar} variante="secundario" onPress={onCancelar} />
          </View>
        )}
        <View style={styles.boton}>
          <Boton titulo={textoConfirmar} deshabilitado={guardando} onPress={() => void confirmar()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: espacios.lg },
  seccion: { gap: espacios.xs },
  avatares: { flexDirection: 'row', flexWrap: 'wrap', gap: espacios.xs },
  botones: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
  error: { ...tipografia.chico, color: colores.tinta },
});
