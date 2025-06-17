"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Bot,
  Edit,
  Trash2,
  Save,
  Plus,
  MessageSquare,
  Calendar,
  User,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react"

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Policies</h1>
          <p className="text-gray-600">Configure your AI agents with custom instructions and behaviors</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Bot className="w-3 h-3 mr-1" />
            {policies.length} policies
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Policies</p>
                <p className="text-xl font-bold text-blue-900">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Active Agents</p>
                <p className="text-xl font-bold text-green-900">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Avg Prompt Length</p>
                <p className="text-xl font-bold text-orange-900">
                  {policies.length > 0 
                    ? Math.round(policies.reduce((acc, p) => acc + p.prompt.length, 0) / policies.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {editingPolicy ? (
              <>
                <Edit className="w-5 h-5 text-orange-600" />
                <span>Edit Policy</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create New Policy</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            Define how your AI agents should behave during calls
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
              <Sparkles className="w-4 h-4" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="agentName" className="text-sm font-medium">
                Agent Name
              </Label>
              <Input
                id="agentName"
                placeholder="e.g., Sales Agent, Support Agent"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">
                Choose a descriptive name for your AI agent
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Status</Label>
              <div className="flex items-center space-x-2 h-10">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </Badge>
                <span className="text-sm text-gray-500">Ready for use</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Agent Instructions
            </Label>
            <Textarea
              id="prompt"
              placeholder="Define how your agent should behave, what to say, and how to handle different scenarios..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-gray-500">
              Be specific about tone, objectives, and responses. Character count: {prompt.length}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {editingPolicy ? (
              <>
                <Button 
                  onClick={handleUpdatePolicy} 
                  disabled={actionLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {actionLoading ? "Updating..." : "Update Policy"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleSavePolicy} 
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {actionLoading ? "Creating..." : "Create Policy"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Policies List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <span>Existing Policies</span>
          </CardTitle>
          <CardDescription>
            Manage and edit your AI agent policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading policies...</span>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
              <p className="text-gray-500 mb-4">
                Create your first AI agent policy to get started with automated calls.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Policy
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {policies.map((policy) => (
                <Card key={policy._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{policy.agentName}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(policy.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {policy.prompt.length} chars
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {policy.prompt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                            className="h-8 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDeletePolicy(policy._id)}
                            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400">
                          Updated {new Date(policy.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this policy? This action cannot be undone and may affect active campaigns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePolicy}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
