import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const lightPalette = {
  primary: { main: "#0FAA46" },
  secondary: { main: "#4BC978" },
  background: {
    default: "#ffffff",      // Main background
    paper: "#f7f7f7",        // Cards, surfaces
    level1: "#ededed",       // Subtle backgrounds
    level2: "#e8e8e8",       // Hover states
    level3: "#e0e0e0",       // Active states
    sidebar: "#fafafa",      // Sidebar background
    footer: "#f5f5f5",       // Footer background
  },
  text: {
    primary: "#000000",
    secondary: "#2c2c2c",
  }
};

const darkPalette = {
  primary: { main: "#0FAA46" },
  secondary: { main: "#4BC978" },
  mode: "dark",
  background: {
    default: "#000000",      // Main background
    paper: "#0e0e0e",        // Cards, surfaces
    level1: "#1a1a1a",       // Subtle backgrounds
    level2: "#222222",       // Hover states
    level3: "#2a2a2a",       // Active states
    sidebar: "#111111",      // Sidebar background
    footer: "#0a0a0a",       // Footer background
  },
  text: {
    primary: "#ffffff",
    secondary: "#aaaaaa",
  }
};

const getTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  
  return createTheme({
    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "110%",
        fontSize: "clamp(48px, 8vw, 80px)",
        letterSpacing: "-1.5px",
      },
      h2: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "115%",
        fontSize: "clamp(36px, 6vw, 56px)",
        letterSpacing: "-0.5px",
      },
      h3: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "120%",
        fontSize: "clamp(28px, 5vw, 40px)",
        letterSpacing: "-0.15px",
      },
      h4: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "125%",
        fontSize: "clamp(22px, 4vw, 28px)",
        letterSpacing: "-0.5px",
      },
      h5: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "130%",
        fontSize: "clamp(16px, 3vw, 18px)",
        letterSpacing: "-0.2px",
      },
      h6: {
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 600,
        lineHeight: "140%",
        fontSize: "clamp(16px, 2.5vw, 17px)",
        letterSpacing: "0px",
      },
      superbody: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(15px, 2vw, 17px)",
        fontWeight: 700,
        lineHeight: "150%",
        letterSpacing: "0.15px",
      },
      body1: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(14px, 2vw, 14px)",
        fontWeight: 400,
        lineHeight: "150%",
        letterSpacing: "0.15px",
      },
      body2: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(13px, 1.8vw, 16px)",
        fontWeight: 400,
        lineHeight: "160%",
        letterSpacing: "0.1px",
      },
      caption: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(11px, 1.5vw, 12px)",
        fontWeight: 400,
        lineHeight: "170%",
        letterSpacing: "0.4px",
      },
      button: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(13px, 2vw, 15px)",
        fontWeight: 500,
        textTransform: "none",
        letterSpacing: "0.5px",
      },
    },
    palette: isDark ? { ...darkPalette, error: { main: red[500] } } : { ...lightPalette, error: { main: red[500] } },
    components: {
      MuiButton: {
        styleOverrides: {
          contained: {
            borderRadius: "6px",
            textTransform: "none",
            padding: "4px 14px",
            fontWeight: 500,
            background: "#0FAA46",
            color: "white",
            fontSize: "15px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#126932",
              boxShadow: "none",
            },
          },
        },
      },
      MuiFormLabel: {
        defaultProps: {
          required: false
        }
      },
      MuiTextField: {
        defaultProps: {
          variant: "filled",
        },
        styleOverrides: {
          root: {
            "& .MuiInputLabel-root": {
              display: "none"
            },
            "& .MuiFilledInput-root": {
              borderRadius: "12px",
              backgroundColor: isDark ? "transparent" : "transparent",
              border: `1px solid ${isDark ? "#404040" : "#d4d4d4"}`,
              boxShadow: `inset 0 0 0 1px ${isDark ? "#525252" : "#e5e5e5"}`,
              minHeight: "52px",
              "& input": {
                fontSize: "15px",
                fontFamily: 'Inter',
                padding: "14px",
                color: isDark ? "#ffffff" : "#000000",
              },
              "&:before": {
                display: "none"
              },
              "&:hover:before": {
                display: "none"
              },
              "&.Mui-focused:before": {
                display: "none"
              },
              "&:after": {
                display: "none"
              },
              "&:hover": {
                backgroundColor: isDark ? "transparent" : "transparent",
                borderColor: isDark ? "#525252" : "#a3a3a3",
                boxShadow: `inset 0 0 0 1px ${isDark ? "#737373" : "#d4d4d4"}`
              },
              "&.Mui-focused": {
                backgroundColor: isDark ? "transparent" : "transparent",
                border: `2px solid ${isDark ? "#404040" : "#d4d4d4"}`,
                boxShadow: `inset 0 0 0 1px ${isDark ? "#525252" : "#1e1e1e"}`,
              },
              "& input:-webkit-autofill": {
                WebkitBoxShadow: isDark ? "0 0 0px 1000px transparent inset" : "0 0 0px 1000px transparent inset",
                WebkitTextFillColor: isDark ? "#ffffff" : "#000000",
                WebkitBorderRadius: "12px",
                transition: "background-color 5000s ease-in-out 0s"
              },
              "&.Mui-focused input:-webkit-autofill": {
                WebkitBoxShadow: isDark ? "0 0 0px 1000px transparent inset" : "0 0 0px 1000px #ffffff inset",
              }
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(24, 24, 24, 0.8)" : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          backdrop: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    },
    shape: {
      borderRadius: 10,
    },
  });
};

export default getTheme;