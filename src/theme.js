// MUI custom theme for minimal, modern look
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffd700', // gold
    },
    secondary: {
      main: '#1de9b6', // teal
    },
    background: {
      default: '#18191c',
      paper: '#232325',
    },
    text: {
      primary: '#fff',
      secondary: '#ffe082',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontWeightRegular: 400,
    fontWeightBold: 700,
    h1: { fontWeight: 900, fontSize: '2.8rem', letterSpacing: '0.04em' },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          boxShadow: '0 0 8px #ffd70055',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        input: {
          background: '#232325',
          color: '#fff',
        },
      },
    },
  },
});

export default theme;
