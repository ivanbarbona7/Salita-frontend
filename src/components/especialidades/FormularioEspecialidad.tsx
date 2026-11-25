import { useState } from 'react';
import { Alert, Badge, Button, Container, Form, Modal, Table } from 'react-bootstrap';
import { Heart, PlusLg } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerRol } from '../utils/sesion';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import ListSkeleton from '../utils/ListSkeleton';
import ModalConfirmar from '../utils/ModalConfirmar';
import BotonAccion from '../utils/BotonAccion';
import CampoFormulario from '../utils/CampoFormulario';
import formulario from '../utils/Formulario.module.scss';
import styles from './Especialidades.module.scss';
import {
    CATEGORIAS_ESPECIALIDAD,
    crearEspecialidadSchema,
    type ICrearEspecialidadDTO,
    type ICrearEspecialidadValidado,
    type IEspecialidad,
} from '../../types/Especialidad.types';

// Sin tildes ni mayúsculas, para que "cardiologia" encuentre "Cardiología"
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface AccionesProps {
    esp: IEspecialidad;
    puedeEliminar: boolean;
    onVer: (esp: IEspecialidad) => void;
    onEditar: (esp: IEspecialidad) => void;
    onEliminar: (esp: IEspecialidad) => void;
}

const Acciones = ({ esp, puedeEliminar, onVer, onEditar, onEliminar }: AccionesProps) => (
    <div className="d-inline-flex flex-wrap gap-2">
        <BotonAccion tipo="ver" onClick={() => onVer(esp)} />
        <BotonAccion tipo="editar" onClick={() => onEditar(esp)} />
        {puedeEliminar && <BotonAccion tipo="eliminar" onClick={() => onEliminar(esp)} />}
    </div>
);

