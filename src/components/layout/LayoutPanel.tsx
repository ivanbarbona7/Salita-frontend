import { Navbar, Nav, NavDropdown, Container, Button } from "react-bootstrap";
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { MENU } from "../../config/menu";
import { obtenerRol } from "../utils/sesion";
import { InsigniaRol, NombreUsuario } from "./UsuarioActual";
import styles from "./LayoutPanel.module.scss";

const LayoutPanel = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const rol = obtenerRol();

    if (!rol) return <Navigate to="/login" replace />;

    const visibles = MENU.filter(item => item.roles.includes(rol));
    const sueltos = visibles.filter(item => !item.grupo);
    const grupos = Array.from(new Set(visibles.flatMap(item => (item.grupo ? [item.grupo] : []))));

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className={styles.fondo}>
            <Navbar expand="md" sticky="top" data-bs-theme="dark" className={styles.barra}>
                <Container>
                    <Navbar.Brand>
                        Salita Municipal
                        <InsigniaRol rol={rol} />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="menu-panel" />
                    <Navbar.Collapse id="menu-panel">
                        <Nav className="me-auto">
                            {sueltos.map(item => (
                                <Nav.Link key={item.ruta} as={NavLink} to={item.ruta} className={styles.enlace}>
                                    {item.etiqueta}
                                </Nav.Link>
                            ))}

                            {grupos.map(grupo => {
                                const itemsGrupo = visibles.filter(item => item.grupo === grupo);
                                const activo = itemsGrupo.some(item => pathname.startsWith(item.ruta));
                                return (
                                    <NavDropdown
                                        key={grupo}
                                        title={grupo}
                                        active={activo}
                                        className={`${styles.enlace} ${styles.grupo}`}
                                    >
                                        {itemsGrupo.map(item => (
                                            <NavDropdown.Item key={item.ruta} as={NavLink} to={item.ruta}>
                                                {item.etiqueta}
                                            </NavDropdown.Item>
                                        ))}
                                    </NavDropdown>
                                );
                            })}
                        </Nav>
                        <NombreUsuario />
                        <Button variant="outline-light" size="sm" onClick={cerrarSesion}>
                            Cerrar sesión
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container className="py-4">
                <Outlet />
            </Container>
        </div>
    );
};

export default LayoutPanel;