import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import CampoFormulario from '../../utils/CampoFormulario';
import type { ICrearPacienteDTO } from '../../../types/Paciente.type';

interface Props {
    register: UseFormRegister<ICrearPacienteDTO>;
    errores: FieldErrors<ICrearPacienteDTO>;
    styles: Record<string, string>;
    editando: boolean;
}

const CuentaPaciente = ({ register, errores, styles, editando }: Props) => {
    const base = { register, errores };

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>
                {editando ? 'Cuenta de acceso' : 'Cuenta de acceso (opcional)'}
            </legend>
            <p className={styles.ayuda}>
                {editando
                    ? 'Solo el administrador puede cambiar estos datos. Dejá la contraseña vacía para no cambiarla.'
                    : 'Si completás la contraseña, el paciente podrá ingresar con su email, usuario y contraseña. Sin contraseña no se crea la cuenta.'}
            </p>
            <div className={styles.grilla}>
                <CampoFormulario
                    {...base}
                    name="user"
                    etiqueta="Usuario"
                    autoComplete="off"
                    placeholder={editando ? '' : 'Si lo dejás vacío se usa el DNI'}
                />
                {/* El ojito para ver la contraseña lo agrega CampoFormulario */}
                <CampoFormulario
                    {...base}
                    name="password"
                    etiqueta="Contraseña"
                    type="password"
                    autoComplete="new-password" // evita que el navegador complete con la contraseña de quien está logueado
                    placeholder={editando ? 'Dejar vacío para no cambiarla' : 'Mínimo 8 caracteres'}
                />
            </div>
        </fieldset>
    );
};

export default CuentaPaciente;