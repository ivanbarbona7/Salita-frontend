import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import DashboardRecepcion from './pages/DashboardRecepcion.tsx';
import LayoutPanel from './components/layout/LayoutPanel.tsx';
import NotFound from './components/utils/NotFound.tsx';
import Login from './login/login.tsx';
import { IngresoRapido } from './pages/IngresoRapido.tsx';
import { Bienvenida } from './pages/Bienvenida.tsx';
import { RutaProtegida } from './components/RutaProtegida.tsx';

// Paciente (ingreso rápido o con cuenta)
import { InicioPaciente } from './pages/InicioPaciente.tsx';
import { PedirTurnoEspecialidad } from './pages/PedirTurno/PedirTurnoEspecialidad.tsx';
import { PedirTurnoMedico } from './pages/PedirTurno/PedirTurnoMedico.tsx';
import { PedirTurnoHorario } from './pages/PedirTurno/PedirTurnoHorario.tsx';
import { PedirTurnoConfirmar } from './pages/PedirTurno/PedirTurnoConfirmar.tsx';
import { TurnoConfirmado } from './pages/TurnoConfirmado.tsx';
import { MisTurnos } from './pages/MisTurnos.tsx';
import { MiPerfilPaciente } from './pages/MiPerfilPaciente.tsx';
import { ReprogramarTurno } from './pages/ReprogramarTurno.tsx';

// Médico
import InicioMedico from './pages/InicioMedico.tsx';
import AgendaMedico from './pages/AgendaMedico.tsx';
import MiPerfil from './pages/MiPerfil.tsx';
import AusenciasMedico from './pages/AusenciaMedico.tsx';

// Personal
import PacienteList from './components/pacientes/PacientesList.tsx';
import PacienteDetalle from './components/pacientes/PacienteDetalle.tsx';
import PacienteEditar from './components/pacientes/PacienteEditar.tsx';
import FormularioPaciente from './components/pacientes/FormularioPaciente.tsx';
import HistoriaClinica from './components/historiaClinica/FormularioHistoriaClinica.tsx';
import FormularioTurno from './components/turnos/FormularioTurno.tsx';
import DetalleTurno from './components/turnos/DetalleTurno.tsx';
import MedicosList from './components/medicos/MedicosList.tsx';
import DetalleMedico from './components/medicos/DetalleMedico.tsx';
import FormularioMedico from './components/medicos/FormularioMedico.tsx';
import HorariosList from './components/medicos/components/HorarioList.tsx';
import HorarioEditar from './components/medicos/components/HorarioEditar.tsx';
import ConsultorioList from './components/consultorios/ConsultorioList.tsx';
import FormularioConsultorio from './components/consultorios/FormularioConsultorio.tsx';
import CierresConsultorio from './pages/CierresConsultorio.tsx';
import FormularioEspecialidad from './components/especialidades/FormularioEspecialidad.tsx';
import FormularioPersonal from './components/personal/FormularioPersonal.tsx';
import PersonalList from './components/personal/PersonalList.tsx';
import PersonalDetalle from './components/personal/PersonalDetalle.tsx';
import ListaEspera from './pages/ListaEspera.tsx';
import ObrasSocialesList from './components/obrasSociales/ObrasSocialesList.tsx';

