"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Box, Paper, Typography, TextField, Button, Grid, Alert, CircularProgress, Divider } from "@mui/material"
import { Save as SaveIcon } from "@mui/icons-material"

interface EnvVars {
  AZURE_OPENAI_ENDPOINT: string
  AZURE_OPENAI_API_KEY: string
  AZURE_OPENAI_DEPLOYMENT_NAME: string
  MONGODB_URI: string
  DB_NAME: string
  COLLECTION_NAME: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
  PORT: string
  SERVER_URL: string
  MAX_CONCURRENT_CALLS: string
  NODE_ENV: string
}

export default function SettingsPage() {
  const [envVars, setEnvVars] = useState<EnvVars>({
    AZURE_OPENAI_ENDPOINT: "",
    AZURE_OPENAI_API_KEY: "",
    AZURE_OPENAI_DEPLOYMENT_NAME: "",
    MONGODB_URI: "",
    DB_NAME: "",
    COLLECTION_NAME: "",
    TWILIO_ACCOUNT_SID: "",
    TWILIO_AUTH_TOKEN: "",
    TWILIO_PHONE_NUMBER: "",
    PORT: "",
    SERVER_URL: "",
    MAX_CONCURRENT_CALLS: "",
    NODE_ENV: "",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/settings")
        if (!response.ok) {
          throw new Error("Failed to fetch environment variables")
        }
        const data = await response.json()
        setEnvVars(data.envVars)
      } catch (error) {
        console.error("Error fetching environment variables:", error)
        setError("Failed to load environment variables. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchEnvVars()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEnvVars((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ envVars }),
      })

      if (!response.ok) {
        throw new Error("Failed to update environment variables")
      }

      setSuccess("Environment variables updated successfully")
    } catch (error) {
      console.error("Error updating environment variables:", error)
      setError("Failed to update environment variables. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" paragraph>
          Configure environment variables for the application.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Azure OpenAI Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Azure OpenAI Endpoint"
                name="AZURE_OPENAI_ENDPOINT"
                value={envVars.AZURE_OPENAI_ENDPOINT}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Azure OpenAI API Key"
                name="AZURE_OPENAI_API_KEY"
                value={envVars.AZURE_OPENAI_API_KEY}
                onChange={handleChange}
                fullWidth
                required
                type="password"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Azure OpenAI Deployment Name"
                name="AZURE_OPENAI_DEPLOYMENT_NAME"
                value={envVars.AZURE_OPENAI_DEPLOYMENT_NAME}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                MongoDB Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="MongoDB URI"
                name="MONGODB_URI"
                value={envVars.MONGODB_URI}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Database Name"
                name="DB_NAME"
                value={envVars.DB_NAME}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Collection Name"
                name="COLLECTION_NAME"
                value={envVars.COLLECTION_NAME}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Twilio Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Twilio Account SID"
                name="TWILIO_ACCOUNT_SID"
                value={envVars.TWILIO_ACCOUNT_SID}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Twilio Auth Token"
                name="TWILIO_AUTH_TOKEN"
                value={envVars.TWILIO_AUTH_TOKEN}
                onChange={handleChange}
                fullWidth
                required
                type="password"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Twilio Phone Number"
                name="TWILIO_PHONE_NUMBER"
                value={envVars.TWILIO_PHONE_NUMBER}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Server Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Port"
                name="PORT"
                value={envVars.PORT}
                onChange={handleChange}
                fullWidth
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Server URL"
                name="SERVER_URL"
                value={envVars.SERVER_URL}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Max Concurrent Calls"
                name="MAX_CONCURRENT_CALLS"
                value={envVars.MAX_CONCURRENT_CALLS}
                onChange={handleChange}
                fullWidth
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Node Environment"
                name="NODE_ENV"
                value={envVars.NODE_ENV}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} sx={{ mt: 2 }}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}
