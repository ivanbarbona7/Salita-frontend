import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TipoTelefono, type ICrearMedicoInput } from '../../../types/Medico.types';
import CampoFormulario from '../../utils/CampoFormulario';

interface TelefonoMedicoProps {
    register: UseFormRegister<ICrearMedicoInput>;
    errores: FieldErrors<ICrearMedicoInput>;
    styles: Record<string, string>;
}

const TelefonoMedico = ({ register, errores, styles }: TelefonoMedicoProps) => {
    const base = { register, errores, styles };

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Teléfono</legend>
            <div className={styles.filaTelefono}>
                <div className={styles.campo}>
                    <label htmlFor="telefono.tipo" className={styles.label}>
                        Tipo
                    </label>
                    <select id="telefono.tipo" className={styles.campoInput} {...register('telefono.tipo')}>
                        <option value={TipoTelefono.CELULAR}>Celular</option>
                        <option value={TipoTelefono.FIJO}>Fijo</option>
                        <option value={TipoTelefono.TRABAJO}>Trabajo</option>
                    </select>
                </div>
                <CampoFormulario {...base} name="telefono.codigoArea" etiqueta="Código de área" inputMode="numeric" placeholder="3777" />
                <CampoFormulario {...base} name="telefono.numero" etiqueta="Número" inputMode="numeric" placeholder="123456" />
            </div>
        </fieldset>
    );
};

export default TelefonoMedico;