import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../../config/axios';
import { obtenerMensajeError } from '../../utils/obtenerMensajeError';
import CampoTextarea from '../../utils/CampoTextarea';
import formulario from '../../utils/Formulario.module.scss';
import styles from '../HistoriaClinica.module.scss';
import {
    ACTIVIDADES_FISICAS,
    antecedentesAFormulario,
    antecedentesFormSchema,
    formularioAAntecedentes,
    type IAntecedentes,
    type IAntecedentesForm,
} from '../../../types/HistoriaClinica.types';

type CampoLista = 'alergias' | 'enfermedadesCronicas' | 'medicamentosHabituales' | 'cirugiasPrevias' | 'internacionesPrevias' | 'antecedentesFamiliares' | 'vacunas';

const LISTAS: { campo: CampoLista; etiqueta: string }[] = [
    { campo: 'alergias', etiqueta: 'Alergias' },
    { campo: 'enfermedadesCronicas', etiqueta: 'Enfermedades crónicas' },
    { campo: 'medicamentosHabituales', etiqueta: 'Medicamentos habituales' },
    { campo: 'cirugiasPrevias', etiqueta: 'Cirugías previas' },
    { campo: 'internacionesPrevias', etiqueta: 'Internaciones previas' },
    { campo: 'antecedentesFamiliares', etiqueta: 'Antecedentes familiares' },
    { campo: 'vacunas', etiqueta: 'Vacunas' },
];

// ---------- Edición ----------
interface FormularioProps {
    pacienteId: string;
    antecedentes?: IAntecedentes;
    onTerminar: () => void;
}

// Se monta recién al empezar a editar, así los valores iniciales son siempre los actuales
const FormularioAntecedentes = ({ pacienteId, antecedentes, onTerminar }: FormularioProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<IAntecedentesForm>({
        resolver: zodResolver(antecedentesFormSchema),
        defaultValues: antecedentesAFormulario(antecedentes),
    });

    const base = { register, errores: errors };

    const guardar = async (datos: IAntecedentesForm) => {
        try {
            await clientesAxios.put(`/historias-clinicas/paciente/${pacienteId}/antecedentes`, formularioAAntecedentes(datos));
            toast.success('Antecedentes guardados');
            onTerminar();
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(guardar)} noValidate>
            <p className={formulario.ayuda}>Escribí un ítem por línea.</p>
            <div className={formulario.grilla}>
                {LISTAS.map(({ campo, etiqueta }) => (
                    <CampoTextarea key={campo} {...base} name={campo} etiqueta={etiqueta} filas={3} ancho={false} />
                ))}
                <CampoTextarea {...base} name="otros" etiqueta="Otros antecedentes" filas={3} maxLength={500} ancho={false} />
            </div>

            <h3 className={formulario.seccionTitulo} style={{ marginTop: 16 }}>Hábitos</h3>
            <div className={styles.opciones}>
                <label><input type="checkbox" {...register('tabaquismo')} /> Tabaquismo</label>
                <label><input type="checkbox" {...register('alcohol')} /> Consumo de alcohol</label>
                <label>
                    Actividad física{' '}
                    <select className={formulario.campoInput} style={{ width: 'auto', display: 'inline-block' }} {...register('actividadFisica')}>
                        {ACTIVIDADES_FISICAS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className={formulario.acciones}>
                <Button type="button" className={formulario.botonSecundario} onClick={onTerminar} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" className={formulario.botonPrincipal} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar antecedentes'}
                </Button>
            </div>
        </form>
    );
};

// ---------- Lectura ----------
const Lista = ({ etiqueta, items }: { etiqueta: string; items: string[] }) => (
    <div className={formulario.campo}>
        <span className={formulario.label}>{etiqueta}</span>
        {items.length === 0 ? (
            <span className={styles.vacio}>Sin datos</span>
        ) : (
            <div>
                {items.map((item, i) => (
                    <span key={`${item}-${i}`} className={styles.chip}>{item}</span>
                ))}
            </div>
        )}
    </div>
);

interface Props {
    pacienteId: string;
    antecedentes?: IAntecedentes | undefined;
    onCambio: () => void;
}

const PanelAntecedentes = ({ pacienteId, antecedentes, onCambio }: Props) => {
    const [editando, setEditando] = useState(false);

    return (
        <fieldset className={formulario.seccion}>
            <legend className={formulario.seccionTitulo}>Antecedentes</legend>

            {editando ? (
                <FormularioAntecedentes
                    pacienteId={pacienteId}
                    antecedentes={antecedentes}
                    onTerminar={() => {
                        setEditando(false);
                        onCambio();
                    }}
                />
            ) : (
                <>
                    {!antecedentes && (
                        <p className={styles.vacio}>Todavía no hay antecedentes cargados para este paciente.</p>
                    )}
                    {antecedentes && (
                        <>
                            <div className={formulario.grilla}>
                                {LISTAS.map(({ campo, etiqueta }) => (
                                    <Lista key={campo} etiqueta={etiqueta} items={antecedentes[campo]} />
                                ))}
                                <div className={formulario.campo}>
                                    <span className={formulario.label}>Hábitos</span>
                                    <span>
                                        Tabaquismo: {antecedentes.habitos.tabaquismo ? 'Sí' : 'No'} · Alcohol:{' '}
                                        {antecedentes.habitos.alcohol ? 'Sí' : 'No'} · Actividad física:{' '}
                                        {antecedentes.habitos.actividadFisica}
                                    </span>
                                </div>
                                <div className={formulario.campo}>
                                    <span className={formulario.label}>Otros antecedentes</span>
                                    {antecedentes.otros ? (
                                        <span className={styles.texto}>{antecedentes.otros}</span>
                                    ) : (
                                        <span className={styles.vacio}>Sin datos</span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    <div className="mt-3">
                        <Button type="button" className={formulario.botonChico} onClick={() => setEditando(true)}>
                            <PencilSquare size={14} /> {antecedentes ? 'Editar antecedentes' : 'Cargar antecedentes'}
                        </Button>
                    </div>
                </>
            )}
        </fieldset>
    );
};

export default PanelAntecedentes;