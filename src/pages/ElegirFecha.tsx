import { useState } from 'react';
import { Alert, Button, Stack } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Cargando } from '../components/Cargando';
import { PasoLayout } from '../components/PasoLayout';
import { useFetch } from '../hooks/useFetch';
import type { Disponibilidad } from '../types/Paciente.type';
import { etiquetaDia } from '../components/utils/fecha';

export const ElegirFecha = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const medicoId = params.get('medicoId') ?? '';
  const [dia, setDia] = useState<string | null>(null);
  const { data, isLoading } = useFetch<Disponibilidad>(`/medicos/${medicoId}/disponibilidad`);
  const dias = Object.keys(data ?? {});

  const elegirHora = (hora: string) => {
    const fecha = new Date(`${dia}T${hora}`).toISOString();
    navigate(`/pacientes/turno/confirmar?${new URLSearchParams({ medicoId, fecha })}`);
  };

  return (
    <PasoLayout titulo="Elegí el día y la hora" paso={3}>
      {isLoading ? (
        <Cargando />
      ) : dias.length === 0 ? (
        <Alert variant="info" className="fs-5">Este médico no tiene turnos disponibles por ahora.</Alert>
      ) : (
        <>
          <h2 className="h4">Día</h2>
          <Stack direction="horizontal" gap={2} className="flex-wrap mb-4">
            {dias.map((d) => (
              <Button key={d} size="lg" variant={d === dia ? 'primary' : 'outline-primary'} onClick={() => setDia(d)}>
                {etiquetaDia(d)}
              </Button>
            ))}
          </Stack>
          {dia && (
            <>
              <h2 className="h4">Hora</h2>
              <Stack direction="horizontal" gap={2} className="flex-wrap">
                {data?.[dia]?.map((h) => (
                  <Button key={h} size="lg" variant="outline-success" onClick={() => elegirHora(h)}>{h}</Button>
                ))}
              </Stack>
            </>
          )}
        </>
      )}
    </PasoLayout>
  );
};