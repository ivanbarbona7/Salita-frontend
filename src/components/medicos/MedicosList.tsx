import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, Container, Form, Table } from "react-bootstrap";
import { PersonBadge, PlusLg } from "react-bootstrap-icons";
import { toast } from "sonner";
import { useFetch } from "../../hooks/useFetch";
import clientesAxios from "../../config/axios";
import ListSkeleton from "../utils/ListSkeleton";
import BotonAccion from "../utils/BotonAccion";
import ModalConfirmar from "../utils/ModalConfirmar";
import VistaRapidaMedico from "./VistaRapidaMedico";
import { obtenerRol } from "../utils/sesion";
import { obtenerMensajeError } from "../utils/obtenerMensajeError";
import formulario from "../utils/Formulario.module.scss";
import styles from "./MedicoList.module.scss";
import type { IMedico } from "../../types/Medico.types";

// Sin tildes ni mayúsculas, para que "perez" encuentre "Pérez"
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface AccionesProps {
  medico: IMedico;
  esAdmin: boolean;
  onVer: (id: string) => void;
  onDesactivar: (medico: IMedico) => void;
}

const Acciones = ({ medico, esAdmin, onVer, onDesactivar }: AccionesProps) => (
  <div className="d-inline-flex flex-wrap gap-2">
    <BotonAccion tipo="ver" onClick={() => onVer(medico.id)} />
    {esAdmin && <BotonAccion tipo="editar" to={`/medicos/editar/${medico.id}`} />}
    {/* Un médico inactivo se reactiva desde Editar */}
    {esAdmin && medico.activo !== false && <BotonAccion tipo="desactivar" onClick={() => onDesactivar(medico)} />}
  </div>
);

const MedicosList = () => {
  const { data, setData, isLoading, error } = useFetch<IMedico[]>("/medicos");
  const [busqueda, setBusqueda] = useState("");
  const [idVista, setIdVista] = useState<string | null>(null);
  const [aDesactivar, setADesactivar] = useState<IMedico | null>(null);
  const esAdmin = obtenerRol() === "ADMIN";

  const lista = data ?? [];
  const termino = normalizar(busqueda.trim());
  const filtrados = lista.filter((m) =>
    normalizar(
      `${m.nombre} ${m.apellido} ${m.especialidad?.nombre ?? ""} ${m.matricula ?? ""} ${(m.consultorios ?? []).map((c) => c.nombre).join(" ")}`,
    ).includes(termino),
  );
  // Se busca en la lista para que la vista rápida se actualice sola (por ejemplo, al desactivar)
  const medicoVisto = lista.find((m) => m.id === idVista) ?? null;

  const confirmarDesactivar = async () => {
    if (!aDesactivar) return;
    try {
      await clientesAxios.delete(`/medicos/${aDesactivar.id}`);
      toast.success("Médico desactivado correctamente");
      // No se quita de la lista: queda marcado como inactivo y se puede reactivar desde Editar
      setData(lista.map((m) => (m.id === aDesactivar.id ? { ...m, activo: false } : m)));
    } catch (err: unknown) {
      toast.error(obtenerMensajeError(err));
    } finally {
      setADesactivar(null);
    }
  };

  if (isLoading) return <ListSkeleton rows={5} />;

  const consultoriosDe = (m: IMedico) =>
    (m.consultorios ?? []).length > 0 ? (
      m.consultorios?.map((c) => <span key={c.id} className={styles.chip}>{c.nombre}</span>)
    ) : (
      <span className="text-muted small">Sin consultorio</span>
    );

  return (
    <div className={formulario.pagina}>
      <Container fluid className={styles.contenedor}>
        <div className={styles.encabezado}>
          <h3 className={styles.titulo}>
            <PersonBadge size={30} />
            Listado de médicos
          </h3>
          {esAdmin && (
            <Link to="/medicos/nuevo" className={`btn ${formulario.botonPrincipal}`}>
              <PlusLg size={16} /> Registrar médico
            </Link>
          )}
        </div>

        <Form.Control
          type="search"
          className={styles.buscador}
          placeholder="Buscar por nombre, especialidad, matrícula o consultorio"
          aria-label="Buscar médico"
          value={busqueda}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
        />

        {error && <Alert variant="danger">No pudimos cargar los médicos.</Alert>}

        {filtrados.length === 0 ? (
          <Alert variant="light" className="text-center">
            {lista.length === 0 ? "Todavía no hay médicos cargados." : "No se encontraron médicos que coincidan con la búsqueda."}
          </Alert>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <Table responsive hover className={`d-none d-md-table align-middle ${styles.tabla}`}>
              <thead>
                <tr>
                  <th>Nombre y apellido</th>
                  <th>Especialidad</th>
                  <th>Consultorios</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => {
                  const activo = m.activo !== false;
                  return (
                    <tr key={m.id} className={activo ? undefined : styles.filaInactiva}>
                      <td className="fw-semibold">{m.nombre} {m.apellido}</td>
                      <td>{m.especialidad?.nombre ?? "Sin especialidad"}</td>
                      <td>{consultoriosDe(m)}</td>
                      <td>
                        <Badge bg={activo ? "success" : "secondary"}>{activo ? "Activo" : "Inactivo"}</Badge>
                      </td>
                      <td className="text-end">
                        <Acciones medico={m} esAdmin={esAdmin} onVer={setIdVista} onDesactivar={setADesactivar} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* Celular: tarjetas */}
            <div className="d-md-none d-grid gap-3">
              {filtrados.map((m) => {
                const activo = m.activo !== false;
                return (
                  <div key={m.id} className={activo ? styles.tarjeta : `${styles.tarjeta} ${styles.tarjetaInactiva}`}>
                    <div className={styles.tarjetaTitulo}>
                      <strong>{m.nombre} {m.apellido}</strong>
                      <Badge bg={activo ? "success" : "secondary"}>{activo ? "Activo" : "Inactivo"}</Badge>
                    </div>
                    <div className={styles.dato}>{m.especialidad?.nombre ?? "Sin especialidad"}</div>
                    <div className="mb-3">{consultoriosDe(m)}</div>
                    <Acciones medico={m} esAdmin={esAdmin} onVer={setIdVista} onDesactivar={setADesactivar} />
                  </div>
                );
              })}
            </div>
          </>
        )}

      <VistaRapidaMedico
        medico={medicoVisto}
        esAdmin={esAdmin}
        onCerrar={() => setIdVista(null)}
        onDesactivar={(m) => {
          setIdVista(null);
          setADesactivar(m);
        }}
      />

      <ModalConfirmar
        show={aDesactivar !== null}
        titulo="Confirmar desactivación"
        mensaje={
          <>
            ¿Seguro que querés desactivar a <strong>{aDesactivar?.apellido}, {aDesactivar?.nombre}</strong>? No podrá
            ingresar al sistema ni recibir turnos hasta que lo reactives desde Editar.
          </>
        }
        textoConfirmar="Sí, desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
      </Container>
    </div>
  );
};

export default MedicosList;