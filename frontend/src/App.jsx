import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SemesterProvider } from './context/SemesterContext';
import { ThemeContextProvider } from './context/ThemeContext'; // <--- IMPORTAÇÃO NOVA

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import RegisterUser from './pages/RegisterUser';
import Profile from './pages/Profile';
import UsersList from './pages/UsersList'; // Verifique se o caminho está correto na sua pasta
import ImportData from './pages/ImportData';
import AcademicReport from './pages/Reports/AcademicReport';
import CoursesReport from './pages/Reports/CoursesReport';
import StudentsReport from './pages/Reports/StudentsReport';
import StudentProfile from './pages/StudentProfile';
import IndicatorsReport from './pages/Reports/IndicatorsReport';

// React Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children }) => {
  const { authenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    // 1. Envolvemos tudo no ThemeContextProvider
    <ThemeContextProvider>
      {/* CssBaseline agora pega as cores dinâmicas do contexto */}
      <CssBaseline />
      
      {/* Container dos Popups */}
      <ToastContainer position="top-right" autoClose={3000} />

      <AuthProvider>
        <SemesterProvider>
            <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                
                <Route 
                path="/home" 
                element={
                    <PrivateRoute>
                    <Home />
                    </PrivateRoute>
                } 
                />
                
                <Route 
                path="/register-user" 
                element={
                    <PrivateRoute>
                    <RegisterUser />
                    </PrivateRoute>
                } 
                />
                
                <Route 
                path="/profile" 
                element={
                    <PrivateRoute>
                    <Profile />
                    </PrivateRoute>
                } 
                />
                
                <Route 
                path="/users" 
                element={
                    <PrivateRoute>
                    <UsersList />
                    </PrivateRoute>
                } 
                />
                
                <Route 
                path="/import" 
                element={
                    <PrivateRoute>
                    <ImportData />
                    </PrivateRoute>
                } 
                />
                <Route path="/reports/records" element={<PrivateRoute><AcademicReport /></PrivateRoute>} />
                <Route path="/report/records" element={<PrivateRoute><AcademicReport /></PrivateRoute>} />
                <Route path="/report/courses" element={<PrivateRoute><CoursesReport /></PrivateRoute>} />
                <Route path="/report/students" element={<PrivateRoute><StudentsReport /></PrivateRoute>} />
                <Route path="/students/:registration" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
                <Route path="/reports/indicators" element={<PrivateRoute><IndicatorsReport /></PrivateRoute>} />
            
            </Routes>
            </BrowserRouter>
        </SemesterProvider>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;