"use client";

import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { ReactNode, createContext, useContext, useState } from "react";
import { darkTheme, lightTheme } from "@/styles/theme";

type Mode = "light" | "dark";

const ColorModeContext = createContext({
  mode: "light" as Mode,
  toggle: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("kura-theme") as Mode | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const toggle = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("kura-theme", next);
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <MuiThemeProvider theme={mode === "light" ? lightTheme : darkTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
