"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FileText,
  Phone,
  Clock,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
} from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState({
    contacts: 0,
    policies: 0,
    calls: 0,
    avgDuration: 0,
    totalMessages: 0,
  })

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Contacts",
      value: stats.contacts.toLocaleString(),
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
      description: "Active contacts in system",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Active Policies",
      value: stats.policies.toLocaleString(),
      icon: FileText,
      change: "+5%",
      changeType: "positive" as const,
      description: "Configured call policies",
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Calls Made",
      value: stats.calls.toLocaleString(),
      icon: Phone,
      change: "+23%",
      changeType: "positive" as const,
      description: "Total calls initiated",
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      title: "Avg. Duration",
      value: `${stats.avgDuration}m`,
      icon: Clock,
      change: "-2%",
      changeType: "negative" as const,
      description: "Average call duration",
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ]

  const quickActions = [
    {
      title: "Upload Contacts",
      description: "Import new contact lists from CSV",
      icon: Users,
      color: "bg-blue-500",
      href: "/dashboard/contacts",
    },
    {
      title: "Create Policy",
      description: "Set up new call campaign rules",
      icon: FileText,
      color: "bg-purple-500",
      href: "/dashboard/policy",
    },
    {
      title: "Start Campaign",
      description: "Launch automated call sequences",
      icon: Phone,
      color: "bg-green-500",
      href: "/dashboard/action",
    },
    {
      title: "View Analytics",
      description: "Analyze campaign performance",
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/dashboard/analytics",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to VocaMind</h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Your intelligent call management platform. Monitor campaigns, analyze performance, and optimize your outreach strategy with AI-powered insights.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Zap className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Target className="w-3 h-3 mr-1" />
              Campaign Ready
            </Badge>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={card.changeType === 'positive' ? 'default' : 'destructive'}
                        className={`text-xs ${
                          card.changeType === 'positive' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {card.change}
                      </Badge>
                      <span className="text-xs text-gray-500">{card.description}</span>
                    </div>
                  </div>
                  
                  <div className={`w-12 h-12 rounded-xl ${card.lightColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                </div>
                
                {/* Progress bar for visual appeal */}
                <div className="mt-4">
                  <Progress 
                    value={Math.min((parseInt(card.value.replace(/\D/g, '')) / 1000) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Card key={index} className="group hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { action: "New contact list uploaded", time: "2 minutes ago", type: "success" },
                { action: "Campaign policy updated", time: "1 hour ago", type: "info" },
                { action: "Call campaign completed", time: "3 hours ago", type: "success" },
                { action: "Analytics report generated", time: "1 day ago", type: "info" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
              
              <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View all activity
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started Guide */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Getting Started Guide</span>
            </CardTitle>
            <Badge variant="outline">4 Steps</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Upload Contacts",
                description: "Import your contact lists via CSV upload in the Contacts section.",
                icon: Users,
                color: "bg-blue-500",
              },
              {
                step: "02", 
                title: "Create Policies",
                description: "Configure call scripts and agent instructions in the Policy section.",
                icon: FileText,
                color: "bg-purple-500",
              },
              {
                step: "03",
                title: "Launch Campaign",
                description: "Select contacts and initiate automated call campaigns.",
                icon: Phone,
                color: "bg-green-500",
              },
              {
                step: "04",
                title: "Analyze Results",
                description: "Review performance metrics and call transcripts in Analytics.",
                icon: TrendingUp,
                color: "bg-orange-500",
              },
            ].map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={index} className="relative p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${guide.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {guide.step}
                    </div>
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {guide.description}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
