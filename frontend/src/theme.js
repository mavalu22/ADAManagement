import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#004b8d', // Azul UFES institucional profundo
      light: '#337ab7', // Um tom mais claro para hovers
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f0ad4e', // Um laranja/dourado para ações secundárias ou alertas (opcional)
    },
    background: {
      default: '#f4f6f8', // Fundo cinza muito suave, moderno
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50', // Cinza escuro para texto, menos agressivo que preto puro
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, letterSpacing: 0.5 },
  },
  shape: {
    borderRadius: 8, // Bordas padrão mais arredondadas
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)', // Sombra suave no header
          backgroundColor: '#004b8d', // Garante a cor do header
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove letras maiúsculas
          fontWeight: 600,
          padding: '8px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,75,141, 0.2)', // Sombra azul suave ao passar o mouse
          },
        },
        containedPrimary: {
           // Estilo específico para botões azuis principais
           background: 'linear-gradient(45deg, #004b8d 30%, #005b9f 90%)',
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
            // Sombra suave padrão para cards e formulários
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default theme;