import { Row, Col } from "react-bootstrap";
import { useFetch } from "../hooks/useFetch";
import { ITurno } from "../types/Turno.Types";
import TarjetaResumen from "../components/panel/TarjetaResumen";

const Inicio = () => {
    const { data: turnos, isLoading } = useFetch<ITurno[]>("/turnos");
    const lista = turnos ?? [];
    const atendidos = lista.filter(turno => turno.estado === "atendido").length;

    const resumen = [
        { titulo: "Turnos de hoy", valor: lista.length },
        { titulo: "Pendientes", valor: lista.length - atendidos },
        { titulo: "Atendidos", valor: atendidos },
    ];

    return (
        <Row className="g-3">
            {resumen.map(item => (
                <Col key={item.titulo} xs={12} sm={4}>
                    <TarjetaResumen {...item} isLoading={isLoading} />
                </Col>
            ))}
        </Row>
    );
};

export default Inicio;