export const App = () => (
  <>
    <Toaster position="top-right" richColors />

    <Routes>
      {/* 1. PÚBLICAS */}
      <Route path="/" element={<Bienvenida />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pacientes/ingreso" element={<IngresoRapido />} />

      {/* 2. PACIENTE */}
      <Route element={<RutaProtegida roles={['PACIENTE']} />}>
        <Route path="/pacientes/inicio" element={<InicioPaciente />} />
        <Route path="/pacientes/turnos" element={<MisTurnos />} />
        <Route path="/pacientes/turnos/:id/reprogramar" element={<ReprogramarTurno />} />
        <Route path="/pacientes/perfil" element={<MiPerfilPaciente />} />
        <Route path="/pacientes/turnos/nuevo" element={<PedirTurnoEspecialidad />} />
        <Route path="/pacientes/turnos/nuevo/:especialidad" element={<PedirTurnoMedico />} />
        <Route path="/pacientes/turnos/nuevo/:especialidad/:medico" element={<PedirTurnoHorario />} />
        <Route path="/pacientes/turnos/confirmar" element={<PedirTurnoConfirmar />} />
        <Route path="/pacientes/turnos/confirmado" element={<TurnoConfirmado />} />
      </Route>

      {/* 3. PERSONAL: un solo panel, el menú se arma según el rol */}
      <Route element={<RutaProtegida roles={['ADMIN', 'RECEPCIONISTA', 'MEDICO']} />}>
        <Route element={<LayoutPanel />}>
          {/* Solo médico: su panel */}
          <Route element={<RutaProtegida roles={['MEDICO']} />}>
            <Route path="/inicio" element={<InicioMedico />} />
            <Route path="/mis-turnos" element={<AgendaMedico />} />
            <Route path="/mi-horario" element={<HorarioEditar />} />
            <Route path="/mis-ausencias" element={<AusenciasMedico />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
          </Route>

          {/* Historia clínica: solo médico y admin */}
          <Route element={<RutaProtegida roles={['ADMIN', 'MEDICO']} />}>
            <Route path="/historia-clinica/:id" element={<HistoriaClinica />} />
          </Route>

          {/* Pacientes: admin, recepción y médico (lista, detalle y edición) */}
          <Route element={<RutaProtegida roles={['ADMIN', 'RECEPCIONISTA', 'MEDICO']} />}>
            <Route path="/pacientes" element={<PacienteList />} />
            <Route path="/pacientes/:id" element={<PacienteDetalle />} />
            <Route path="/pacientes/editar/:id" element={<PacienteEditar />} />
          </Route>

          {/* Admin y recepción */}
          <Route element={<RutaProtegida roles={['ADMIN', 'RECEPCIONISTA']} />}>
            <Route path="/recepcion" element={<DashboardRecepcion />} />
            <Route path="/consultorios" element={<ConsultorioList />} />
            <Route path="/nuevo-paciente" element={<FormularioPaciente />} />
            <Route path="/turnos" element={<FormularioTurno />} />
            <Route path="/turnos/:id" element={<FormularioTurno />} />
            <Route path="/turno-detalle/:id" element={<DetalleTurno />} />
            <Route path="/lista-espera" element={<ListaEspera />} />
            <Route path="/obras-sociales" element={<ObrasSocialesList />} />
            <Route path="/medicos" element={<MedicosList />} />
            <Route path="/medicos/:id" element={<DetalleMedico />} />
            <Route path="/medicos/:id/ausencias" element={<AusenciasMedico />} />
            <Route path="/especialidades" element={<FormularioEspecialidad />} />
            <Route path="/horarios" element={<HorariosList />} />
            <Route path="/horarios/:id" element={<HorarioEditar />} />
            <Route path="/personal" element={<PersonalList />} />
            <Route path="/personal/:id" element={<PersonalDetalle />} />
          </Route>

          {/* Solo admin */}
          <Route element={<RutaProtegida roles={['ADMIN']} />}>
            <Route path="/medicos/nuevo" element={<FormularioMedico />} />
            <Route path="/medicos/editar/:id" element={<FormularioMedico />} />
            <Route path="/consultorios/nuevo" element={<FormularioConsultorio />} />
            <Route path="/consultorios/editar/:id" element={<FormularioConsultorio />} />
            <Route path="/consultorios/:id/cierres" element={<CierresConsultorio />} />
            <Route path="/personal/nuevo" element={<FormularioPersonal />} />
            <Route path="/personal/editar/:id" element={<FormularioPersonal />} />
          </Route>
        </Route>
      </Route>

      {/* 4. CUALQUIER OTRA RUTA */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;