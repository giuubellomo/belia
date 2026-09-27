import { useEffect, useState } from 'react';

import { es } from '@/i18n/es';

import { Eliminar } from './Eliminar';
import { FormularioParticipante, type DatosFormularioParticipante } from './FormularioParticipante';
import { Popup } from './Popup';

interface Props {
  visible: boolean;
  /** Cancelar, la ✕, el velo o el boton atras. No cambia nada. */
  onCerrar: () => void;
  /** Si viene, el popup edita a ese jugador; si no, da de alta uno nuevo. */
  participante?: DatosFormularioParticipante;
  /** Con quienes no puede repetir el nombre (RF-202), sin el que se esta editando. */
  nombresOcupados: string[];
  /** Recibe el nombre ya normalizado. El popup se cierra solo despues. */
  onConfirmar: (datos: DatosFormularioParticipante) => void;
  /** Solo al editar: saca al jugador. */
  onEliminar?: () => void;
}

/**
 * Popup «Agregar participante» del mockup (pasos 4.3 y 6.1).
 *
 * No escribe en la base: los jugadores son de la partida y viven en el armado
 * hasta EMPEZAR (registro, cambio 65). Devuelve los datos a quien lo montó.
 * El formulario y la validación del nombre son los del paso 4.1.
 */
export function PopupParticipante({ visible, onCerrar, participante, nombresOcupados, onConfirmar, onEliminar }: Props) {
  // Cada apertura monta un formulario nuevo. El Modal queda montado aunque este
  // cerrado: sin esto, al reabrirlo seguiria el nombre a medio escribir de la vez
  // anterior, o los datos del jugador que se edito recien.
  const [apertura, setApertura] = useState(0);
  useEffect(() => {
    if (visible) setApertura((n) => n + 1);
  }, [visible]);

  return (
    <Popup
      visible={visible}
      onCerrar={onCerrar}
      etiquetaCerrar={es.comun.cerrar}
      titulo={participante === undefined ? es.participante.agregarTitulo : es.participante.editarTitulo}
    >
      <FormularioParticipante
        key={apertura}
        nombresOcupados={nombresOcupados}
        textoConfirmar={participante === undefined ? es.comun.agregar : es.comun.guardar}
        onConfirmar={async (datos) => {
          onConfirmar(datos);
          onCerrar();
        }}
        onCancelar={onCerrar}
        inicial={participante}
      />

      {/* Como en los sheets de regla y de ronda: al pie, en texto (cambio 59). */}
      {onEliminar !== undefined && (
        <Eliminar onEliminar={onEliminar} />
      )}
    </Popup>
  );
}
