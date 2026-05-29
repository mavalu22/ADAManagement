import React, { useContext, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem,
  Avatar, Tooltip, Divider, ListItemIcon, FormControl, Select, Switch
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { SemesterContext } from '../context/SemesterContext';
import { ThemeContext } from '../context/ThemeContext';

import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const Header = () => {
  const { logout, user } = useContext(AuthContext);
  const { semesters, selectedSemester, changeSemester } = useContext(SemesterContext);
  const { toggleColorMode, mode } = useContext(ThemeContext);

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const logoUrl = "/ufes-logo.png";

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ py: 1 }}>

        <Box
            onClick={() => navigate('/home')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
        >
             <Box
                component="img"
                sx={{ height: 45, marginRight: 2 }}
                alt="Logo UFES"
                src={logoUrl}
            />
        </Box>

        {semesters.length > 0 && (
            <Box sx={{ minWidth: 160, mr: 3 }}>
                <FormControl fullWidth size="small">
                    <Select
                        value={selectedSemester}
                        onChange={(e) => changeSemester(e.target.value)}
                        displayEmpty
                    >
                        {semesters.map((sem) => (
                            <MenuItem key={sem.ID} value={sem.ID}>
                                {sem.code}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <Typography variant="subtitle2" sx={{ mr: 1.5, fontWeight: 600, display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}>
              {user.name}
            </Typography>
          )}

          <Tooltip title="Menu">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
            >
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'white' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.1))',
              mt: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
              '&:before': {
                content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10,
                bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
                borderLeft: '1px solid', borderTop: '1px solid', borderColor: 'divider'
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleNavigate('/home')}>
             <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
             Home
          </MenuItem>

          <MenuItem onClick={() => handleNavigate('/profile')}>
             <ListItemIcon><ManageAccountsIcon fontSize="small" /></ListItemIcon>
             Meu Perfil
          </MenuItem>

          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={(e) => e.stopPropagation()}>
             <ListItemIcon>
                {mode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
             </ListItemIcon>
             <Box sx={{ flexGrow: 1 }}>Modo Escuro</Box>
             <Switch
                checked={mode === 'dark'}
                onChange={toggleColorMode}
                size="small"
             />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {user && user.role === 'admin' && (
            <div>
                <MenuItem onClick={() => handleNavigate('/import')}>
                    <ListItemIcon><CloudUploadIcon fontSize="small" /></ListItemIcon>
                    Importar Dados
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/register-user')}>
                    <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
                    Cadastrar Usuário
                </MenuItem>
                <Divider sx={{ my: 1 }} />
            </div>
          )}

          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
