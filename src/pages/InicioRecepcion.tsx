import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PasoLayout } from '../components/PasoLayout';

export const InicioRecepcion = () => {
  const navigate = useNavigate();
  const salir = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  return (
    <PasoLayout titulo="Recepción" sinVolver>
      <Button variant="outline-secondary" onClick={salir}>Salir</Button>
    </PasoLayout>
  );
};