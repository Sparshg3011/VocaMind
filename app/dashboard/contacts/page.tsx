"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from "@mui/icons-material"

interface Contact {
  _id: string
  phone_number: string
  language: string
  name: string
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalContacts, setTotalContacts] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts?page=${page}&limit=${rowsPerPage}`)
      if (!response.ok) {
        throw new Error("Failed to fetch contacts")
      }
      const data = await response.json()
      setContacts(data.contacts)
      setTotalContacts(data.total)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      setError("Failed to load contacts. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is CSV
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/contacts/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload contacts")
      }

      const data = await response.json()
      setSuccess(`Successfully uploaded ${data.count} contacts`)
      fetchContacts()
    } catch (error: any) {
      console.error("Error uploading contacts:", error)
      setError(error.message || "Failed to upload contacts")
    } finally {
      setUploading(false)
      // Clear the file input
      event.target.value = ""
    }
  }

  const handleDeleteAllContacts = async () => {
    try {
      setDeleteAllLoading(true)
      const response = await fetch("/api/contacts", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete contacts")
      }

      setContacts([])
      setTotalContacts(0)
      setSuccess("All contacts deleted successfully")
      setOpenDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting contacts:", error)
      setError("Failed to delete contacts")
    } finally {
      setDeleteAllLoading(false)
    }
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Contact Management
        </Typography>
        <Typography variant="body1" paragraph>
          Upload a CSV file with contact information. The CSV should include columns for phone_number, language, and
          name.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button component="label" variant="contained" startIcon={<UploadIcon />} disabled={uploading}>
            Upload CSV
            <input type="file" accept=".csv" hidden onChange={handleFileUpload} disabled={uploading} />
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenDeleteDialog(true)}
            disabled={totalContacts === 0 || uploading}
          >
            Delete All
          </Button>
        </Box>

        {uploading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 2 }}>
            <CircularProgress size={24} />
            <Typography>Uploading contacts...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Phone Number</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Added On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 1 }}>Loading contacts...</Typography>
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography>No contacts found. Upload a CSV file to get started.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>{contact.phone_number}</TableCell>
                    <TableCell>{contact.language}</TableCell>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalContacts}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete All Contacts</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all contacts? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAllContacts}
            color="error"
            disabled={deleteAllLoading}
            startIcon={deleteAllLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
