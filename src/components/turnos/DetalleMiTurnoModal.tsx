import { Badge, Button, Modal } from 'react-bootstrap';
import { formatearTurno } from '../utils/fecha';
import { direccionTexto, type IMiTurno } from '../../types/TurnosPaciente.types';

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div className="mb-3">
        <div className="small text-muted">{etiqueta}</div>
        <div className="fs-5">{children}</div>
    </div>
);

const ESTADO = { pendiente: ['warning', 'Pendiente'], atendido: ['success', 'Atendido'], cancelado: ['secondary', 'Cancelado'], no_asistio: ['dark', 'No asistió'] } as const;

// Detalle de un turno del paciente
const DetalleMiTurnoModal = ({ turno, onCerrar }: { turno: IMiTurno | null; onCerrar: () => void }) => (
    <Modal show={turno !== null} onHide={onCerrar} centered fullscreen="sm-down">
        <Modal.Header closeButton>
            <Modal.Title className="h5 d-flex align-items-center gap-2">
                Detalle del turno
                {turno && <Badge bg={ESTADO[turno.estado][0]} text={turno.estado === 'pendiente' ? 'dark' : undefined}>{ESTADO[turno.estado][1]}</Badge>}
            </Modal.Title>
        </Modal.Header>
        {turno && (
            <Modal.Body>
                <Dato etiqueta="Fecha y hora"><span className="text-capitalize">{formatearTurno(turno.fechaTurno)} hs</span></Dato>
                <Dato etiqueta="Médico">{turno.medico.apellido}, {turno.medico.nombre}</Dato>
                <Dato etiqueta="Especialidad">{turno.especialidad.nombre}</Dato>
                <Dato etiqueta="Lugar">
                    {turno.consultorio.nombre}
                    <div className="fs-6 text-muted">{direccionTexto(turno.consultorio)}</div>
                </Dato>
                {turno.observaciones && <Dato etiqueta="Observaciones">{turno.observaciones}</Dato>}
                {turno.reprogramado && <p className="text-muted mb-0">Este turno ya fue reprogramado.</p>}
            </Modal.Body>
        )}
        <Modal.Footer>
            <Button variant="secondary" size="lg" onClick={onCerrar}>Cerrar</Button>
        </Modal.Footer>
    </Modal>
);

export default DetalleMiTurnoModal;