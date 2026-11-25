import { Alert, Button, Stack } from 'react-bootstrap';
import { Cargando } from './Cargando';

interface Opcion { id: string; titulo: string; detalle?: string }
interface Props {
  opciones: Opcion[] | undefined;
  isLoading: boolean;
  vacio: string;
  onElegir: (id: string) => void;
}

export const ListaOpciones = ({ opciones, isLoading, vacio, onElegir }: Props) => {
  if (isLoading) return <Cargando />;
  if (!opciones?.length) return <Alert variant="info" className="fs-5">{vacio}</Alert>;

  return (
    <Stack gap={3}>
      {opciones.map((o) => (
        <Button key={o.id} size="lg" variant="outline-primary" className="py-3 text-start" onClick={() => onElegir(o.id)}>
          <strong>{o.titulo}</strong>
          {o.detalle && <div className="small">{o.detalle}</div>}
        </Button>
      ))}
    </Stack>
  );
};