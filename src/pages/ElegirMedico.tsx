import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListaOpciones } from '../components/ListaOpciones';
import { PasoLayout } from '../components/PasoLayout';
import { useFetch } from '../hooks/useFetch';
import type { IMedicoDisponible } from '../types/Paciente.type';
import { formatearTurno } from '../components/utils/fecha';

export const ElegirMedico = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const especialidadId = params.get('especialidadId') ?? '';
  const { data, isLoading } = useFetch<IMedicoDisponible[]>(`/medicos?especialidadId=${especialidadId}`);

  return (
    <PasoLayout titulo="Elegí tu médico" paso={2}>
      <ListaOpciones
        opciones={data?.map((m) => ({
          id: m.id,
          titulo: m.nombre,
          detalle: m.proximoTurno ? `Próximo turno: ${formatearTurno(m.proximoTurno)}` : undefined,
        }))}
        isLoading={isLoading}
        vacio="No hay médicos con turnos disponibles por ahora."
        onElegir={(medicoId) =>
          navigate(`/pacientes/turno/fecha?${new URLSearchParams({ especialidadId, medicoId })}`)
        }
      />
    </PasoLayout>
  );
};