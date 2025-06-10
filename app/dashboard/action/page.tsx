"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Phone,
  PlayCircle,
  Users,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Target,
  Globe,
  User,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

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
  const [callProgress, setCallProgress] = useState(0)

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

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedContacts(contacts.map((contact) => contact._id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (id: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedContacts, id]
    } else {
      newSelected = selectedContacts.filter((contactId) => contactId !== id)
    }

    setSelectedContacts(newSelected)
    setSelectAll(newSelected.length === contacts.length)
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
    setCallProgress(0)
    setError("")
    setSuccess("")

    try {
      const selectedContactsData = contacts.filter((contact) => selectedContacts.includes(contact._id))

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setCallProgress(prev => Math.min(prev + 15, 90))
      }, 500)

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

      clearInterval(progressInterval)
      setCallProgress(100)

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
      setCallProgress(0)
    }
  }

  const selectedPolicy_obj = policies.find(p => p._id === selectedPolicy)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Campaign</h1>
          <p className="text-gray-600">Launch targeted call campaigns with AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Phone className="w-3 h-3 mr-1" />
            {selectedContacts.length} selected
          </Badge>
        </div>
      </div>

      {/* Campaign Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Campaign Setup</span>
            </CardTitle>
            <CardDescription>
              Configure your call campaign parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Policy Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Select AI Agent Policy</span>
              </div>
              <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an AI agent policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy._id} value={policy._id}>
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span>{policy.agentName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPolicy_obj && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 line-clamp-3">
                    {selectedPolicy_obj.prompt}
                  </p>
                </div>
              )}
            </div>

            {/* Campaign Stats */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Campaign Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Selected Contacts</p>
                  <p className="text-lg font-bold text-gray-900">{selectedContacts.length}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Est. Duration</p>
                  <p className="text-lg font-bold text-gray-900">{selectedContacts.length * 2}m</p>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={selectedContacts.length === 0 || !selectedPolicy || callInProgress}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {callInProgress ? "Campaign Running..." : "Launch Campaign"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Campaign Launch</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to initiate calls to {selectedContacts.length} contacts using the "{selectedPolicy_obj?.agentName}" policy?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenConfirmDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInitiateCall}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Launch Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {callInProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Initiating calls...</span>
                  <span className="font-medium">{callProgress}%</span>
                </div>
                <Progress value={callProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Selection */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span>Select Contacts</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({contacts.length})
                  </label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts available</h3>
                <p className="text-gray-500">
                  Please upload contacts first to start campaigns.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone Number</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Name</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Language</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow 
                      key={contact._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedContacts.includes(contact._id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact._id)}
                          onCheckedChange={(checked) => handleSelectContact(contact._id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{contact.phone_number}</TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {contact.language.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Ready
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Contacts</p>
                <p className="text-xl font-bold text-blue-900">{totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Selected</p>
                <p className="text-xl font-bold text-green-900">{selectedContacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Policies</p>
                <p className="text-xl font-bold text-orange-900">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Est. Time</p>
                <p className="text-xl font-bold text-gray-900">{selectedContacts.length * 2}min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
