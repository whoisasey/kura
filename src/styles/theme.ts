import { Theme, createTheme } from "@mui/material/styles";

const baseTokens = {
  warning: { main: "#D4853A" },
  success: { main: "#6B8F71" },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2rem", fontWeight: 500 },
    h2: { fontSize: "1.5rem", fontWeight: 500 },
    h3: { fontSize: "1.25rem", fontWeight: 500 },
    body1: { fontSize: "1rem", fontWeight: 400 },
    body2: { fontSize: "0.875rem", fontWeight: 400 },
    caption: { fontSize: "0.75rem", fontWeight: 400 },
  },
};

export const lightTheme: Theme = createTheme({
  ...baseTokens,
  palette: {
    mode: "light",
    primary: { main: "#8B5A3A", contrastText: "#FDF8F3" },
    warning: { main: "#D4853A" },
    success: { main: "#6B8F71" },
    background: { default: "#FDF8F3", paper: "#F5EDE3" },
    text: {
      primary: "#2A1710",
      secondary: "#8B5A3A",
      disabled: "#C49A72",
    },
  },
});

export const darkTheme: Theme = createTheme({
  ...baseTokens,
  palette: {
    mode: "dark",
    primary: { main: "#D4956A", contrastText: "#2A1C12" },
    warning: { main: "#E8A055" },
    success: { main: "#7EA882" },
    background: { default: "#2A1C12", paper: "#3E2A1E" },
    text: {
      primary: "#F2C99A",
      secondary: "#D4956A",
      disabled: "#7A4A2E",
    },
  },
});
