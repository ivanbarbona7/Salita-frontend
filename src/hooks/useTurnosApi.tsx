import clientesAxios from '../config/axios';
import type { IIngresoDTO } from '../types/Paciente.type';
import type { ICrearTurnoPacienteDTO } from '../types/TurnosPaciente.types';

export const useIngresoRapido = () => async (datos: IIngresoDTO) => {
  const { data } = await clientesAxios.post<{ token: string }>('/pacientes/ingreso', datos);
  return data;
};

// CAMBIO: antes mandaba { medicoId, fecha }. Ahora lleva toda la cadena (el paciente sale del token).
export const useCrearTurnoPaciente = () => async (datos: ICrearTurnoPacienteDTO) => {
  await clientesAxios.post('/turnos/paciente', datos);
};

export const useReprogramarTurnoPaciente = () => async (id: string, fechaTurno: string) => {
  await clientesAxios.patch(`/turnos/paciente/${id}/reprogramar`, { fechaTurno });
};

export const useCancelarTurno = () => async (id: string) => {
  await clientesAxios.patch(`/turnos/paciente/${id}/cancelar`);
};