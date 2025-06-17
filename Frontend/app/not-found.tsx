"use client"

import { Box, Button, Container, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          py: 4,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  )
}
