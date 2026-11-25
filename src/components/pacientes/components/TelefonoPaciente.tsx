import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import CampoFormulario from '../../utils/CampoFormulario';
import type { ICrearPacienteDTO } from '../../../types/Paciente.type';

interface Props {
    register: UseFormRegister<ICrearPacienteDTO>;
    errores: FieldErrors<ICrearPacienteDTO>;
    styles: Record<string, string>;
}

const TelefonoPaciente = ({ register, errores, styles }: Props) => {
    const base = { register, errores };

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Teléfono</legend>
            <div className={styles.filaTelefono}>
                <div className={styles.campo}>
                    <label htmlFor="telefono.tipo" className={styles.label}>Tipo</label>
                    <select id="telefono.tipo" className={styles.campoInput} {...register('telefono.tipo')}>
                        <option value="CELULAR">Celular</option>
                        <option value="FIJO">Fijo</option>
                    </select>
                </div>
                <CampoFormulario {...base} name="telefono.codigoArea" etiqueta="Código de área" inputMode="numeric" placeholder="3777" />
                <CampoFormulario {...base} name="telefono.numero" etiqueta="Número" inputMode="numeric" placeholder="500032" />
            </div>
        </fieldset>
    );
};

export default TelefonoPaciente;