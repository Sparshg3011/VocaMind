"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material"
import { Search as SearchIcon, Download as DownloadIcon, Visibility as VisibilityIcon } from "@mui/icons-material"

interface Call {
  _id: string
  phoneNumber: string
  language: string
  contactName: string
  agentName: string
  callSid: string
  status: string
  duration: number
  startTime: string
  endTime: string
  transcript: Array<{
    timestamp: string
    role: string
    text: string
  }>
  location: string
  createdAt: string
}

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCalls, setTotalCalls] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [openTranscriptDialog, setOpenTranscriptDialog] = useState(false)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    totalMessages: 0,
    callsByLanguage: [] as { language: string; count: number }[],
    callsByLocation: [] as { location: string; count: number }[],
  })

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calls?page=${page}&limit=${rowsPerPage}&search=${searchTerm}`)
      if (!response.ok) {
        throw new Error("Failed to fetch calls")
      }
      const data = await response.json()
      setCalls(data.calls)
      setTotalCalls(data.total)
    } catch (error) {
      console.error("Error fetching calls:", error)
      setError("Failed to load calls. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/calls/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch call statistics")
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching call statistics:", error)
    }
  }

  useEffect(() => {
    fetchCalls()
    fetchStats()
  }, [page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = () => {
    setPage(0)
    fetchCalls()
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch()
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/calls/export")
      if (!response.ok) {
        throw new Error("Failed to export calls")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `call_analytics_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting calls:", error)
      setError("Failed to export calls. Please try again.")
    }
  }

  const handleViewTranscript = (call: Call) => {
    setSelectedCall(call)
    setOpenTranscriptDialog(true)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Call Analytics
        </Typography>
        <Typography variant="body1" paragraph>
          View and analyze call data, durations, and transcripts.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Calls
                </Typography>
                <Typography variant="h4">{stats.totalCalls}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Avg. Duration
                </Typography>
                <Typography variant="h4">{formatDuration(stats.avgDuration)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Messages
                </Typography>
                <Typography variant="h4">{stats.totalMessages}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Languages
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {stats.callsByLanguage.map((item) => (
                    <Chip
                      key={item.language}
                      label={`${item.language}: ${item.count}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
            Search
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Phone Number</TableCell>
                <TableCell>Contact Name</TableCell>
                <TableCell>Agent Name</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 1 }}>Loading calls...</Typography>
                  </TableCell>
                </TableRow>
              ) : calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography>No calls found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                calls.map((call) => (
                  <TableRow key={call._id}>
                    <TableCell>{call.phoneNumber}</TableCell>
                    <TableCell>{call.contactName}</TableCell>
                    <TableCell>{call.agentName}</TableCell>
                    <TableCell>{formatDuration(call.duration)}</TableCell>
                    <TableCell>{call.transcript.length}</TableCell>
                    <TableCell>{call.location}</TableCell>
                    <TableCell>{new Date(call.startTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewTranscript(call)}>
                        Transcript
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCalls}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openTranscriptDialog} onClose={() => setOpenTranscriptDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Call Transcript - {selectedCall?.contactName} ({selectedCall?.phoneNumber})
        </DialogTitle>
        <DialogContent dividers>
          {selectedCall?.transcript.map((message, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor: message.role === "AI_Agent" ? "primary.light" : "grey.100",
              }}
            >
              <Typography variant="caption" display="block" gutterBottom>
                {message.role} - {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
              <Typography variant="body1">{message.text}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTranscriptDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
