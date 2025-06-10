"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material"
import { Call as CallIcon } from "@mui/icons-material"

interface Contact {
  _id: string
  phone_number: string
  language: string
  name: string
}

interface Policy {
  _id: string
  agentName: string
  prompt: string
}

export default function ActionPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalContacts, setTotalContacts] = useState(0)
  const [callInProgress, setCallInProgress] = useState(false)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)

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

  const fetchPolicies = async () => {
    try {
      const response = await fetch("/api/policies")
      if (!response.ok) {
        throw new Error("Failed to fetch policies")
      }
      const data = await response.json()
      setPolicies(data.policies)
    } catch (error) {
      console.error("Error fetching policies:", error)
      setError("Failed to load policies. Please try again.")
    }
  }

  useEffect(() => {
    fetchContacts()
    fetchPolicies()
  }, [page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
    setSelectedContacts([])
    setSelectAll(false)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
    setSelectedContacts([])
    setSelectAll(false)
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(event.target.checked)
    if (event.target.checked) {
      setSelectedContacts(contacts.map((contact) => contact._id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (id: string) => {
    const selectedIndex = selectedContacts.indexOf(id)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = [...selectedContacts, id]
    } else {
      newSelected = selectedContacts.filter((contactId) => contactId !== id)
    }

    setSelectedContacts(newSelected)
    setSelectAll(newSelected.length === contacts.length)
  }

  const handlePolicyChange = (event: SelectChangeEvent) => {
    setSelectedPolicy(event.target.value)
  }

  const handleInitiateCall = async () => {
    if (selectedContacts.length === 0) {
      setError("Please select at least one contact")
      return
    }

    if (!selectedPolicy) {
      setError("Please select a policy")
      return
    }

    setOpenConfirmDialog(false)
    setCallInProgress(true)
    setError("")
    setSuccess("")

    try {
      const selectedContactsData = contacts.filter((contact) => selectedContacts.includes(contact._id))

      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: selectedContactsData,
          policyId: selectedPolicy,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initiate calls")
      }

      const data = await response.json()
      setSuccess(`Successfully initiated ${data.initiatedCalls} calls`)
      setSelectedContacts([])
      setSelectAll(false)
    } catch (error: any) {
      console.error("Error initiating calls:", error)
      setError(error.message || "Failed to initiate calls")
    } finally {
      setCallInProgress(false)
    }
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Call Action
        </Typography>
        <Typography variant="body1" paragraph>
          Select contacts and a policy to initiate calls.
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

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="policy-select-label">Select Policy</InputLabel>
            <Select
              labelId="policy-select-label"
              id="policy-select"
              value={selectedPolicy}
              label="Select Policy"
              onChange={handlePolicyChange}
              disabled={callInProgress}
            >
              {policies.length === 0 ? (
                <MenuItem disabled value="">
                  No policies available
                </MenuItem>
              ) : (
                policies.map((policy) => (
                  <MenuItem key={policy._id} value={policy._id}>
                    {policy.agentName}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<CallIcon />}
            disabled={selectedContacts.length === 0 || !selectedPolicy || callInProgress}
            onClick={() => setOpenConfirmDialog(true)}
            sx={{ mb: 2 }}
          >
            {callInProgress ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Initiating Calls...
              </>
            ) : (
              `Initiate Call${selectedContacts.length > 1 ? "s" : ""} (${selectedContacts.length})`
            )}
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedContacts.length > 0 && selectedContacts.length < contacts.length}
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={loading || callInProgress}
                  />
                </TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Name</TableCell>
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
                    <Typography>No contacts found. Upload contacts first.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedContacts.includes(contact._id)}
                        onChange={() => handleSelectContact(contact._id)}
                        disabled={callInProgress}
                      />
                    </TableCell>
                    <TableCell>{contact.phone_number}</TableCell>
                    <TableCell>{contact.language}</TableCell>
                    <TableCell>{contact.name}</TableCell>
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

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Call Initiation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to initiate {selectedContacts.length} call{selectedContacts.length > 1 ? "s" : ""}?
            This will use the selected policy and contact the selected phone numbers.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleInitiateCall} variant="contained" color="primary" startIcon={<CallIcon />}>
            Initiate Calls
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
