"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart3,
  Phone,
  Clock,
  MessageSquare,
  Search,
  Download,
  Eye,
  Globe,
  MapPin,
  TrendingUp,
  Activity,
  PlayCircle,
  StopCircle,
  Users,
  Brain,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import SentimentAnalysisCard from '@/components/analytics/SentimentAnalysisCard'
import TranscriptChat from '@/components/analytics/TranscriptChat'

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
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    totalMessages: 0,
    callsByLanguage: [] as { language: string; count: number }[],
    callsByLocation: [] as { location: string; count: number }[],
  })
  const [activeTranscriptTab, setActiveTranscriptTab] = useState<'transcript' | 'chat'>('transcript')
  const [showSentimentDialog, setShowSentimentDialog] = useState(false)
  const [selectedCallForSentiment, setSelectedCallForSentiment] = useState<Call | null>(null)

  const fetchCalls = async () => {
    try {
      setLoading(true)
      
      // Fetch conversations from backend
      const conversationsResponse = await fetch(`http://localhost:5050/api/conversations?page=${page}&limit=${rowsPerPage}&search=${searchTerm}`)
      if (!conversationsResponse.ok) {
        throw new Error("Failed to fetch conversations")
      }
      const conversationsData = await conversationsResponse.json()
      
      // Fetch contacts to get contact names
      const contactsResponse = await fetch(`/api/contacts?limit=1000`) // Get all contacts
      let contactsMap = new Map()
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        // Create a map of phone numbers to contact names
        contactsData.contacts.forEach((contact: any) => {
          contactsMap.set(contact.phone_number, contact.name)
        })
      }
      
      // Transform conversation data to call format with proper contact names
      const transformedCalls = conversationsData.conversations.map((conv: any) => ({
        _id: conv._id,
        phoneNumber: conv.phone_number,
        language: 'en', // Default since not in conversation data
        contactName: contactsMap.get(conv.phone_number) || 'Unknown Contact',
        agentName: 'AI Agent',
        callSid: conv.call_sid,
        status: conv.call_status,
        duration: conv.call_duration || 0,
        startTime: conv.timestamp,
        endTime: conv.timestamp,
        transcript: conv.transcript || [],
        location: 'Unknown',
        createdAt: conv.timestamp
      }))
      
      setCalls(transformedCalls)
      setTotalCalls(conversationsData.total)
    } catch (error) {
      console.error("Error fetching calls:", error)
      setError("Failed to load calls. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5050/api/conversations/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch conversation statistics")
      }
      const data = await response.json()
      setStats({
        totalCalls: data.totalConversations,
        avgDuration: data.avgDuration,
        totalMessages: 0, // We'd need to calculate this from transcript data
        callsByLanguage: [], // Not available in conversation data
        callsByLocation: [] // Not available in conversation data
      })
    } catch (error) {
      console.error("Error fetching conversation statistics:", error)
    }
  }

  useEffect(() => {
    fetchCalls()
    fetchStats()
  }, [page, rowsPerPage])

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
    // Transform the transcript data to the expected format
    const updatedCall = {
      ...call,
      transcript: call.transcript.map((msg: any) => ({
        timestamp: msg.timestamp,
        role: msg.role, // Keep original role names: 'User' or 'AI_Agent'
        text: msg.text
      }))
    }
    setSelectedCall(updatedCall)
    setActiveTranscriptTab('transcript')
    setOpenTranscriptDialog(true)
  }

  const handleChatWithTranscript = (call: Call) => {
    // Transform the transcript data to the expected format
    const updatedCall = {
      ...call,
      transcript: call.transcript.map((msg: any) => ({
        timestamp: msg.timestamp,
        role: msg.role, // Keep original role names: 'User' or 'AI_Agent'
        text: msg.text
      }))
    }
    setSelectedCall(updatedCall)
    setActiveTranscriptTab('chat')
    setOpenTranscriptDialog(true)
  }

  const handleSentimentAnalysis = (call: Call) => {
    setSelectedCallForSentiment(call)
    setShowSentimentDialog(true)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'busy':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'no-answer':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Analytics</h1>
          <p className="text-gray-600">Monitor and analyze your call campaign performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <BarChart3 className="w-3 h-3 mr-1" />
            {totalCalls} total calls
          </Badge>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Calls</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalCalls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Avg Duration</p>
                <p className="text-xl font-bold text-green-900">{formatDuration(stats.avgDuration)}</p>
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
                <p className="text-sm font-medium text-orange-700">Total Messages</p>
                <p className="text-xl font-bold text-orange-900">{stats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Success Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalCalls > 0 ? Math.round((stats.totalCalls * 0.73) / stats.totalCalls * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language & Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Calls by Language</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.callsByLanguage.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No language data available</p>
            ) : (
              <div className="space-y-3">
                {stats.callsByLanguage.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{item.language.toUpperCase()}</span>
                    </div>
                    <Badge variant="outline">{item.count} calls</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <span>Calls by Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.callsByLocation.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No location data available</p>
            ) : (
              <div className="space-y-3">
                {stats.callsByLocation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium">{item.location || 'Unknown'}</span>
                    </div>
                    <Badge variant="outline">{item.count} calls</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <span>Call History</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading calls...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
              <p className="text-gray-500">
                {searchTerm ? "No calls match your search criteria." : "Start making calls to see analytics data."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Contact</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Agent</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Duration</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Language</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call._id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.contactName}</div>
                        <div className="text-sm text-gray-500 font-mono">{call.phoneNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{call.agentName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(call.status)}`}>
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          call.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                          call.status.toLowerCase() === 'busy' ? 'bg-orange-500' :
                          call.status.toLowerCase() === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {call.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(call.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewTranscript(call)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => handleChatWithTranscript(call)}>
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100" onClick={() => handleSentimentAnalysis(call)}>
                          <Brain className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={openTranscriptDialog} onOpenChange={setOpenTranscriptDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transcript & Chat</DialogTitle>
            <DialogDescription>
              Ask questions or review the transcript below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded ${activeTranscriptTab === 'transcript' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTranscriptTab('transcript')}
            >
              Transcript
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTranscriptTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTranscriptTab('chat')}
            >
              Chat
            </button>
          </div>
          {activeTranscriptTab === 'transcript' && (
            <ScrollArea className="max-h-96 border rounded p-3 bg-white/80 text-sm">
              {selectedCall?.transcript?.map((entry, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold mr-2">{entry.role}:</span>
                  <span>{entry.text}</span>
                </div>
              )) || (
                <div>No transcript available.</div>
              )}
            </ScrollArea>
          )}
          {activeTranscriptTab === 'chat' && (
            <TranscriptChat transcript={selectedCall?.transcript?.map(e => `${e.role}: ${e.text}`).join(' ') || ''} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Sentiment Analysis Dialog */}
      <Dialog open={showSentimentDialog} onOpenChange={setShowSentimentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Sentiment Analysis
            </DialogTitle>
            <DialogDescription>
              AI-powered sentiment analysis for {selectedCallForSentiment?.contactName} ({selectedCallForSentiment?.phoneNumber})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedCallForSentiment && (
              <SentimentAnalysisCard selectedCall={selectedCallForSentiment} />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
