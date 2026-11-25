import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Alert, Badge, Card, Col, Container, ListGroup, Row, Spinner, Stack } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch';
import { ITurno } from '../../types/Turno.Types';
import { formatearTelefono } from '../utils/telefono';

const DetalleTurno = () => {
    const { id } = useParams();

    const { data: turno, isLoading } = useFetch<ITurno>(`/turnos/?id=${id}`);

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" role="status" />
                <p className="text-body-secondary mt-3">Cargando detalle del turno...</p>
            </Container>
        );
    }

    if (!turno) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    No se encontró el turno solicitado.
                </Alert>
                <Link to="/" className="btn btn-outline-primary">Volver al dashboard</Link>
            </Container>
        );
    }

    const paciente = turno.paciente;
    const fecha = new Date(turno.fechaTurno);
    const historial = paciente?.historialMedico;

    return (
        <Container className="pb-5">
            <Stack direction="horizontal" className="justify-content-between align-items-start mb-4">
                <div>
                    <p className="text-body-secondary mb-1">Detalle del turno</p>
                    <h1 className="h2 mb-0">
                        {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente sin asignar"}
                    </h1>
                </div>
                <Badge
                    bg={turno.estado === "atendido" ? "success" : turno.estado === "no_asistio" ? "dark" : "warning"}
                    text={turno.estado === "pendiente" ? "dark" : undefined}
                    className="fs-6"
                >
                    {turno.estado === "atendido" ? "Atendido" : turno.estado === "no_asistio" ? "No asistió" : "En espera"}
                </Badge>
            </Stack>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-4">
                        <Col xs={12} md={3}>
                            <div className="small text-body-secondary">Fecha y hora</div>
                            <div className="fw-semibold">{fecha.toLocaleDateString("es-AR")}</div>
                            <div>{fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs</div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="small text-body-secondary">Médico</div>
                            <div className="fw-semibold">
                                {turno.medico ? `${turno.medico.apellido}, ${turno.medico.nombre}` : "Sin asignar"}
                            </div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="small text-body-secondary">Consultorio</div>
                            <div className="fw-semibold">{turno.consultorio?.nombre ?? "Sin asignar"}</div>
                        </Col>
                        <Col xs={12} md={3}>
                            <div className="small text-body-secondary">Especialidad</div>
                            <div className="fw-semibold text-capitalize">{turno.especialidad?.nombre ?? "Sin especificar"}</div>
                        </Col>
                        <Col xs={12}>
                            <div className="small text-body-secondary">Identificador</div>
                            <div className="text-break small">{turno.id}</div>
                        </Col>
                    </Row>
                    {turno.observaciones && <Card.Text className="border-top pt-3 mt-4 mb-0"><strong>Observaciones:</strong> {turno.observaciones}</Card.Text>}
                </Card.Body>
            </Card>

            {!paciente ? (
                <Alert variant="info">Este turno todavía no tiene un paciente asignado.</Alert>
            ) : (
                <Row className="g-4">
                    <Col xs={12} lg={6}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Header className="bg-white fw-semibold">Datos del paciente</Card.Header>
                            <ListGroup variant="flush">
                                <ListGroup.Item><span className="text-body-secondary">DNI</span><br />{paciente.dni}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Email</span><br />{paciente.email}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Telefono</span><br />{paciente.telefono?.numero ? formatearTelefono(paciente.telefono) : "No registrado"}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Direccion</span><br />{paciente.direccion ? `${paciente.direccion.calle} ${paciente.direccion.numero}, ${paciente.direccion.barrio}` : "No registrada"}</ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Header className="bg-white fw-semibold">Informacion medica</Card.Header>
                            <ListGroup variant="flush">
                                <ListGroup.Item><span className="text-body-secondary">Obra social</span><br />{paciente.obraSocial ? `${paciente.obraSocial.nombre} · Afiliado ${paciente.obraSocial.numeroAfiliado}` : "No registrada"}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Ultimo diagnostico</span><br />{historial?.diagnostico ?? "Sin datos"}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Tratamiento</span><br />{historial?.tratamiento ?? "Sin datos"}</ListGroup.Item>
                                <ListGroup.Item><span className="text-body-secondary">Medico</span><br />{historial?.medico ?? "Sin datos"}</ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
            )}

            <Link to="/" className="btn btn-outline-secondary mt-4">Volver al dashboard</Link>
        </Container>
    );
};

export default DetalleTurno;