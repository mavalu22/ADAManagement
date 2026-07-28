import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { SemesterProvider } from './context/SemesterContext';
import { ThemeContextProvider } from './context/ThemeContext';

import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentPlanPage from './pages/StudentPlanPage';
import Home from './pages/Home';
import RegisterUser from './pages/RegisterUser';
import Profile from './pages/Profile';
import UsersList from './pages/UsersList';
import ImportData from './pages/ImportData';
import AcademicReport from './pages/Reports/AcademicReport';
import CoursesReport from './pages/Reports/CoursesReport';
import StudentsReport from './pages/Reports/StudentsReport';
import StudentProfile from './pages/StudentProfile';
import StudentActions from './pages/StudentActions';
import IndicatorsReport from './pages/Reports/IndicatorsReport';
import Disciplines from './pages/Disciplines';
import PlanRounds from './pages/PlanRounds';
import RoundDetail from './pages/RoundDetail';
import CoordinatorStudentPlan from './pages/CoordinatorStudentPlan';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const STAFF = ['admin', 'user'];

// PrivateRoute exige sessão e, opcionalmente, um dos papéis informados.
// Quem não tem o papel é enviado para a sua própria área.
const PrivateRoute = ({ children, roles }) => {
  const { authenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }
  if (!authenticated) {
    return <Navigate to="/" />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'student' ? '/aluno' : '/home'} replace />;
  }
  return children;
};

const Staff = ({ children }) => <PrivateRoute roles={STAFF}>{children}</PrivateRoute>;

function App() {
  return (
    <ThemeContextProvider>
      <CssBaseline />

      <ToastContainer position="top-right" autoClose={3000} />

      <AuthProvider>
        <SemesterProvider>
          <BrowserRouter>
            <Routes>
              {/* Público */}
              <Route path="/" element={<Login />} />
              <Route path="/aluno/login" element={<StudentLogin />} />
              <Route path="/aluno/cadastro" element={<StudentRegister />} />

              {/* Área do aluno */}
              <Route path="/aluno" element={<PrivateRoute roles={['student']}><StudentPlanPage /></PrivateRoute>} />

              {/* Coordenação (admin ou user) */}
              <Route path="/home" element={<Staff><Home /></Staff>} />
              <Route path="/register-user" element={<Staff><RegisterUser /></Staff>} />
              <Route path="/profile" element={<Staff><Profile /></Staff>} />
              <Route path="/users" element={<Staff><UsersList /></Staff>} />
              <Route path="/import" element={<Staff><ImportData /></Staff>} />
              <Route path="/reports/records" element={<Staff><AcademicReport /></Staff>} />
              <Route path="/report/records" element={<Staff><AcademicReport /></Staff>} />
              <Route path="/report/courses" element={<Staff><CoursesReport /></Staff>} />
              <Route path="/report/students" element={<Staff><StudentsReport /></Staff>} />
              <Route path="/students/:registration/actions" element={<Staff><StudentActions /></Staff>} />
              <Route path="/students/:registration" element={<Staff><StudentProfile /></Staff>} />
              <Route path="/disciplines" element={<Staff><Disciplines /></Staff>} />
              <Route path="/reports/indicators" element={<Staff><IndicatorsReport /></Staff>} />
              <Route path="/planos" element={<Staff><PlanRounds /></Staff>} />
              <Route path="/planos/:roundId" element={<Staff><RoundDetail /></Staff>} />
              <Route path="/planos/:roundId/:registration" element={<Staff><CoordinatorStudentPlan /></Staff>} />
            </Routes>
          </BrowserRouter>
        </SemesterProvider>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;
