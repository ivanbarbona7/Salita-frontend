import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { ICrearMedicoDTO, ICrearMedicoInput } from '../../../types/Medico.types';
import type { IConsultorio } from '../../../types/Consultorio.types';

interface ConsultoriosMedicoProps {
    register: UseFormRegister<ICrearMedicoInput>;
    control: Control<ICrearMedicoInput, unknown, ICrearMedicoDTO>;
    errores: FieldErrors<ICrearMedicoInput>;
    styles: Record<string, string>;
    especialidadId: string; // la especialidad elegida en el formulario
    habitualId: string;     // el consultorio habitual elegido
    consultorios: IConsultorio[];
}

// Cada médico tiene un consultorio habitual (fijo) y, si hace falta, otros donde también puede atender.
// Un consultorio puede tener varios médicos: se reparten por horario en "Horario de atención".
const ConsultoriosMedico = ({
    register,
    control,
    errores,
    styles,
    especialidadId,
    habitualId,
    consultorios,
}: ConsultoriosMedicoProps) => {
    // Solo consultorios que tienen la especialidad del médico
    const delaEspecialidad = consultorios.filter((c) =>
        c.todasLasEspecialidades === true || c.especialidades.some((e) => String(e.id) === especialidadId),
    );
    const opcionesHabitual = delaEspecialidad.filter((c) => c.activo !== false || c.id === habitualId);
    const otros = delaEspecialidad.filter((c) => c.id !== habitualId);

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Consultorios</legend>
            <p className={styles.ayuda}>
                Un consultorio puede tener varios médicos, pero no a la misma hora. Los días y horarios se cargan
                después, en "Horario de atención". Sin consultorio, el médico no puede recibir turnos.
            </p>

            {!especialidadId ? (
                <p className={styles.ayuda}>Elegí primero la especialidad para ver los consultorios que la tienen.</p>
            ) : delaEspecialidad.length === 0 ? (
                <p className={styles.ayuda}>
                    Ningún consultorio tiene esta especialidad todavía. Agregásela a un consultorio desde Consultorios.
                </p>
            ) : (
                <>
                    <div className={styles.campo} style={{ maxWidth: 360 }}>
                        <label htmlFor="consultorioHabitual" className={styles.label}>
                            Consultorio habitual
                        </label>
                        <select id="consultorioHabitual" className={styles.campoInput} {...register('consultorioHabitual')}>
                            <option value="">Sin consultorio habitual (lo completo después)</option>
                            {opcionesHabitual.map((consultorio) => (
                                <option key={consultorio.id} value={consultorio.id}>
                                    {consultorio.nombre}
                                    {consultorio.activo === false ? ' (inactivo)' : ''}
                                </option>
                            ))}
                        </select>
                        {errores.consultorioHabitual && (
                            <span className={styles.textError} role="alert">
                                {errores.consultorioHabitual.message}
                            </span>
                        )}
                    </div>

                    {otros.length > 0 && (
                        <div className={`${styles.campo} ${styles.separado}`}>
                            <span className={styles.label}>Otros consultorios donde puede atender</span>
                            <Controller
                                name="consultorios"
                                control={control}
                                render={({ field }) => {
                                    const seleccionados = field.value ?? [];
                                    return (
                                        <div className={styles.grupoOpciones} role="group" aria-label="Otros consultorios">
                                            {otros.map((consultorio) => {
                                                const inactivo = consultorio.activo === false;
                                                const marcado = seleccionados.includes(consultorio.id);
                                                return (
                                                    <label key={consultorio.id} className={styles.chip}>
                                                        <input
                                                            type="checkbox"
                                                            checked={marcado}
                                                            // Un consultorio inactivo no se puede elegir, pero sí quitar si ya lo tenía
                                                            disabled={inactivo && !marcado}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                field.onChange(
                                                                    e.target.checked
                                                                        ? [...seleccionados, consultorio.id]
                                                                        : seleccionados.filter((v) => v !== consultorio.id),
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            {consultorio.nombre}
                                                            {inactivo ? ' (inactivo)' : ''}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    )}
                </>
            )}
            {errores.consultorios && (
                <span className={styles.textError} role="alert">
                    {errores.consultorios.message}
                </span>
            )}
        </fieldset>
    );
};

export default ConsultoriosMedico;