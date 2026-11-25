import { Placeholder } from 'react-bootstrap';

export const Cargando = () => (
  <Placeholder animation="glow">
    {[1, 2, 3].map((n) => (
      <Placeholder key={n} xs={12} className="d-block mb-3 rounded" style={{ height: 72 }} />
    ))}
  </Placeholder>
);