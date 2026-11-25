import { Navigate, useNavigate } from 'react-router-dom';
import { BoxArrowInRight, CalendarPlus, Clock, GeoAlt, HeartPulseFill, Telephone } from 'react-bootstrap-icons';
import { PasoLayout } from '../components/PasoLayout';
import { obtenerRol, rutaInicio } from '../components/utils/sesion';
import styles from './Bienvenida.module.scss';

// Completá los que quieras mostrar; los que dejes vacíos no aparecen.
const SALITA = {
    direccion: '',
    horario: '',
    telefono: '',
};

const PASOS = ['Completá tus datos', 'Elegí especialidad, médico y horario', 'Confirmá tu turno'];

export const Bienvenida = () => {
    const navigate = useNavigate();
    const rol = obtenerRol();

    if (rol) return <Navigate to={rutaInicio(rol)} replace />;

    const datos = [
        { Icono: GeoAlt, texto: SALITA.direccion },
        { Icono: Clock, texto: SALITA.horario },
        { Icono: Telephone, texto: SALITA.telefono },
    ].filter((d) => d.texto !== '');

    return (
        <PasoLayout titulo="Bienvenido" sinVolver>
            <div className={styles.contenedor}>
                <header className={styles.marca}>
                    <span className={styles.logo}><HeartPulseFill size={36} aria-hidden="true" /></span>
                    <h2 className={styles.nombre}>Salita Municipal</h2>
                    <p className={styles.lema}>Pedí tu turno de forma simple y rápida</p>
                </header>

                <div className={styles.acciones}>
                    <button type="button" className={styles.principal} onClick={() => navigate('/pacientes/ingreso')}>
                        <span className={styles.principalIcono}><CalendarPlus size={30} aria-hidden="true" /></span>
                        <span>
                            Pedir un turno
                            <small>No necesitás crear una cuenta</small>
                        </span>
                    </button>
                    <button type="button" className={styles.secundaria} onClick={() => navigate('/login')}>
                        <BoxArrowInRight size={22} aria-hidden="true" />
                        Ingresar con usuario y contraseña
                    </button>
                </div>

                <section aria-labelledby="como-funciona">
                    <h3 id="como-funciona" className={styles.pasosTitulo}>Es muy fácil: 3 pasos</h3>
                    <ol className={styles.pasos}>
                        {PASOS.map((texto, i) => (
                            <li key={texto} className={styles.paso}>
                                <span className={styles.pasoNumero} aria-hidden="true">{i + 1}</span>
                                <span className={styles.pasoTexto}>{texto}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <aside className={styles.ayuda}>
                    <p className={styles.ayudaTitulo}>¿Necesitás ayuda?</p>
                    <p className={styles.ayudaTexto}>Acercate a la salita y te ayudamos a sacar el turno.</p>
                    {datos.length > 0 && (
                        <ul className={styles.datos}>
                            {datos.map(({ Icono, texto }) => (
                                <li key={texto} className={styles.dato}>
                                    <Icono size={18} aria-hidden="true" /> {texto}
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </PasoLayout>
    );
};