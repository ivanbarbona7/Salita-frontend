import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { PlusLg } from 'react-bootstrap-icons';
import { useFetch } from '../../hooks/useFetch';
import { obtenerRol } from '../utils/sesion';
import formulario from '../utils/Formulario.module.scss';
import { textoEdad } from '../utils/Edad';
import PanelAntecedentes from './components/PanelAntecedentes';
import FormularioConsulta from './components/FormularioConsulta';
import ListaConsultas from './components/ListaConsultas';
import type { IPaciente } from '../../types/Paciente.type';
import type { IHistoriaClinica, ITurnoParaAtender } from '../../types/HistoriaClinica.types';

interface PantallaProps {
    pacienteId: string;
}

const Pantalla = ({ pacienteId }: PantallaProps) => {
    // Agregar consultas es solo del médico; ver y editar antecedentes, también el admin
    const esMedico = obtenerRol() === 'MEDICO';
    const [agregando, setAgregando] = useState(false);

    const { data: paciente, error: errorPaciente } = useFetch<IPaciente>(`/Pacientes/${pacienteId}`);
    const { data: historia, isLoading, error, refetch } = useFetch<IHistoriaClinica | null>(
        `/historias-clinicas/paciente/${pacienteId}`,
    );
    // Turnos que el médico puede atender con esta consulta (null = no pedir nada)
    const { data: turnos, isLoading: cargandoTurnos, refetch: refetchTurnos } = useFetch<ITurnoParaAtender[]>(
        esMedico ? `/historias-clinicas/paciente/${pacienteId}/turnos-pendientes` : null,
    );

    if (isLoading) {
        return (
            <div className={formulario.pagina} aria-busy="true">
                <div className={formulario.contenedorFormulario}>
                    <Placeholder as="h3" animation="glow" className="text-center">
                        <Placeholder xs={6} />
                    </Placeholder>
                    {Array.from({ length: 3 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '7rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    if (error || errorPaciente) {
        return (
            <div className={formulario.pagina}>
                <div className={formulario.contenedorFormulario}>
                    <Alert variant="danger">No pudimos cargar la historia clínica de este paciente.</Alert>
                    <Link to="/pacientes" className={`btn ${formulario.botonSecundario}`}>Volver a pacientes</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={formulario.pagina}>
            <div className={formulario.contenedorFormulario}>
                <h3 className={formulario.titulo}>Historia clínica</h3>
                {paciente && (
                    <p className={formulario.ayuda} style={{ textAlign: 'center' }}>
                        <strong>{paciente.apellido}, {paciente.nombre}</strong> · DNI {paciente.dni}
                        {paciente.fechaNacimiento && ` · ${textoEdad(paciente.fechaNacimiento)}`}
                    </p>
                )}

                <PanelAntecedentes pacienteId={pacienteId} antecedentes={historia?.antecedentes} onCambio={() => void refetch()} />

                {esMedico && !agregando && (
                    <div className="mb-3">
                        <Button
                            type="button"
                            className={formulario.botonPrincipal}
                            disabled={cargandoTurnos}
                            onClick={() => setAgregando(true)}
                        >
                            <PlusLg size={16} /> Agregar consulta
                        </Button>
                    </div>
                )}

                {esMedico && agregando && (
                    <FormularioConsulta
                        pacienteId={pacienteId}
                        turnos={turnos ?? []}
                        onTerminar={(guardada) => {
                            setAgregando(false);
                            if (guardada) {
                                void refetch();
                                void refetchTurnos();
                            }
                        }}
                    />
                )}

                <ListaConsultas consultas={historia?.consultas ?? []} />

                <div className={formulario.acciones}>
                    <Link to={`/pacientes/${pacienteId}`} className={`btn ${formulario.botonSecundario}`}>
                        Volver al paciente
                    </Link>
                </div>
            </div>
        </div>
    );
};

// El "key" reinicia la pantalla al cambiar de paciente (así no quedan datos del anterior)
const HistoriaClinica = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return null;
    return <Pantalla key={id} pacienteId={id} />;
};

export default HistoriaClinica;