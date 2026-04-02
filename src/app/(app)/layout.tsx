import BottomNav from "@/components/ui/BottomNav";
import { Box } from "@mui/material";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: "80px",
      }}
    >
      {children}
      <BottomNav />
    </Box>
  );
};

export default AppLayout;
