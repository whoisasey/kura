import { Box } from "@mui/material";
import KuraLogo from "@/components/ui/KuraLogo";

const LoginLoading = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <KuraLogo />
    </Box>
  );
};

export default LoginLoading;
