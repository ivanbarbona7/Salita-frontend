import  {Button, Card} from 'react-bootstrap'
import type { ButtonProps } from "react-bootstrap";

interface PacienteCardProps {
    nombre: string;
    obraSocial?: string;
    dni: string;
    variant?: ButtonProps["variant"];
}

const PacienteCard = ({ nombre, obraSocial = "Particular", dni, variant }:PacienteCardProps) => {
  return (
    <Card style={{ width: '18rem', marginBottom: '1rem' }} className="p-3" >
      <h2>
        Nombre: {nombre}
      </h2>

      <p >
        Obra Social: {obraSocial}
      </p>

      <p >
        DNI: {dni}
      </p>

      <Button variant={variant} size="sm">
        Ver historia clinica
      </Button>
    </Card>
  );
};

export default PacienteCard;