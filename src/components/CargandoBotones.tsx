import { Placeholder } from 'react-bootstrap';

// Esqueleto de una lista de botones grandes mientras llegan los datos
export const CargandoBotones = ({ cantidad = 4 }: { cantidad?: number }) => (
  <Placeholder animation="glow" aria-busy="true">
    {Array.from({ length: cantidad }, (_, i) => (
      <Placeholder.Button key={i} xs={12} size="lg" variant="secondary" className="mb-3 py-4" />
    ))}
  </Placeholder>
);