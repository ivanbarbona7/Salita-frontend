import { Alert } from "react-bootstrap";

interface Props {
    titulo: string;
}

const EnConstruccion = ({ titulo }: Props) => (
    <Alert variant="info">
        <Alert.Heading>{titulo}</Alert.Heading>
        Esta pantalla todavía está en construcción.
    </Alert>
);

export default EnConstruccion;

