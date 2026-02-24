import { alpha } from '@mui/material/styles';

// --- Paleta Emerald ---
const EMERALD       = '#059669'; // emerald-600 — primária light
const EMERALD_DARK  = '#34D399'; // emerald-400 — primária dark
const EMERALD_LIGHT = '#10B981'; // emerald-500

// Light mode
const LIGHT_BG        = '#F0FDF4'; // emerald-50
const LIGHT_PAPER     = '#FFFFFF';
const LIGHT_TEXT_PRI  = '#111827'; // gray-900
const LIGHT_TEXT_SEC  = '#6B7280'; // gray-500
const LIGHT_DIVIDER   = '#D1FAE5'; // emerald-100

// Dark mode — verde-preto profundo
const DARK_BG         = '#0A0F0D'; // verde-preto
const DARK_PAPER      = '#111917'; // levemente mais claro
const DARK_APPBAR     = '#0D1A10'; // entre BG e paper
const DARK_TEXT_PRI   = '#ECFDF5'; // emerald-50
const DARK_TEXT_SEC   = '#94A3B8'; // slate-400
const DARK_DIVIDER    = '#1D2E23'; // borda verde escura

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main:         mode === 'light' ? EMERALD : EMERALD_DARK,
      light:        mode === 'light' ? EMERALD_LIGHT : '#6EE7B7',
      dark:         mode === 'light' ? '#047857' : '#059669',
      contrastText: mode === 'light' ? '#FFFFFF' : '#022C22',
    },
    secondary: {
      main:         mode === 'light' ? '#D97706' : '#FCD34D',
      contrastText: '#111827',
    },
    success: {
      main: mode === 'light' ? '#059669' : '#34D399',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
    background: {
      default: mode === 'light' ? LIGHT_BG    : DARK_BG,
      paper:   mode === 'light' ? LIGHT_PAPER : DARK_PAPER,
    },
    text: {
      primary:   mode === 'light' ? LIGHT_TEXT_PRI : DARK_TEXT_PRI,
      secondary: mode === 'light' ? LIGHT_TEXT_SEC : DARK_TEXT_SEC,
    },
    divider: mode === 'light'
      ? LIGHT_DIVIDER
      : DARK_DIVIDER,
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.005em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: '1.05rem' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: mode === 'dark'
    ? Array(25).fill('none')
    : [
        'none',
        '0px 1px 3px rgba(5,150,105,0.06), 0px 1px 2px rgba(5,150,105,0.04)',
        '0px 3px 8px rgba(5,150,105,0.08), 0px 1px 4px rgba(5,150,105,0.05)',
        ...Array(22).fill('0px 8px 24px rgba(0,0,0,0.10)'),
      ],

  components: {

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'light' ? '#A7F3D0' : '#1D3826',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: mode === 'light' ? '#6EE7B7' : '#2D5040',
          },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? LIGHT_PAPER : DARK_APPBAR,
          color: mode === 'light' ? LIGHT_TEXT_PRI : DARK_TEXT_PRI,
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'light' ? LIGHT_DIVIDER : DARK_DIVIDER}`,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0px 1px 3px rgba(5,150,105,0.07), 0px 0px 1px rgba(5,150,105,0.2)'
            : 'none',
          border: mode === 'dark' ? `1px solid ${DARK_DIVIDER}` : 'none',
        },
        elevation3: {
          boxShadow: mode === 'light'
            ? '0px 3px 10px rgba(5,150,105,0.1), 0px 1px 3px rgba(5,150,105,0.06)'
            : 'none',
          border: mode === 'dark' ? `1px solid ${DARK_DIVIDER}` : 'none',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? LIGHT_DIVIDER : DARK_DIVIDER}`,
          boxShadow: mode === 'light'
            ? '0px 1px 4px rgba(5,150,105,0.06)'
            : 'none',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          padding: '8px 20px',
          borderRadius: 7,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0px 3px 8px rgba(5,150,105,0.3)'
              : '0 0 16px rgba(52,211,153,0.2)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#FFFFFF' : alpha(DARK_PAPER, 0.6),
          transition: 'all 0.2s',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#D1FAE5' : DARK_DIVIDER,
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? '#F0FDF4' : alpha(DARK_PAPER, 0.9),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? EMERALD : EMERALD_DARK,
            },
          },
          '&.Mui-focused': {
            backgroundColor: mode === 'light' ? '#FFFFFF' : DARK_PAPER,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? EMERALD : EMERALD_DARK,
              borderWidth: 2,
            },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? LIGHT_DIVIDER : DARK_DIVIDER}`,
          padding: '14px 16px',
        },
        head: {
          backgroundColor: mode === 'light'
            ? alpha(LIGHT_DIVIDER, 0.7)
            : alpha(DARK_BG, 0.7),
          color: mode === 'light' ? LIGHT_TEXT_SEC : '#6EE7B7',
          fontWeight: 700,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': { border: 0 },
          transition: 'background-color 0.15s',
          '&:hover': {
            backgroundColor: mode === 'light'
              ? alpha(EMERALD, 0.04) + ' !important'
              : alpha(EMERALD_DARK, 0.07) + ' !important',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: mode === 'light'
            ? alpha(EMERALD, 0.12)
            : alpha(EMERALD_DARK, 0.12),
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: mode === 'light' ? EMERALD : EMERALD_DARK,
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: mode === 'light' ? EMERALD : EMERALD_DARK,
          },
        },
      },
    },

    MuiSvgIcon: {
      styleOverrides: {
        root: { color: 'inherit' },
      },
    },
  },
});
