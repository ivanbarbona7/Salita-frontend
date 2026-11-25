import type { UseFormRegister } from 'react-hook-form';
import type { ICrearMedicoInput } from '../../../types/Medico.types';

interface EstadoMedicoProps {
    register: UseFormRegister<ICrearMedicoInput>;
    activo: boolean | undefined;
    styles: Record<string, string>;
}

// Solo se muestra al editar: sirve para desactivar o volver a activar al médico
const EstadoMedico = ({ register, activo, styles }: EstadoMedicoProps) => (
    <div className={activo ? styles.estado : `${styles.estado} ${styles.estadoInactivo}`}>
        <div className={styles.estadoTexto}>
            <strong>Estado del médico: {activo ? 'Activo' : 'Inactivo'}</strong>
            <span>
                {activo
                    ? 'Puede ingresar al sistema y recibir turnos.'
                    : 'No puede ingresar al sistema. Activalo para volver a habilitarlo.'}
            </span>
        </div>
        <div className={`form-check form-switch ${styles.interruptor}`}>
            <input id="activo" type="checkbox" role="switch" className="form-check-input" {...register('activo')} />
            <label htmlFor="activo" className="form-check-label">
                Médico activo
            </label>
        </div>
    </div>
);

export default EstadoMedico;