import { useState } from 'react';
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap';
import { CalendarEvent, CheckLg, Trash } from 'react-bootstrap-icons';
import ReprogramarTurnoModal from './ReprogramarTurnoModal';
import type { ITurno } from '../../types/Turno.Types';
import { esUrgencia } from '../utils/EsUrgencia';
import { aFecha } from '../utils/fecha';
import { nombreObraSocial } from '../utils/ObraSocial';
import { formatearTelefono } from '../utils/telefono';

interface Props {
    turno: ITurno | null;
    puedeEliminar: boolean;
    onCerrar: () => void;
    onAtendido: (id: string) => Promise<void>;
    onEliminar: (id: string) => void;
    // Se llama después de reprogramar, para que la pantalla recargue los turnos
    onReprogramado: () => void;
}

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div className="mb-3">
        <div className="small text-muted">{etiqueta}</div>
        <div className="fw-semibold">{children}</div>
    </div>
);

// Detalle rápido de un turno sin salir del dashboard (usa los datos que ya trae la lista)
const DetalleTurnoModal = ({ turno, puedeEliminar, onCerrar, onAtendido, onEliminar, onReprogramado }: Props) => {
    const [reprogramando, setReprogramando] = useState(false);
    const fecha = turno ? aFecha(turno.fechaTurno) : null;
    const atendido = turno?.estado === 'atendido';
    const noAsistio = turno?.estado === 'no_asistio';
    const paciente = turno?.paciente;

    return (
        <>
        <Modal show={turno !== null && !reprogramando} onHide={onCerrar} centered size="lg" fullscreen="sm-down">
            <Modal.Header closeButton>
                <Modal.Title className="h5 d-flex flex-wrap align-items-center gap-2">
                    Detalle del turno
                    {turno && (
                        <Badge bg={atendido ? 'success' : noAsistio ? 'dark' : 'warning'} text={atendido || noAsistio ? undefined : 'dark'}>
                            {atendido ? 'Atendido' : noAsistio ? 'No asistió' : 'Pendiente'}
                        </Badge>
                    )}
                    {turno && esUrgencia(turno) && <Badge bg="danger">Urgencia</Badge>}
                </Modal.Title>
            </Modal.Header>

            {turno && fecha && (
                <Modal.Body>
                    <Row>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Fecha y hora">
                                <span className="text-capitalize">
                                    {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                                {' · '}
                                {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                            </Dato>
                            <Dato etiqueta="Paciente">
                                {paciente ? `${paciente.apellido}, ${paciente.nombre}` : 'Sin asignar'}
                                {paciente && <div className="small fw-normal text-muted">DNI {paciente.dni}</div>}
                            </Dato>
                            {paciente?.telefono && (
                                <Dato etiqueta="Teléfono">{formatearTelefono(paciente.telefono)}</Dato>
                            )}
                            {paciente?.obraSocial?.nombre && (
                                <Dato etiqueta="Obra social">
                                    {nombreObraSocial(paciente.obraSocial)}
                                    {paciente.obraSocial.numeroAfiliado ? ` · Afiliado ${paciente.obraSocial.numeroAfiliado}` : ''}
                                </Dato>
                            )}
                        </Col>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Médico">{turno.medico.apellido}, {turno.medico.nombre}</Dato>
                            <Dato etiqueta="Especialidad">{turno.especialidad?.nombre ?? '—'}</Dato>
                            <Dato etiqueta="Consultorio">{turno.consultorio?.nombre ?? '—'}</Dato>
                            {turno.observaciones && <Dato etiqueta="Observaciones">{turno.observaciones}</Dato>}
                        </Col>
                    </Row>
                </Modal.Body>
            )}

            <Modal.Footer className="flex-column flex-sm-row">
                {turno && puedeEliminar && (
                    <Button variant="outline-danger" className="w-100 w-sm-auto me-sm-auto" onClick={() => onEliminar(turno.id)}>
                        <Trash className="me-1" /> Eliminar
                    </Button>
                )}
                {turno && turno.estado === 'pendiente' && turno.consultorio && (
                    <Button variant="outline-primary" className="w-100 w-sm-auto" onClick={() => setReprogramando(true)}>
                        <CalendarEvent className="me-1" /> Reprogramar
                    </Button>
                )}
                {turno && turno.estado === 'pendiente' && (
                    <Button variant="success" className="w-100 w-sm-auto" onClick={() => void onAtendido(turno.id)}>
                        <CheckLg className="me-1" /> Marcar como atendido
                    </Button>
                )}
                <Button variant="secondary" className="w-100 w-sm-auto" onClick={onCerrar}>Cerrar</Button>
            </Modal.Footer>
        </Modal>

        <ReprogramarTurnoModal
            turno={reprogramando ? turno : null}
            onCerrar={() => setReprogramando(false)}
            onReprogramado={() => {
                setReprogramando(false);
                onReprogramado();
            }}
        />
        </>
    );
};

export default DetalleTurnoModal;