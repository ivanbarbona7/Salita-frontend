import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import CampoFormulario from '../../utils/CampoFormulario';
import { useFetch } from '../../../hooks/useFetch';
import type { ICrearPacienteDTO } from '../../../types/Paciente.type';
import { OBRA_SOCIAL_POR_DEFECTO, type IObraSocialItem } from '../../../types/ObraSocial.types';

interface Props {
    register: UseFormRegister<ICrearPacienteDTO>;
    errores: FieldErrors<ICrearPacienteDTO>;
    styles: Record<string, string>;
    // Obra social que ya tiene el paciente (al editar). Se ofrece aunque la hayan desactivado después.
    actual?: string | undefined;
}

// La lista sale del catálogo (Configuración > Obras sociales): solo se puede elegir una cargada
const ObraSocialPaciente = ({ register, errores, styles, actual }: Props) => {
    const base = { register, errores };
    const { data: catalogo } = useFetch<IObraSocialItem[]>('/obras-sociales?activas=true');

    // "NINGUNA" y la actual siempre están, aunque el catálogo todavía no haya llegado
    const nombres = Array.from(new Set([OBRA_SOCIAL_POR_DEFECTO, ...(actual ? [actual] : []), ...(catalogo ?? []).map((o) => o.nombre)]));

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Obra social</legend>
            <div className={styles.grilla}>
                <div className={styles.campo}>
                    <label htmlFor="obraSocial-nombre" className={styles.label}>Obra social</label>
                    <select id="obraSocial-nombre" className={styles.campoInput} {...register('obraSocial.nombre')}>
                        {nombres.map((nombre) => (
                            <option key={nombre} value={nombre}>{nombre}</option>
                        ))}
                    </select>
                    {errores.obraSocial?.nombre && (
                        <span className={styles.textError} role="alert">{errores.obraSocial.nombre.message}</span>
                    )}
                    <span className={styles.ayuda} style={{ margin: '6px 0 0' }}>
                        ¿Falta una? Se carga en Configuración &gt; Obras sociales.
                    </span>
                </div>
                <CampoFormulario {...base} name="obraSocial.numeroAfiliado" etiqueta="Nº de afiliado" inputMode="numeric" placeholder="123456789" />
            </div>
        </fieldset>
    );
};

export default ObraSocialPaciente;