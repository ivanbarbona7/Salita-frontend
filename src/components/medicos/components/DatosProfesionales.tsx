import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ICrearMedicoInput } from '../../../types/Medico.types';
import type { IEspecialidad } from '../../../types/Especialidad.types';
import CampoFormulario from '../../utils/CampoFormulario';

interface DatosProfesionalesProps {
    register: UseFormRegister<ICrearMedicoInput>;
    errores: FieldErrors<ICrearMedicoInput>;
    styles: Record<string, string>;
    especialidades: IEspecialidad[];
    // Se avisa cuando cambia la especialidad para limpiar los consultorios elegidos
    alCambiarEspecialidad?: () => void;
}

const DatosProfesionales = ({ register, errores, styles, especialidades, alCambiarEspecialidad }: DatosProfesionalesProps) => (
    <fieldset className={styles.seccion}>
        <legend className={styles.seccionTitulo}>Datos profesionales</legend>
        <div className={styles.grilla}>
            <div className={styles.campo}>
                <label htmlFor="especialidad" className={styles.label}>
                    Especialidad
                </label>
                <select
                    id="especialidad"
                    className={styles.campoInput}
                    aria-invalid={errores.especialidad ? true : undefined}
                    {...register('especialidad', { onChange: alCambiarEspecialidad })}
                >
                    <option value="">Seleccioná una especialidad...</option>
                    {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.id}>
                            {esp.nombre}
                        </option>
                    ))}
                </select>
                {errores.especialidad && (
                    <span className={styles.textError} role="alert">
                        {errores.especialidad.message}
                    </span>
                )}
            </div>

            <CampoFormulario
                register={register}
                errores={errores}
                name="matricula"
                etiqueta="Matrícula profesional"
                placeholder="Ej: MP 12345"
                autoComplete="off"
            />
        </div>
    </fieldset>
);

export default DatosProfesionales;