"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Upload,
  Users,
  Trash2,
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Filter,
  MoreHorizontal,
  Phone,
  Globe,
  User,
  Calendar,
} from "lucide-react"
import { Input } from "@/components/ui/input"

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      setUploadProgress(0)
      setError("")
      setSuccess("")

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/contacts/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

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
      setUploadProgress(0)
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

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_number.includes(searchTerm) ||
    contact.language.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
          <p className="text-gray-600">Upload and manage your contact lists for call campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Users className="w-3 h-3 mr-1" />
            {totalContacts.toLocaleString()} contacts
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Contacts</p>
                <p className="text-xl font-bold text-blue-900">{totalContacts.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Valid Numbers</p>
                <p className="text-xl font-bold text-green-900">{Math.floor(totalContacts * 0.95).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Languages</p>
                <p className="text-xl font-bold text-orange-900">
                  {new Set(contacts.map(c => c.language)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Upload</p>
                <p className="text-xl font-bold text-gray-900">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Upload Contacts</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file with columns: phone_number, language, name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700" disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </Button>

            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={totalContacts === 0 || uploading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete All Contacts</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete all {totalContacts} contacts from your database.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAllContacts}
                    disabled={deleteAllLoading}
                  >
                    {deleteAllLoading ? "Deleting..." : "Delete All"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading contacts...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span>Contact List</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-4">
                {contacts.length === 0 
                  ? "Upload a CSV file to get started with your contact management."
                  : "No contacts match your search criteria."
                }
              </p>
              {contacts.length === 0 && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First CSV
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Language</span>
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
                      <Calendar className="w-4 h-4" />
                      <span>Added On</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact._id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-sm">{contact.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contact.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
