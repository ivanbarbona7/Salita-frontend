import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export const BotonCerrarSesion = () => {
  const navigate = useNavigate();

  const salir = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  return (
    <Button variant="outline-danger" onClick={salir}>
      Cerrar sesión
    </Button>
  );
};