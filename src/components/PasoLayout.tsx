import type { ReactNode } from 'react';
import { Button, Container, ProgressBar } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion, obtenerRol } from './utils/sesion';
import styles from './PasoLayout.module.scss';

interface Props { titulo: string; paso?: number; sinVolver?: boolean; centrado?: boolean; children: ReactNode }

export const PasoLayout = ({ titulo, paso, sinVolver, centrado, children }: Props) => {
  const navigate = useNavigate();
  const hayCuenta = obtenerRol() !== null;

  const salir = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <Container className="py-4" style={{ maxWidth: 600 }}>
      {/* "Salir" aparece en todas las pantallas mientras haya una sesión abierta (útil en una compu compartida) */}
      {hayCuenta && (
        <div className="d-flex justify-content-end mb-2">
          <Button variant="outline-secondary" size="sm" onClick={salir}>
            <BoxArrowRight className="me-1" /> Cerrar sesión
          </Button>
        </div>
      )}
      {paso && <ProgressBar now={(paso / 4) * 100} label={`Paso ${paso} de 4`} className="mb-3" />}
      <h1 className={`${styles.titulo} ${centrado ? styles.centrado : ''}`}>{titulo}</h1>
      {children}
      {!sinVolver && (
        <Button variant="outline-secondary" size="lg" className="mt-4" onClick={() => navigate(-1)}>
          ← Volver
        </Button>
      )}
    </Container>
  );
};