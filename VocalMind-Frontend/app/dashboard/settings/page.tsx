"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Save,
  Cloud,
  Database,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
  Key,
  Server,
  Globe,
} from "lucide-react"

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
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your application environment and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Settings className="w-3 h-3 mr-1" />
            Configuration
          </Badge>
        </div>
      </div>

      {/* Alerts */}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Azure OpenAI Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <span>Azure OpenAI Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your Azure OpenAI service connection for AI-powered conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="AZURE_OPENAI_ENDPOINT">Azure OpenAI Endpoint</Label>
                <Input
                  id="AZURE_OPENAI_ENDPOINT"
                  name="AZURE_OPENAI_ENDPOINT"
                  value={envVars.AZURE_OPENAI_ENDPOINT}
                  onChange={handleChange}
                  placeholder="https://your-resource.openai.azure.com/"
                  required
                />
                <p className="text-xs text-gray-500">Your Azure OpenAI service endpoint URL</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="AZURE_OPENAI_DEPLOYMENT_NAME">Deployment Name</Label>
                <Input
                  id="AZURE_OPENAI_DEPLOYMENT_NAME"
                  name="AZURE_OPENAI_DEPLOYMENT_NAME"
                  value={envVars.AZURE_OPENAI_DEPLOYMENT_NAME}
                  onChange={handleChange}
                  placeholder="gpt-4"
                  required
                />
                <p className="text-xs text-gray-500">Name of your deployed AI model</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="AZURE_OPENAI_API_KEY">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="AZURE_OPENAI_API_KEY"
                  name="AZURE_OPENAI_API_KEY"
                  type="password"
                  value={envVars.AZURE_OPENAI_API_KEY}
                  onChange={handleChange}
                  placeholder="••••••••••••••••"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Your Azure OpenAI API key (kept secure)</p>
            </div>
          </CardContent>
        </Card>

        {/* MongoDB Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <span>Database Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your MongoDB database connection for data storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="MONGODB_URI">MongoDB Connection URI</Label>
              <Input
                id="MONGODB_URI"
                name="MONGODB_URI"
                value={envVars.MONGODB_URI}
                onChange={handleChange}
                placeholder="mongodb://localhost:27017/your-database"
                required
              />
              <p className="text-xs text-gray-500">Full MongoDB connection string</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="DB_NAME">Database Name</Label>
                <Input
                  id="DB_NAME"
                  name="DB_NAME"
                  value={envVars.DB_NAME}
                  onChange={handleChange}
                  placeholder="call_management"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="COLLECTION_NAME">Collection Name</Label>
                <Input
                  id="COLLECTION_NAME"
                  name="COLLECTION_NAME"
                  value={envVars.COLLECTION_NAME}
                  onChange={handleChange}
                  placeholder="contacts"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Twilio Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-orange-600" />
              <span>Twilio Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your Twilio service for making and receiving calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="TWILIO_ACCOUNT_SID">Account SID</Label>
                <Input
                  id="TWILIO_ACCOUNT_SID"
                  name="TWILIO_ACCOUNT_SID"
                  value={envVars.TWILIO_ACCOUNT_SID}
                  onChange={handleChange}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="TWILIO_PHONE_NUMBER">Phone Number</Label>
                <Input
                  id="TWILIO_PHONE_NUMBER"
                  name="TWILIO_PHONE_NUMBER"
                  value={envVars.TWILIO_PHONE_NUMBER}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="TWILIO_AUTH_TOKEN">Auth Token</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="TWILIO_AUTH_TOKEN"
                  name="TWILIO_AUTH_TOKEN"
                  type="password"
                  value={envVars.TWILIO_AUTH_TOKEN}
                  onChange={handleChange}
                  placeholder="••••••••••••••••"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Your Twilio authentication token (kept secure)</p>
            </div>
          </CardContent>
        </Card>

        {/* Server Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-600" />
              <span>Server Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure server settings and performance parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="PORT">Port</Label>
                <Input
                  id="PORT"
                  name="PORT"
                  value={envVars.PORT}
                  onChange={handleChange}
                  placeholder="3000"
                  type="number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="MAX_CONCURRENT_CALLS">Max Concurrent Calls</Label>
                <Input
                  id="MAX_CONCURRENT_CALLS"
                  name="MAX_CONCURRENT_CALLS"
                  value={envVars.MAX_CONCURRENT_CALLS}
                  onChange={handleChange}
                  placeholder="10"
                  type="number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="NODE_ENV">Environment</Label>
                <Input
                  id="NODE_ENV"
                  name="NODE_ENV"
                  value={envVars.NODE_ENV}
                  onChange={handleChange}
                  placeholder="production"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="SERVER_URL">Server URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="SERVER_URL"
                  name="SERVER_URL"
                  value={envVars.SERVER_URL}
                  onChange={handleChange}
                  placeholder="https://your-domain.com"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Public URL for webhook callbacks</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
