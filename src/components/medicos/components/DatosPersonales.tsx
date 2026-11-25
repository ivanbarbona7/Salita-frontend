import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { nacimientoMasRecienteMedico, type ICrearMedicoInput } from '../../../types/Medico.types';
import CampoFormulario from '../../utils/CampoFormulario';
import CampoFecha from '../../utils/CampoFecha';
import { hoyDia } from '../../utils/fechaDia';

interface DatosPersonalesProps {
    register: UseFormRegister<ICrearMedicoInput>;
    control: Control<ICrearMedicoInput>;
    errores: FieldErrors<ICrearMedicoInput>;
    styles: Record<string, string>;
}

const DatosPersonales = ({ register, control, errores, styles }: DatosPersonalesProps) => {
    const base = { register, errores };
    // Tiene que ser mayor de edad (18 años cumplidos) y de no más de 100 años
    const masReciente = nacimientoMasRecienteMedico();
    const masAntigua = `${Number(hoyDia().slice(0, 4)) - 100}${hoyDia().slice(4)}`;

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Datos personales</legend>
            <div className={styles.grilla}>
                <CampoFormulario {...base} name="nombre" etiqueta="Nombre" autoComplete="off" />
                <CampoFormulario {...base} name="apellido" etiqueta="Apellido" autoComplete="off" />
                <CampoFormulario {...base} name="dni" etiqueta="DNI" inputMode="numeric" placeholder="Sin puntos" />
                <div className={styles.campo}>
                    <label htmlFor="fechaNacimiento" className={styles.label}>Fecha de nacimiento</label>
                    <Controller
                        control={control}
                        name="fechaNacimiento"
                        render={({ field }) => (
                            <CampoFecha
                                id="fechaNacimiento"
                                className={styles.campoInput}
                                valor={field.value ?? ''}
                                onChange={field.onChange}
                                min={masAntigua}
                                max={masReciente}
                                vistaInicial={masReciente}
                                anioDescendente
                            />
                        )}
                    />
                    {errores.fechaNacimiento && (
                        <span className={styles.textError} role="alert">{errores.fechaNacimiento.message}</span>
                    )}
                </div>
                <CampoFormulario {...base} name="email" etiqueta="Email" type="email" inputMode="email" />
            </div>
        </fieldset>
    );
};

export default DatosPersonales;