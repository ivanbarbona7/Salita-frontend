import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { formatearTurno } from '../utils/fecha';
import HorariosLibres from './HorariosLibres';
import CampoFecha from '../utils/CampoFecha';
import type { ITurno } from '../../types/Turno.Types';

interface Props {
    turno: ITurno | null;
    onCerrar: () => void;
    onReprogramado: () => void;
}

const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

// RECEPCIÓN / ADMIN: cambia la fecha de un turno pendiente. Mismo médico y consultorio, sin límite de veces.
const ReprogramarTurnoModal = ({ turno, onCerrar, onReprogramado }: Props) => {
    const [fecha, setFecha] = useState('');
    const [horario, setHorario] = useState<string | null>(null);
    const [enCurso, setEnCurso] = useState(false);

    const cerrar = () => {
        setFecha('');
        setHorario(null);
        onCerrar();
    };

    const guardar = async () => {
        if (!turno || !horario) return;
        setEnCurso(true);
        try {
            await clientesAxios.patch(`/turnos/${turno.id}/reprogramar`, { fechaTurno: horario });
            toast.success('Turno reprogramado');
            setFecha('');
            setHorario(null);
            onReprogramado();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
            setHorario(null); // si el horario se ocupó, hay que elegir otro
        } finally {
            setEnCurso(false);
        }
    };

    return (
        <Modal show={turno !== null} onHide={cerrar} centered>
            <Modal.Header closeButton>
                <Modal.Title className="h5">Reprogramar turno</Modal.Title>
            </Modal.Header>
            {turno && turno.consultorio && (
                <Modal.Body>
                    <p className="mb-1">
                        <strong>{turno.paciente.apellido}, {turno.paciente.nombre}</strong> con {turno.medico.apellido},{' '}
                        {turno.medico.nombre}
                    </p>
                    <p className="text-muted small">
                        Turno actual: <span className="text-capitalize">{formatearTurno(turno.fechaTurno)}</span> hs ·{' '}
                        {turno.consultorio.nombre}. Se mantiene el médico y el consultorio.
                    </p>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="nueva-fecha">Nuevo día</Form.Label>
                        <CampoFecha
                            id="nueva-fecha"
                            min={hoyAR()}
                            valor={fecha}
                            onChange={(dia) => {
                                setFecha(dia);
                                setHorario(null);
                            }}
                        />
                    </Form.Group>

                    {fecha && (
                        <HorariosLibres
                            key={fecha}
                            medicoId={turno.medico.id}
                            consultorioId={turno.consultorio.id}
                            fecha={fecha}
                            elegido={horario}
                            onElegir={setHorario}
                        />
                    )}
                </Modal.Body>
            )}
            <Modal.Footer>
                <Button variant="secondary" onClick={cerrar} disabled={enCurso}>Cancelar</Button>
                <Button onClick={() => void guardar()} disabled={!horario || enCurso}>
                    {enCurso ? 'Guardando...' : 'Reprogramar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReprogramarTurnoModal;