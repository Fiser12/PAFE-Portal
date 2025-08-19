import { createTheme } from '@mui/material/styles';

// PAFE color palette from Tailwind configuration
const colors = {
  // Primary - PAFE Blue
  primary: {
    main: 'hsl(209, 52%, 45%)', // --primary from CSS variables
    light: 'hsl(209, 52%, 65%)', // --primary dark mode variant
    dark: 'hsl(209, 52%, 35%)', // Darker version
    contrastText: 'hsl(210, 40%, 98%)', // --primary-foreground
  },
  
  // Secondary - PAFE Orange
  secondary: {
    main: 'hsl(25, 69%, 56%)', // --secondary from CSS variables
    light: 'hsl(25, 69%, 65%)', // --secondary dark mode variant
    dark: 'hsl(25, 69%, 46%)', // Darker version
    contrastText: 'hsl(210, 40%, 98%)', // --secondary-foreground
  },

  // Background colors
  background: {
    default: 'hsl(0, 0%, 100%)', // --background light mode
    paper: 'hsl(240, 5%, 96%)', // --card light mode
    elevated: 'hsl(210, 40%, 96.1%)', // --muted light mode
  },

  // Text colors
  text: {
    primary: 'hsl(222.2, 84%, 4.9%)', // --foreground light mode
    secondary: 'hsl(215.4, 16.3%, 46.9%)', // --muted-foreground light mode
    disabled: 'hsl(215.4, 16.3%, 66.9%)', // Lighter version for disabled
  },

  // Dividers and borders
  divider: 'hsl(240, 6%, 80%)', // --border light mode
  
  // Custom colors for specific use cases
  surface: {
    primary: 'hsl(0, 0%, 100%)', // White for main surfaces
    secondary: 'hsl(240, 5%, 96%)', // --card for secondary surfaces
    tertiary: 'hsl(210, 40%, 96.1%)', // --muted for tertiary surfaces
  },

  // Status colors from Tailwind CSS variables
  success: {
    main: 'hsl(196, 52%, 74%)', // --success light mode
    light: 'hsl(196, 52%, 84%)',
    dark: 'hsl(196, 52%, 64%)',
  },
  warning: {
    main: 'hsl(34, 89%, 85%)', // --warning light mode
    light: 'hsl(34, 89%, 95%)',
    dark: 'hsl(34, 89%, 75%)',
  },
  error: {
    main: 'hsl(10, 100%, 86%)', // --error light mode
    light: 'hsl(10, 100%, 96%)',
    dark: 'hsl(10, 100%, 76%)',
  },
  info: {
    main: 'hsl(209, 52%, 45%)', // Using primary color
    light: 'hsl(209, 52%, 55%)',
    dark: 'hsl(209, 52%, 35%)',
  },
};

// Dark mode colors
const darkColors = {
  // Primary - PAFE Blue (adjusted for dark mode)
  primary: {
    main: 'hsl(209, 52%, 65%)', // --primary dark mode
    light: 'hsl(209, 52%, 75%)',
    dark: 'hsl(209, 52%, 55%)',
    contrastText: 'hsl(222.2, 47.4%, 11.2%)', // --primary-foreground dark mode
  },
  
  // Secondary - PAFE Orange (adjusted for dark mode)
  secondary: {
    main: 'hsl(25, 69%, 65%)', // --secondary dark mode
    light: 'hsl(25, 69%, 75%)',
    dark: 'hsl(25, 69%, 55%)',
    contrastText: 'hsl(222.2, 47.4%, 11.2%)', // --secondary-foreground dark mode
  },

  // Background - Dark theme
  background: {
    default: 'hsl(0, 0%, 0%)', // --background dark mode
    paper: 'hsl(0, 0%, 4%)', // --card dark mode
    elevated: 'hsl(217.2, 32.6%, 17.5%)', // --muted dark mode
  },

  // Text colors for dark mode
  text: {
    primary: 'hsl(210, 40%, 98%)', // --foreground dark mode
    secondary: 'hsl(215, 20.2%, 65.1%)', // --muted-foreground dark mode
    disabled: 'hsl(215, 20.2%, 45.1%)', // Darker version for disabled
  },

  // Dividers and borders
  divider: 'hsla(0, 0%, 15%, 0.8)', // --border dark mode
  
  // Custom colors for specific use cases
  surface: {
    primary: 'hsl(0, 0%, 4%)', // --card for main surfaces
    secondary: 'hsl(217.2, 32.6%, 17.5%)', // --muted for secondary surfaces
    tertiary: 'hsl(217.2, 32.6%, 27.5%)', // Lighter version for tertiary surfaces
  },

  // Status colors from Tailwind CSS variables (dark mode)
  success: {
    main: 'hsl(196, 100%, 14%)', // --success dark mode
    light: 'hsl(196, 100%, 24%)',
    dark: 'hsl(196, 100%, 4%)',
  },
  warning: {
    main: 'hsl(34, 51%, 25%)', // --warning dark mode
    light: 'hsl(34, 51%, 35%)',
    dark: 'hsl(34, 51%, 15%)',
  },
  error: {
    main: 'hsl(10, 39%, 43%)', // --error dark mode
    light: 'hsl(10, 39%, 53%)',
    dark: 'hsl(10, 39%, 33%)',
  },
  info: {
    main: 'hsl(209, 52%, 65%)', // Using primary color
    light: 'hsl(209, 52%, 75%)',
    dark: 'hsl(209, 52%, 55%)',
  },
};

