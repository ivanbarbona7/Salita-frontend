import { Link } from 'react-router-dom';
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import { resumirHorario } from '../utils/ResumirHorario';
import type { IConsultorio } from '../../types/Consultorio.types';

interface Props {
    consultorio: IConsultorio | null;
    esAdmin: boolean;
    onCerrar: () => void;
    onDesactivar: (consultorio: IConsultorio) => void;
}

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div className="mb-3">
        <div className="small text-muted">{etiqueta}</div>
        <div className="fw-semibold">{children}</div>
    </div>
);

const direccionTexto = (c: IConsultorio) => {
    const { calle, numero, piso, departamento, barrio } = c.direccion;
    return `${calle} ${numero}${piso ? `, piso ${piso}` : ''}${departamento ? ` ${departamento}` : ''}${barrio ? ` · ${barrio}` : ''}, ${c.ciudad}`;
};

// Vista rápida: usa los datos que ya trae la lista, sin otra consulta
const VistaRapidaConsultorio = ({ consultorio, esAdmin, onCerrar, onDesactivar }: Props) => {
    const activo = consultorio?.activo !== false;
    const horario = resumirHorario(consultorio?.horarioAtencion?.franjas ?? []);
    const medicos = consultorio?.medicos ?? [];

    return (
        <Modal show={consultorio !== null} onHide={onCerrar} centered size="lg" fullscreen="sm-down">
            <Modal.Header closeButton>
                <Modal.Title className="h5 d-flex flex-wrap align-items-center gap-2">
                    {consultorio?.nombre}
                    <Badge bg={activo ? 'success' : 'secondary'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                </Modal.Title>
            </Modal.Header>

            {consultorio && (
                <Modal.Body>
                    <Row>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Dirección">{direccionTexto(consultorio)}</Dato>
                            <Dato etiqueta="Contacto">
                                {consultorio.telefono ? `${consultorio.telefono.codigoArea} ${consultorio.telefono.numero}` : '—'}
                                <div className="small fw-normal text-muted">{consultorio.correoElectronico}</div>
                            </Dato>
                            <Dato etiqueta="Profesional responsable">
                                {consultorio.profesionalResponsable
                                    ? `${consultorio.profesionalResponsable.apellido}, ${consultorio.profesionalResponsable.nombre}`
                                    : 'Sin responsable'}
                            </Dato>
                            <Dato etiqueta="Especialidades">
                                {consultorio.todasLasEspecialidades ? (
                                    <Badge bg="light" text="dark" className="me-1 border">Todas las especialidades</Badge>
                                ) : (
                                    consultorio.especialidades.map((e) => (
                                        <Badge key={e.id} bg="light" text="dark" className="me-1 border">{e.nombre}</Badge>
                                    ))
                                )}
                            </Dato>
                        </Col>
                        <Col xs={12} md={6}>
                            <Dato etiqueta="Horario del consultorio">
                                {horario.length === 0 ? (
                                    <span className="fw-normal text-muted">Sin horario cargado</span>
                                ) : (
                                    horario.map((linea) => (
                                        <div key={linea.dia} className="fw-normal">
                                            <strong>{linea.dia}</strong> {linea.horas}
                                        </div>
                                    ))
                                )}
                            </Dato>
                            <Dato etiqueta="Médicos que atienden acá">
                                {medicos.length === 0 ? (
                                    <span className="fw-normal text-muted">Ninguno por ahora</span>
                                ) : (
                                    medicos.map((m) => (
                                        <div key={m.id} className="fw-normal">{m.apellido}, {m.nombre}</div>
                                    ))
                                )}
                            </Dato>
                        </Col>
                    </Row>
                </Modal.Body>
            )}

            <Modal.Footer className="flex-column flex-sm-row">
                {consultorio && esAdmin && activo && (
                    <Button variant="outline-danger" className="w-100 w-sm-auto me-sm-auto" onClick={() => onDesactivar(consultorio)}>
                        <Trash className="me-1" /> Desactivar
                    </Button>
                )}
                {consultorio && esAdmin && (
                    <Link to={`/consultorios/editar/${consultorio.id}`} className="btn btn-primary w-100 w-sm-auto">
                        <PencilSquare className="me-1" /> Editar
                    </Link>
                )}
                <Button variant="secondary" className="w-100 w-sm-auto" onClick={onCerrar}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default VistaRapidaConsultorio;