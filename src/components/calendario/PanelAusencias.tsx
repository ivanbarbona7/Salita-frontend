import { useState } from 'react';
import { Alert, Button, Form, ListGroup } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import ModalConfirmar from '../utils/ModalConfirmar';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { diasDelRango, formatoRango, hoyDia } from '../utils/fechaDia';
import { MAX_DIAS_RANGO, type IRango } from '../../types/Rango.types';
import Almanaque, { type Marcado, type Seleccion } from './Almanaque';

interface Props {
    tipo: 'ausencia' | 'cierre';
    // Ruta base de la API: "/medicos/yo/ausencias", "/medicos/<id>/ausencias" o "/consultorios/<id>/cierres"
    ruta: string;
    rangos: IRango[];
    // Marcas de solo lectura (por ejemplo, los cierres de los consultorios donde atiende el médico)
    marcasExtra?: Marcado[];
    onCambio: () => void;
}

const TEXTO = {
    ausencia: {
        ayuda: 'Elegí en el almanaque los días en que no vas a atender. En esas fechas no se pueden sacar turnos.',
        motivo: 'Motivo (opcional). Ej.: viaje, congreso',
        guardar: 'Guardar ausencia',
        vacio: 'No tenés ausencias cargadas.',
        lista: 'Ausencias cargadas',
        quitar: 'Quitar ausencia',
    },
    cierre: {
        ayuda: 'Elegí en el almanaque los días en que el consultorio está cerrado (feriados, obras). Vale para todos sus médicos.',
        motivo: 'Motivo (opcional). Ej.: feriado, refacciones',
        guardar: 'Guardar cierre',
        vacio: 'No hay cierres cargados.',
        lista: 'Cierres cargados',
        quitar: 'Quitar cierre',
    },
} as const;

const PanelAusencias = ({ tipo, ruta, rangos, marcasExtra = [], onCambio }: Props) => {
    const texto = TEXTO[tipo];
    const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
    const [motivo, setMotivo] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [aQuitar, setAQuitar] = useState<IRango | null>(null);

    const hoy = hoyDia();
    const proximos = rangos.filter((r) => r.hasta >= hoy).sort((a, b) => a.desde.localeCompare(b.desde));
    const marcados: Marcado[] = [
        ...proximos.map((r) => ({ desde: r.desde, hasta: r.hasta, tipo, etiqueta: r.motivo ? `${texto.lista}: ${r.motivo}` : texto.lista })),
        ...marcasExtra,
    ];

    const guardar = async () => {
        if (!seleccion) return;
        setGuardando(true);
        try {
            await clientesAxios.post(ruta, { desde: seleccion.desde, hasta: seleccion.hasta, motivo });
            toast.success(tipo === 'ausencia' ? 'Ausencia cargada' : 'Cierre cargado');
            setSeleccion(null);
            setMotivo('');
            onCambio();
        } catch (error) {
            // Si hay turnos pendientes en esas fechas, el mensaje del servidor los lista
            toast.error(obtenerMensajeError(error), { duration: 10000 });
        } finally {
            setGuardando(false);
        }
    };

    const quitar = async () => {
        if (!aQuitar) return;
        try {
            await clientesAxios.delete(`${ruta}/${aQuitar.id}`);
            toast.success('Quitado correctamente');
            onCambio();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setAQuitar(null);
        }
    };

    return (
        <>
            <p className="text-muted">{texto.ayuda} Podés cargar hasta {MAX_DIAS_RANGO} días seguidos por vez, y tantas veces como necesites.</p>

            <Almanaque marcados={marcados} seleccion={seleccion} maxDias={MAX_DIAS_RANGO} onSeleccionar={setSeleccion} />

            {seleccion && (
                <div className="mt-3">
                    <Alert variant="light" className="border mb-2">
                        <strong className="text-capitalize">{formatoRango(seleccion.desde, seleccion.hasta)}</strong>{' '}
                        ({diasDelRango(seleccion.desde, seleccion.hasta)} {diasDelRango(seleccion.desde, seleccion.hasta) === 1 ? 'día' : 'días'})
                    </Alert>
                    <Form.Control
                        className="mb-2"
                        maxLength={100}
                        placeholder={texto.motivo}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        aria-label="Motivo"
                    />
                    <div className="d-flex gap-2">
                        <Button onClick={() => void guardar()} disabled={guardando}>
                            {guardando ? 'Guardando...' : texto.guardar}
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setSeleccion(null)} disabled={guardando}>
                            Borrar selección
                        </Button>
                    </div>
                </div>
            )}

            <h2 className="h6 mt-4">{texto.lista}</h2>
            {proximos.length === 0 ? (
                <p className="text-muted">{texto.vacio}</p>
            ) : (
                <ListGroup>
                    {proximos.map((r) => (
                        <ListGroup.Item key={r.id} className="d-flex align-items-center justify-content-between gap-2">
                            <span>
                                <span className="text-capitalize">{formatoRango(r.desde, r.hasta)}</span>
                                {r.motivo && <small className="d-block text-muted">{r.motivo}</small>}
                            </span>
                            <Button variant="outline-danger" size="sm" onClick={() => setAQuitar(r)} aria-label={texto.quitar}>
                                <Trash />
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            <ModalConfirmar
                show={aQuitar !== null}
                titulo={texto.quitar}
                mensaje={aQuitar ? `¿Querés quitar ${formatoRango(aQuitar.desde, aQuitar.hasta)}? Esos días van a volver a tener turnos disponibles.` : ''}
                textoConfirmar="Sí, quitar"
                onConfirmar={quitar}
                onCancelar={() => setAQuitar(null)}
            />
        </>
    );
};

export default PanelAusencias;