const Especialidades = () => {
    const { data, isLoading, error, refetch } = useFetch<IEspecialidad[]>('/especialidades');
    const lista = data ?? [];
    // Solo el admin elimina (así lo exige el backend)
    const puedeEliminar = obtenerRol() === 'ADMIN';

    const [busqueda, setBusqueda] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [seleccionada, setSeleccionada] = useState<IEspecialidad | null>(null); // la que se edita
    const [detalle, setDetalle] = useState<IEspecialidad | null>(null);
    const [aEliminar, setAEliminar] = useState<IEspecialidad | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ICrearEspecialidadDTO, unknown, ICrearEspecialidadValidado>({
        resolver: zodResolver(crearEspecialidadSchema),
    });

    const filtradas = lista.filter((e) =>
        normalizar(`${e.nombre} ${e.descripcion ?? ''} ${e.categoria ?? ''}`).includes(normalizar(busqueda.trim())),
    );

    const abrirModalCrear = () => {
        setSeleccionada(null);
        reset({ nombre: '', descripcion: '', categoria: undefined });
        setShowModal(true);
    };

    const abrirModalEditar = (esp: IEspecialidad) => {
        setSeleccionada(esp);
        reset({
            nombre: esp.nombre,
            descripcion: esp.descripcion ?? '',
            categoria: CATEGORIAS_ESPECIALIDAD.find((c) => c === esp.categoria),
        });
        setShowModal(true);
    };

    const onSubmit = async (datos: ICrearEspecialidadValidado) => {
        try {
            if (seleccionada) {
                await clientesAxios.put(`/especialidades/${seleccionada.id}`, datos);
                toast.success('¡Especialidad actualizada!');
            } else {
                await clientesAxios.post('/especialidades', datos);
                toast.success('¡Especialidad creada con éxito!');
            }
            setShowModal(false);
            void refetch();
        } catch (err: unknown) {
            toast.error(obtenerMensajeError(err));
        }
    };

    const confirmarEliminar = async () => {
        if (!aEliminar) return;
        try {
            await clientesAxios.delete(`/especialidades/${aEliminar.id}`);
            toast.success('Especialidad eliminada');
            void refetch();
        } catch (err: unknown) {
            toast.error(obtenerMensajeError(err));
        } finally {
            setAEliminar(null);
        }
    };

    const acciones = (esp: IEspecialidad) => (
        <Acciones esp={esp} puedeEliminar={puedeEliminar} onVer={setDetalle} onEditar={abrirModalEditar} onEliminar={setAEliminar} />
    );

    if (isLoading) return <ListSkeleton rows={5} />;

    return (
        <div className={formulario.pagina}>
            <Container fluid className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <Heart size={28} />
                        Especialidades
                    </h3>
                    <Button type="button" className={formulario.botonPrincipal} onClick={abrirModalCrear}>
                        <PlusLg size={16} /> Nueva especialidad
                    </Button>
                </div>

                <Form.Control
                    type="search"
                    className={styles.buscador}
                    placeholder="Buscar por nombre, categoría o descripción"
                    aria-label="Buscar especialidad"
                    value={busqueda}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                />

                {error && <Alert variant="danger">No pudimos cargar las especialidades.</Alert>}

                {!error && filtradas.length === 0 && (
                    <Alert variant="light" className="text-center">
                        {lista.length === 0 ? 'No hay especialidades registradas.' : 'No se encontraron especialidades.'}
                    </Alert>
                )}

                {filtradas.length > 0 && (
                    <>
                        {/* Escritorio: tabla */}
                        <Table responsive hover className={`d-none d-md-table align-middle ${styles.tabla}`}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Descripción</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtradas.map((esp) => (
                                    <tr key={esp.id}>
                                        <td className="fw-semibold">{esp.nombre}</td>
                                        <td>{esp.categoria ? <span className={styles.chip}>{esp.categoria}</span> : '—'}</td>
                                        <td>{esp.descripcion || 'Sin descripción'}</td>
                                        <td className="text-end">{acciones(esp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Celular: tarjetas */}
                        <div className="d-md-none d-grid gap-3">
                            {filtradas.map((esp) => (
                                <div key={esp.id} className={styles.tarjeta}>
                                    <div className={styles.tarjetaTitulo}>
                                        <strong>{esp.nombre}</strong>
                                        {esp.categoria && <span className={styles.chip}>{esp.categoria}</span>}
                                    </div>
                                    <div className={styles.dato}>{esp.descripcion || 'Sin descripción'}</div>
                                    {acciones(esp)}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Crear / editar: en celular ocupa toda la pantalla */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered fullscreen="sm-down">
                    <Modal.Header closeButton>
                        <Modal.Title className="h5">{seleccionada ? 'Editar especialidad' : 'Nueva especialidad'}</Modal.Title>
                    </Modal.Header>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Modal.Body className="d-grid gap-3">
                            <CampoFormulario
                                register={register}
                                errores={errors}
                                name="nombre"
                                etiqueta="Nombre"
                                placeholder="Ej: Cardiología"
                                autoComplete="off"
                            />

                            <div className={formulario.campo}>
                                <label htmlFor="categoria" className={formulario.label}>Categoría</label>
                                <select
                                    id="categoria"
                                    className={formulario.campoInput}
                                    aria-invalid={errors.categoria ? true : undefined}
                                    {...register('categoria')}
                                >
                                    <option value="">Seleccioná una categoría...</option>
                                    {CATEGORIAS_ESPECIALIDAD.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.categoria && (
                                    <span className={formulario.textError} role="alert">{errors.categoria.message}</span>
                                )}
                            </div>

                            <div className={formulario.campo}>
                                <label htmlFor="descripcion" className={formulario.label}>Descripción</label>
                                <textarea
                                    id="descripcion"
                                    rows={3}
                                    className={formulario.campoInput}
                                    placeholder="Breve detalle..."
                                    aria-invalid={errors.descripcion ? true : undefined}
                                    {...register('descripcion')}
                                />
                                {errors.descripcion && (
                                    <span className={formulario.textError} role="alert">{errors.descripcion.message}</span>
                                )}
                            </div>
                        </Modal.Body>
                        <div className={styles.pieModal}>
                            <Button
                                type="button"
                                className={formulario.botonSecundario}
                                onClick={() => setShowModal(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className={formulario.botonPrincipal} disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : seleccionada ? 'Guardar cambios' : 'Crear especialidad'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Ver */}
                <Modal show={detalle !== null} onHide={() => setDetalle(null)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="h5">{detalle?.nombre}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {detalle?.categoria && <Badge bg="secondary" className="mb-2">{detalle.categoria}</Badge>}
                        <p className="mb-0">{detalle?.descripcion || 'Sin descripción'}</p>
                    </Modal.Body>
                    <div className={styles.pieModal}>
                        <Button type="button" className={formulario.botonSecundario} onClick={() => setDetalle(null)}>
                            Cerrar
                        </Button>
                    </div>
                </Modal>

                <ModalConfirmar
                    show={aEliminar !== null}
                    titulo="Eliminar especialidad"
                    mensaje={<>¿Seguro que querés eliminar <strong>{aEliminar?.nombre}</strong>?</>}
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={confirmarEliminar}
                    onCancelar={() => setAEliminar(null)}
                />
            </Container>
        </div>
    );
};

export default Especialidades;