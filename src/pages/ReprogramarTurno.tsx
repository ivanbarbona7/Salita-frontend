import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Stack } from 'react-bootstrap';
import { toast } from 'sonner';
import { PasoLayout } from '../components/PasoLayout';
import { CargandoBotones } from '../components/CargandoBotones';
import { useFetch } from '../hooks/useFetch';
import { useReprogramarTurnoPaciente } from '../hooks/useTurnosApi';
import { formatearTurno } from '../components/utils/fecha';
import ModalConfirmar from '../components/utils/ModalConfirmar';
import HorariosLibres from '../components/turnos/HorariosLibres';
import { esIngresoRapido } from '../components/utils/sesion';
import { obtenerMensajeError } from '../components/utils/obtenerMensajeError';
import type { IDiasReprogramar, IMiTurno } from '../types/TurnosPaciente.types';

const etiquetaDia = (dia: string) =>
  new Date(`${dia}T12:00:00-03:00`).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires',
  });

// Elegir el día y el horario nuevos. Se mantiene el mismo médico y consultorio.
const ElegirHorario = ({ turno, dias }: { turno: IMiTurno; dias: IDiasReprogramar }) => {
  const navigate = useNavigate();
  const reprogramar = useReprogramarTurnoPaciente();
  const [dia, setDia] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const confirmar = async () => {
    if (!horario) return;
    try {
      await reprogramar(turno.id, horario);
      toast.success('Turno reprogramado');
      navigate('/pacientes/turnos', { replace: true });
    } catch (err: unknown) {
      // Si el horario se ocupó, se vuelve a elegir (el servidor ya dio el motivo)
      toast.error(obtenerMensajeError(err));
      setHorario(null);
      setDia(null);
    } finally {
      setConfirmando(false);
    }
  };

  if (dias.dias.length === 0) {
    return <Alert variant="warning" className="fs-5">No hay horarios libres en los próximos 30 días con este médico.</Alert>;
  }

  return (
    <>
      <h2 className="h4 mb-3">Elegí el nuevo día</h2>
      <Stack gap={2} className="mb-4">
        {dias.dias.map((d) => (
          <Button
            key={d.fecha}
            size="lg"
            variant={dia === d.fecha ? 'primary' : 'outline-primary'}
            className="text-capitalize text-start"
            onClick={() => { setDia(d.fecha); setHorario(null); }}
          >
            {etiquetaDia(d.fecha)}
            <small className="ms-2 opacity-75">({d.libres} libres)</small>
          </Button>
        ))}
      </Stack>

      {dia && (
        <>
          <h2 className="h4 mb-3">Elegí la hora</h2>
          <HorariosLibres key={dia} medicoId={dias.medico} consultorioId={dias.consultorio} fecha={dia} elegido={horario} onElegir={setHorario} />
        </>
      )}

      {horario && (
        <Button size="lg" variant="success" className="w-100 mt-4 py-3 fs-4" onClick={() => setConfirmando(true)}>
          Continuar
        </Button>
      )}

      <ModalConfirmar
        show={confirmando}
        titulo="Confirmar el cambio"
        mensaje={
          <span className="fs-5">
            Vas a pasar tu turno al <strong className="text-capitalize">{dia ? etiquetaDia(dia) : ''}</strong>. Solo podés
            reprogramar <strong>una vez</strong>. ¿Confirmás?
          </span>
        }
        variante="primary"
        textoConfirmar="Sí, reprogramar"
        textoCancelar="No, volver"
        onConfirmar={confirmar}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
};

export const ReprogramarTurno = () => {
  const { id } = useParams<{ id: string }>();
  const { data: turnos, isLoading: cargandoTurnos } = useFetch<IMiTurno[]>(esIngresoRapido() ? null : '/turnos/paciente');
  const turno = (turnos ?? []).find((t) => t.id === id);
  // Solo se piden los días si el turno se puede reprogramar
  const { data: dias, isLoading: cargandoDias } = useFetch<IDiasReprogramar>(
    turno?.puedeReprogramar ? `/turnos/paciente/${id}/dias-reprogramar` : null,
  );

  if (esIngresoRapido()) return <Navigate to="/pacientes/inicio" replace />;

  return (
    <PasoLayout titulo="Reprogramar turno">
      {(cargandoTurnos || cargandoDias) && <CargandoBotones cantidad={3} />}

      {!cargandoTurnos && !turno && <Alert variant="danger">No encontramos ese turno.</Alert>}

      {turno && (
        <Alert variant="light" className="border fs-5">
          Turno actual: <strong className="text-capitalize">{formatearTurno(turno.fechaTurno)} hs</strong>
          <small className="d-block text-muted">
            {turno.especialidad.nombre} · {turno.medico.apellido}, {turno.medico.nombre} · {turno.consultorio.nombre}
          </small>
        </Alert>
      )}

      {turno && !turno.puedeReprogramar && (
        <Alert variant="warning" className="fs-5">{turno.motivoNoReprogramar ?? 'Este turno no se puede reprogramar.'}</Alert>
      )}

      {turno && dias && <ElegirHorario turno={turno} dias={dias} />}
    </PasoLayout>
  );
};