import { useContext } from 'react';
import { AppBar, Toolbar, Box, Typography, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

// Cabeçalho enxuto da área do aluno: sem a navegação da coordenação e sem
// o seletor de semestre (que é uma rota exclusiva de staff).
const StudentHeader = () => {
  const { logout, user } = useContext(AuthContext);
  const { toggleColorMode, mode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/aluno/login');
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box component="img" sx={{ height: 45, mr: 2 }} alt="Logo UFES" src="/ufes-logo.png" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
            Área do Aluno
          </Typography>
        </Box>

        {user && (
          <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 600, display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}>
            {user.name}
          </Typography>
        )}

        <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>
          <IconButton onClick={toggleColorMode} sx={{ mr: 1 }}>
            {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Sair">
          <IconButton onClick={handleLogout} color="error">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default StudentHeader;
