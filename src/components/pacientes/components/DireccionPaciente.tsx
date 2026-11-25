import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import CampoFormulario from '../../utils/CampoFormulario';
import type { ICrearPacienteDTO } from '../../../types/Paciente.type';

interface Props {
    register: UseFormRegister<ICrearPacienteDTO>;
    errores: FieldErrors<ICrearPacienteDTO>;
    styles: Record<string, string>;
}

const DireccionPaciente = ({ register, errores, styles }: Props) => {
    const base = { register, errores };

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Dirección</legend>
            <div className={styles.grilla}>
                <CampoFormulario {...base} name="direccion.calle" etiqueta="Calle" placeholder="Ej: Sarmiento" autoComplete="off" />
                <CampoFormulario {...base} name="direccion.numero" etiqueta="Número" inputMode="numeric" placeholder="1234" />
                <CampoFormulario {...base} name="direccion.piso" etiqueta="Piso (opcional)" placeholder="2" />
                <CampoFormulario {...base} name="direccion.departamento" etiqueta="Departamento (opcional)" placeholder="A" />
                <CampoFormulario {...base} name="direccion.barrio" etiqueta="Barrio (opcional)" placeholder="Ej: Centro" ancho />
            </div>
        </fieldset>
    );
};

export default DireccionPaciente;