// Create light theme
export const pafeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    divider: colors.divider,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  },
  
  typography: {
    fontFamily: [
      'var(--font-geist-sans)',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(','),
    
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    caption: {
      fontSize: '0.75rem',
      color: colors.text.secondary,
    },
  },

  shape: {
    borderRadius: 8, // Similar to Tailwind's default radius
  },

  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: colors.divider,
          '&:hover': {
            borderColor: colors.primary.main,
            backgroundColor: 'hsla(209, 52%, 45%, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface.secondary,
          border: `1px solid ${colors.divider}`,
          '& .MuiChip-label': {
            fontSize: '0.75rem',
          },
        },
        colorPrimary: {
          backgroundColor: colors.primary.main,
          color: colors.primary.contrastText,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface.primary,
          borderBottom: `1px solid ${colors.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.surface.secondary,
            '& fieldset': {
              borderColor: colors.divider,
            },
            '&:hover fieldset': {
              borderColor: colors.text.secondary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface.secondary,
          borderRadius: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: `${colors.background.paper} !important`,
          border: `1px solid ${colors.divider}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          color: colors.text.primary,
        },
      },
    },
  },
});

// Create dark theme
export const pafeDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    background: darkColors.background,
    text: darkColors.text,
    divider: darkColors.divider,
    success: darkColors.success,
    warning: darkColors.warning,
    error: darkColors.error,
    info: darkColors.info,
  },
  
  typography: {
    fontFamily: [
      'var(--font-geist-sans)',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(','),
    
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    caption: {
      fontSize: '0.75rem',
      color: darkColors.text.secondary,
    },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.background.paper,
          border: `1px solid ${darkColors.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: darkColors.divider,
          '&:hover': {
            borderColor: darkColors.primary.main,
            backgroundColor: 'hsla(209, 52%, 65%, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.surface.secondary,
          border: `1px solid ${darkColors.divider}`,
          '& .MuiChip-label': {
            fontSize: '0.75rem',
          },
        },
        colorPrimary: {
          backgroundColor: darkColors.primary.main,
          color: darkColors.primary.contrastText,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.background.paper,
          border: `1px solid ${darkColors.divider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.surface.primary,
          borderBottom: `1px solid ${darkColors.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: darkColors.surface.secondary,
            '& fieldset': {
              borderColor: darkColors.divider,
            },
            '&:hover fieldset': {
              borderColor: darkColors.text.secondary,
            },
            '&.Mui-focused fieldset': {
              borderColor: darkColors.primary.main,
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.surface.secondary,
          borderRadius: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: `${darkColors.background.paper} !important`,
          border: `1px solid ${darkColors.divider}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          color: darkColors.text.primary,
        },
      },
    },
  },
});

// Export colors for use in components
export { colors as lightColors, darkColors };