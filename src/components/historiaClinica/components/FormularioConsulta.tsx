import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../../config/axios';
import { obtenerMensajeError } from '../../utils/obtenerMensajeError';
import ModalConfirmar from '../../utils/ModalConfirmar';
import CampoTextarea from '../../utils/CampoTextarea';
import formulario from '../../utils/Formulario.module.scss';
import styles from '../HistoriaClinica.module.scss';
import {
    consultaFormSchema,
    formularioAConsulta,
    type IConsultaForm,
    type ITurnoParaAtender,
} from '../../../types/HistoriaClinica.types';

const formatoTurno = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
    });

interface Props {
    pacienteId: string;
    turnos: ITurnoParaAtender[];
    onTerminar: (guardada: boolean) => void;
}

// Agrega una consulta a la historia. Una vez guardada no se puede editar ni borrar,
// por eso se pide confirmación antes de enviarla.
const FormularioConsulta = ({ pacienteId, turnos, onTerminar }: Props) => {
    const [pendiente, setPendiente] = useState<IConsultaForm | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<IConsultaForm>({
        resolver: zodResolver(consultaFormSchema),
        // Si hay turnos para atender, se propone el más reciente (el primero de la lista)
        defaultValues: { turno: turnos[0]?.id ?? '', motivoConsulta: '', sintomas: '', diagnostico: '', tratamiento: '', observaciones: '' },
    });

    const base = { register, errores: errors };

    const enviar = async () => {
        if (!pendiente) return;
        try {
            await clientesAxios.post(`/historias-clinicas/paciente/${pacienteId}/consultas`, formularioAConsulta(pendiente));
            toast.success('Consulta agregada a la historia clínica');
            onTerminar(true);
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error), { duration: 8000 });
        } finally {
            setPendiente(null);
        }
    };

    return (
        <fieldset className={formulario.seccion}>
            <legend className={formulario.seccionTitulo}>Nueva consulta</legend>

            <form onSubmit={handleSubmit(setPendiente)} noValidate>
                <div className={formulario.grilla}>
                    {turnos.length > 0 && (
                        <div className={`${formulario.campo} ${formulario.campoAncho}`}>
                            <label htmlFor="turno" className={formulario.label}>Turno que se atiende</label>
                            <select id="turno" className={formulario.campoInput} {...register('turno')}>
                                {turnos.map((t) => (
                                    <option key={t.id} value={t.id}>Turno del {formatoTurno(t.fechaTurno)}</option>
                                ))}
                                <option value="">Sin turno (no marcar ninguno como atendido)</option>
                            </select>
                            <span className={formulario.ayuda} style={{ margin: '6px 0 0' }}>
                                Al guardar, el turno elegido se marca como atendido.
                            </span>
                        </div>
                    )}

                    <CampoTextarea {...base} name="motivoConsulta" etiqueta="Motivo de consulta" filas={2} maxLength={500} />
                    <CampoTextarea
                        {...base}
                        name="sintomas"
                        etiqueta="Síntomas (opcional)"
                        ayuda="Un síntoma por línea."
                        filas={3}
                    />
                    <CampoTextarea {...base} name="diagnostico" etiqueta="Diagnóstico" filas={3} maxLength={1000} />
                    <CampoTextarea {...base} name="tratamiento" etiqueta="Tratamiento (opcional)" filas={3} maxLength={1000} />
                    <CampoTextarea {...base} name="observaciones" etiqueta="Observaciones (opcional)" filas={2} maxLength={500} />
                </div>

                <p className={styles.aviso}>
                    Una consulta guardada no se puede modificar ni borrar. Si hay un error, se corrige agregando una consulta nueva.
                </p>

                <div className={formulario.acciones}>
                    <Button type="button" className={formulario.botonSecundario} onClick={() => onTerminar(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" className={formulario.botonPrincipal}>
                        Guardar consulta
                    </Button>
                </div>
            </form>

            <ModalConfirmar
                show={pendiente !== null}
                titulo="Guardar consulta"
                mensaje="Una vez guardada, la consulta no se puede editar ni borrar. ¿Querés guardarla?"
                textoConfirmar="Sí, guardar"
                variante="success"
                onConfirmar={enviar}
                onCancelar={() => setPendiente(null)}
            />
        </fieldset>
    );
};

export default FormularioConsulta;