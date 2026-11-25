import { useParams, Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
  Stack,
} from "react-bootstrap";
import { useFetch } from "../../hooks/useFetch";
import type { IMedico } from "../../types/Medico.types";
import { formatoNacimiento, textoEdad } from "../utils/Edad";

const DetalleMedico = () => {
  const { id } = useParams();

  const { data: medico, isLoading } = useFetch<IMedico>(`/medicos/${id}`);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" role="status" />
        <p className="text-body-secondary mt-3">
          Cargando detalle del médico...
        </p>
      </Container>
    );
  }

  if (!medico) {
    return (
      <Container className="py-5">
        <Alert variant="warning">No se encontró el médico solicitado.</Alert>
        <Link to="/medicos" className="btn btn-outline-primary">
          Volver a la lista de médicos
        </Link>
      </Container>
    );
  }

  return (
    <Container className="pb-5">
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-start mb-4"
      >
        <div>
          <p className="text-body-secondary mb-1">Detalle del profesional</p>
          <h1 className="h2 mb-0">
            Dr/a. {medico.nombre} {medico.apellido}
          </h1>
        </div>
        <Badge
          bg={medico.activo !== false ? "success" : "danger"}
          className="fs-6"
        >
          {medico.activo !== false ? "Activo" : "Inactivo"}
        </Badge>
      </Stack>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-4">
            <Col xs={12} md={4}>
              <div className="small text-body-secondary">
                Matrícula Profesional
              </div>
              <div className="fw-semibold">
                {medico.matricula || "Sin matrícula"}
              </div>
            </Col>
            <Col xs={12} md={4}>
              <div className="small text-body-secondary">Especialidad</div>
              <div className="fw-semibold text-capitalize">
                {medico.especialidad?.nombre ?? "Sin especificar"}
               </div>
            </Col>

            <Col xs={12} md={4}>
              <div className="small text-body-secondary">
                Identificador (ID)
              </div>
              <div className="fw-semibold text-break">
                {medico.id}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Row className="g-4">
        <Col xs={12} lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold">
              Datos Personales y Contacto
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <span className="text-body-secondary">DNI</span>
                <br />
                {medico.dni || "No registrado"}
              </ListGroup.Item>
              <ListGroup.Item>
                <span className="text-body-secondary">Fecha de nacimiento</span>
                <br />
                {medico.fechaNacimiento
                  ? `${formatoNacimiento(medico.fechaNacimiento)} (${textoEdad(medico.fechaNacimiento)})`
                  : "Sin cargar"}
              </ListGroup.Item>
              <ListGroup.Item>
                <span className="text-body-secondary">Email</span>
                <br />
                {medico.email || "No registrado"}
              </ListGroup.Item>
              <ListGroup.Item>
                <span className="text-body-secondary">Teléfono</span>
                <br />
                {medico.telefono
                  ? `(${medico.telefono.codigoArea || ""}) ${medico.telefono.numero || ""}`
                  : "No registrado"}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* Información Profesional / Adicional */}
        <Col xs={12} lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold">
              Información Profesional
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <span className="text-body-secondary">Tipo de Teléfono</span>
                <br />
                {medico.telefono?.tipo || "No registrado"}
              </ListGroup.Item>
              <ListGroup.Item>
                <span className="text-body-secondary">Estado en Sistema</span>
                <br />
                {medico.activo !== false
                  ? "Habilitado para atender"
                  : "Deshabilitado"}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
      <Link
        to="/medicos"
        className="btn btn-outline-secondary mt-4"
      >
        Volver a la lista de médicos
      </Link>
    </Container>
  );
};

export default DetalleMedico;