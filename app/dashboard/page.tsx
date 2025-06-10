"use client"

import { useState, useEffect } from "react"
import { Box, Card, CardContent, Grid, Typography, Paper, Divider } from "@mui/material"
import { ContactPhone, Description, Call, AccessTime, Message } from "@mui/icons-material"

export default function Dashboard() {
  const [stats, setStats] = useState({
    contacts: 0,
    policies: 0,
    calls: 0,
    avgDuration: 0,
    totalMessages: 0,
  })

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Contacts",
      value: stats.contacts,
      icon: <ContactPhone sx={{ fontSize: 40, color: "primary.main" }} />,
      color: "#e3f2fd",
    },
    {
      title: "Policies",
      value: stats.policies,
      icon: <Description sx={{ fontSize: 40, color: "secondary.main" }} />,
      color: "#fce4ec",
    },
    {
      title: "Calls Made",
      value: stats.calls,
      icon: <Call sx={{ fontSize: 40, color: "success.main" }} />,
      color: "#e8f5e9",
    },
    {
      title: "Avg. Call Duration",
      value: `${stats.avgDuration} min`,
      icon: <AccessTime sx={{ fontSize: 40, color: "warning.main" }} />,
      color: "#fff8e1",
    },
    {
      title: "Total Messages",
      value: stats.totalMessages,
      icon: <Message sx={{ fontSize: 40, color: "info.main" }} />,
      color: "#e1f5fe",
    },
  ]

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundImage: "linear-gradient(to right, #1976d2, #64b5f6)",
          color: "white",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to Call Management System
        </Typography>
        <Typography variant="body1">
          Manage your contacts, create policies, initiate calls, and analyze results all in one place.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: "100%", backgroundColor: card.color }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Start Guide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                1. Upload Contacts
              </Typography>
              <Typography variant="body2">
                Navigate to the Contacts section and upload a CSV file with phone numbers, languages, and names.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                2. Create Policies
              </Typography>
              <Typography variant="body2">Set up agent names and call instructions in the Policy section.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                3. Initiate Calls
              </Typography>
              <Typography variant="body2">Select contacts and initiate calls from the Action section.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                4. Analyze Results
              </Typography>
              <Typography variant="body2">
                View call analytics, durations, and transcripts in the Analytics section.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
