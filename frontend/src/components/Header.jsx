import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  ListItemIcon
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Header = () => {
  const { logout, user } = useContext(AuthContext); // Pegamos o 'user' aqui
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar sx={{ py: 1 }}>
        
        <Box 
            onClick={() => navigate('/home')} 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
        >
             <Box
                component="img"
                sx={{
                height: 50,
                marginRight: 2,
                filter: 'brightness(0) invert(1)' 
                }}
                alt="Logo UFES"
                src={logoUrl}
            />
        </Box>

        {/* Área do Usuário */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          
          {/* Exibe o Nome do Usuário Logado */}
          {user && (
            <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
          )}

          <Tooltip title="Menu">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light', color: 'white' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
              '&:before': {
                content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10,
                bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleNavigate('/home')}>
             <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
             Dashboard
          </MenuItem>

          <MenuItem onClick={() => handleNavigate('/profile')}>
             <ListItemIcon><ManageAccountsIcon fontSize="small" /></ListItemIcon>
             Meu Perfil
          </MenuItem>
          
          <Divider />
          {/* Só mostra a opção de cadastrar se for ADMIN */}
          {user && user.role === 'admin' && (
            <MenuItem onClick={() => handleNavigate('/register-user')}>
                <ListItemIcon>
                <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                Cadastrar Usuário
            </MenuItem>
          )}
          
          <Divider />
          
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