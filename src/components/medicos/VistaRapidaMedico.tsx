import { formatoNacimiento, textoEdad } from '../utils/Edad';
import { Link } from 'react-router-dom';
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap';
import { CalendarWeek, PencilSquare, Trash } from 'react-bootstrap-icons';
import { resumirHorario } from '../utils/ResumirHorario';
import type { IMedico } from '../../types/Medico.types';

interface Props {
    medico: IMedico | null;
    esAdmin: boolean;
    onCerrar: () => void;
    onDesactivar: (medico: IMedico) => void;
}

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div className="mb-3">
        <div className="small text-muted">{etiqueta}</div>
        <div className="fw-semibold">{children}</div>
    </div>
);

// Vista rápida: usa los datos que ya trae la lista, sin otra consulta
const VistaRapidaMedico = ({ medico, esAdmin, onCerrar, onDesactivar }: Props) => {
    const activo = medico?.activo !== false;
    const consultorios = medico?.consultorios ?? [];
    const nombres = new Map(consultorios.map((c) => [c.id, c.nombre]));
    const horario = resumirHorario(medico?.horarioAtencion?.franjas ?? [], (id) => nombres.get(id));

    return (
        <Modal show={medico !== null} onHide={onCerrar} centered size="lg" fullscreen="sm-down">
            <Modal.Header closeButton>
                <Modal.Title className="h5 d-flex flex-wrap align-items-center gap-2">
                    {medico?.apellido}, {medico?.nombre}
                    <Badge bg={activo ? 'success' : 'secondary'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                </Modal.Title>
            </Modal.Header>

            {medico && (
                <Modal.Body>
                    <Row>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Especialidad">{medico.especialidad?.nombre ?? 'Sin especialidad'}</Dato>
                            <Dato etiqueta="Matrícula">{medico.matricula ?? '—'}</Dato>
                            <Dato etiqueta="DNI">{medico.dni}</Dato>
                            <Dato etiqueta="Nacimiento">
                                {medico.fechaNacimiento ? `${formatoNacimiento(medico.fechaNacimiento)} (${textoEdad(medico.fechaNacimiento)})` : 'Sin cargar'}
                            </Dato>
                            <Dato etiqueta="Contacto">
                                {medico.telefono ? `${medico.telefono.codigoArea} ${medico.telefono.numero}` : '—'}
                                <div className="small fw-normal text-muted">{medico.email}</div>
                            </Dato>
                        </Col>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Consultorios">
                                {consultorios.length === 0 ? (
                                    <span className="fw-normal text-muted">Sin consultorio asignado</span>
                                ) : (
                                    consultorios.map((c) => (
                                        <div key={c.id}>
                                            {c.nombre}
                                            {medico.consultorioHabitual?.id === c.id && (
                                                <Badge bg="info" className="ms-2">Habitual</Badge>
                                            )}
                                        </div>
                                    ))
                                )}
                            </Dato>
                            <Dato etiqueta="Horario de atención">
                                {horario.length === 0 ? (
                                    <span className="fw-normal text-muted">Todavía no tiene horario cargado</span>
                                ) : (
                                    horario.map((linea) => (
                                        <div key={linea.dia} className="fw-normal">
                                            <strong>{linea.dia}</strong> {linea.horas}
                                        </div>
                                    ))
                                )}
                            </Dato>
                        </Col>
                    </Row>
                </Modal.Body>
            )}

            <Modal.Footer className="flex-column flex-sm-row">
                {medico && esAdmin && activo && (
                    <Button variant="outline-danger" className="w-100 w-sm-auto me-sm-auto" onClick={() => onDesactivar(medico)}>
                        <Trash className="me-1" /> Desactivar
                    </Button>
                )}
                {medico && (
                    <Link to={`/horarios/${medico.id}`} className="btn btn-outline-secondary w-100 w-sm-auto">
                        <CalendarWeek className="me-1" /> Editar horario
                    </Link>
                )}
                {medico && esAdmin && (
                    <Link to={`/medicos/editar/${medico.id}`} className="btn btn-primary w-100 w-sm-auto">
                        <PencilSquare className="me-1" /> Editar
                    </Link>
                )}
                <Button variant="secondary" className="w-100 w-sm-auto" onClick={onCerrar}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default VistaRapidaMedico;