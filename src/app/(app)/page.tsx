"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
        Good morning
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Dashboard coming soon
      </Typography>
    </Box>
  );
};

export default DashboardPage;
