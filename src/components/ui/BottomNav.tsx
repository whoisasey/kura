"use client";

import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

const tabs = [
  { label: "Home", icon: <HomeRoundedIcon />, path: "/" },
  { label: "Journal", icon: <EditNoteRoundedIcon />, path: "/journal" },
  { label: "Cycle", icon: <AutoAwesomeRoundedIcon />, path: "/cycle" },
  { label: "Library", icon: <MenuBookRoundedIcon />, path: "/library" },
  { label: "Insights", icon: <InsightsRoundedIcon />, path: "/insights" },
];

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = tabs.findIndex((t) => (t.path === "/" ? pathname === "/" : pathname.startsWith(t.path)));

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderTop: "0.5px solid",
        borderColor: "divider",
        pb: "env(safe-area-inset-bottom)",
      }}
      elevation={0}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={(_, index) => router.push(tabs[index].path)}
        sx={{ bgcolor: "background.paper" }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={tab.icon}
            sx={{
              minWidth: 0,
              "&.Mui-selected": { color: "primary.main" },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
