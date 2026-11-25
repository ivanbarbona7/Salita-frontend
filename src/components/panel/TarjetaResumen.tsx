
import { Card, Placeholder } from "react-bootstrap";
import styles from "./TarjetaResumen.module.scss";

interface Props {
    titulo: string;
    valor: number;
    isLoading: boolean;
}

const TarjetaResumen = ({ titulo, valor, isLoading }: Props) => (
    <Card className={styles.tarjeta}>
        <Card.Body>
            <Card.Subtitle className="text-muted mb-2">{titulo}</Card.Subtitle>
            {isLoading ? (
                <Placeholder as="div" animation="glow"><Placeholder xs={4} size="lg" /></Placeholder>
            ) : (
                <Card.Title className={styles.valor}>{valor}</Card.Title>
            )}
        </Card.Body>
    </Card>
);

export default TarjetaResumen;