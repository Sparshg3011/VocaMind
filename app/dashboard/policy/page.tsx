"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material"

interface Policy {
  _id: string
  agentName: string
  prompt: string
  createdAt: string
  updatedAt: string
}

export default function PolicyPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [agentName, setAgentName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/policies")
      if (!response.ok) {
        throw new Error("Failed to fetch policies")
      }
      const data = await response.json()
      setPolicies(data.policies)
    } catch (error) {
      console.error("Error fetching policies:", error)
      setError("Failed to load policies. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const handleSavePolicy = async () => {
    if (!agentName.trim() || !prompt.trim()) {
      setError("Agent name and prompt are required")
      return
    }

    try {
      setActionLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentName,
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create policy")
      }

      setAgentName("")
      setPrompt("")
      setSuccess("Policy created successfully")
      fetchPolicies()
    } catch (error) {
      console.error("Error creating policy:", error)
      setError("Failed to create policy")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePolicy = async () => {
    if (!editingPolicy || !agentName.trim() || !prompt.trim()) {
      setError("Agent name and prompt are required")
      return
    }

    try {
      setActionLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch(`/api/policies/${editingPolicy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentName,
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update policy")
      }

      setAgentName("")
      setPrompt("")
      setEditingPolicy(null)
      setSuccess("Policy updated successfully")
      fetchPolicies()
    } catch (error) {
      console.error("Error updating policy:", error)
      setError("Failed to update policy")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/policies/${policyToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete policy")
      }

      setPolicies(policies.filter((policy) => policy._id !== policyToDelete))
      setSuccess("Policy deleted successfully")
      setOpenDeleteDialog(false)
      setPolicyToDelete(null)
    } catch (error) {
      console.error("Error deleting policy:", error)
      setError("Failed to delete policy")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy)
    setAgentName(policy.agentName)
    setPrompt(policy.prompt)
  }

  const handleCancelEdit = () => {
    setEditingPolicy(null)
    setAgentName("")
    setPrompt("")
  }

  const confirmDeletePolicy = (policyId: string) => {
    setPolicyToDelete(policyId)
    setOpenDeleteDialog(true)
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {editingPolicy ? "Edit Policy" : "Create New Policy"}
        </Typography>
        <Typography variant="body1" paragraph>
          Define agent names and call instructions for your automated calls.
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

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Agent Name"
              fullWidth
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Call Instructions"
              fullWidth
              multiline
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              margin="normal"
              required
              placeholder="Enter detailed workflow instructions for the call..."
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              {editingPolicy ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleUpdatePolicy}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Updating..." : "Update Policy"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleSavePolicy} disabled={actionLoading}>
                  {actionLoading ? "Creating..." : "Create Policy"}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Existing Policies
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : policies.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>No policies found. Create your first policy above.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid item xs={12} md={6} key={policy._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {policy.agentName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-wrap",
                      maxHeight: "150px",
                      overflow: "auto",
                    }}
                  >
                    {policy.prompt}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Last updated: {new Date(policy.updatedAt).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleEditPolicy(policy)} disabled={actionLoading}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => confirmDeletePolicy(policy._id)} disabled={actionLoading} color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Policy</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this policy? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePolicy}
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
