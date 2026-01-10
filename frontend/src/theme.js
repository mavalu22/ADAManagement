import { alpha } from '@mui/material/styles';

// --- Paleta de Cores Base ---
const UFES_BLUE = '#004b8d';
const UFES_ORANGE = '#f0ad4e';

// Cores Light
const LIGHT_BG = '#F4F5F7';
const LIGHT_PAPER = '#FFFFFF';
const LIGHT_TEXT_PRI = '#172B4D';
const LIGHT_TEXT_SEC = '#6B778C';
const LIGHT_DIVIDER = '#DFE1E6';

// Cores Dark (Slate Theme)
const DARK_BG = '#0F172A'; // Slate 900
const DARK_PAPER = '#1E293B'; // Slate 800
const DARK_TEXT_PRI = '#F1F5F9'; // Slate 100
const DARK_TEXT_SEC = '#94A3B8'; // Slate 400
const DARK_DIVIDER = '#334155'; // Slate 700

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? UFES_BLUE : '#4C9AFF', // Azul mais claro no dark para contraste
      light: '#4C9AFF',
      dark: '#00386E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: UFES_ORANGE,
      contrastText: mode === 'light' ? '#172B4D' : '#000',
    },
    background: {
      default: mode === 'light' ? LIGHT_BG : DARK_BG,
      paper: mode === 'light' ? LIGHT_PAPER : DARK_PAPER,
    },
    text: {
      primary: mode === 'light' ? LIGHT_TEXT_PRI : DARK_TEXT_PRI,
      secondary: mode === 'light' ? LIGHT_TEXT_SEC : DARK_TEXT_SEC,
    },
    divider: mode === 'light' ? alpha(LIGHT_DIVIDER, 0.8) : alpha(DARK_DIVIDER, 0.8),
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.005em' },
    h4: { fontWeight: 600, letterSpacing: '-0.005em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
  },

  shape: {
    borderRadius: 8,
  },

  // Sombras personalizadas (mais sutis no dark)
  shadows: mode === 'dark' 
    ? Array(25).fill('none') // Flat design no dark mode geralmente evita sombras pesadas
    : [
        "none",
        "0px 1px 3px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,75,141,0.06)", 
        "0px 4px 8px rgba(0,0,0,0.1), 0px 8px 24px rgba(0,75,141,0.08)", 
        ...Array(22).fill("0px 8px 24px rgba(0,0,0,0.12)"), 
      ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-thumb': { 
            backgroundColor: mode === 'light' ? '#C1C7D0' : '#475569', 
            borderRadius: '4px' 
          },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }, // Remove overlay branco padrão do Material UI Dark
        elevation1: { 
            boxShadow: mode === 'light' 
                ? "0px 1px 2px rgba(9, 30, 66, 0.08), 0px 0px 1px rgba(9, 30, 66, 0.3)"
                : "none",
            border: mode === 'dark' ? `1px solid ${DARK_DIVIDER}` : 'none'
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? alpha(LIGHT_DIVIDER, 0.8) : DARK_DIVIDER}`,
          boxShadow: mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.02)' : 'none',
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: { padding: '8px 20px', borderRadius: 6 },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.2)' : 'none',
            transform: 'translateY(-1px)',
          },
        },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#FAFBFC' : alpha(DARK_PAPER, 0.5),
          transition: 'all 0.2s',
          
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#C1C7D0' : '#475569',
          },
          
          '&:hover': {
            backgroundColor: mode === 'light' ? '#EBECF0' : alpha(DARK_PAPER, 0.8),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? UFES_BLUE : '#4C9AFF',
            },
          },
          
          '&.Mui-focused': {
            backgroundColor: mode === 'light' ? '#FFFFFF' : DARK_PAPER,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? UFES_BLUE : '#4C9AFF',
              borderWidth: 2,
            },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { 
            borderBottom: `1px solid ${mode === 'light' ? alpha(LIGHT_DIVIDER, 0.8) : DARK_DIVIDER}`, 
            padding: '16px' 
        },
        head: {
          backgroundColor: mode === 'light' ? '#FAFBFC' : alpha(DARK_BG, 0.5),
          color: mode === 'light' ? LIGHT_TEXT_SEC : DARK_TEXT_SEC,
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': { border: 0 },
          transition: 'background-color 0.2s',
          '&:hover': { 
              backgroundColor: mode === 'light' 
                ? alpha(UFES_BLUE, 0.03) + ' !important' 
                : alpha('#4C9AFF', 0.08) + ' !important'
          },
        },
      },
    },

    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: mode === 'light' ? '#FFFFFF' : DARK_PAPER,
                color: mode === 'light' ? LIGHT_TEXT_PRI : DARK_TEXT_PRI,
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? LIGHT_DIVIDER : DARK_DIVIDER}`, 
            }
        }
    },

    // Ajuste para gráficos (Recharts) e ícones ficarem visíveis
    MuiSvgIcon: {
        styleOverrides: {
            root: {
                color: 'inherit' // Garante que herda a cor do texto (claro no dark mode)
            }
        }
    }
  },
});