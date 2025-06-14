# API Documentation

This document provides details about the API endpoints available in the Enhanced Call Management System.

## Authentication

All API endpoints require authentication. The API uses JWT tokens for authentication.

### Login

\`\`\`
POST /api/auth/login
\`\`\`

Request body:
\`\`\`json
{
  "username": "admin",
  "password": "password"
}
\`\`\`

Response:
\`\`\`json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "admin",
    "role": "admin"
  }
}
\`\`\`

## Contacts

### Get Contacts

\`\`\`
GET /api/contacts
\`\`\`

Query parameters:
- `page` (optional): Page number (default: 0)
- `limit` (optional): Number of contacts per page (default: 10)
- `search` (optional): Search term

Response:
\`\`\`json
{
  "contacts": [
    {
      "_id": "contact-id",
      "phone_number": "+1234567890",
      "language": "en",
      "name": "John Doe",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
\`\`\`

### Upload Contacts

\`\`\`
POST /api/contacts/upload
\`\`\`

Request body:
- `file`: CSV file with columns for phone_number, language, and name

Response:
\`\`\`json
{
  "message": "Contacts uploaded successfully",
  "count": 10
}
\`\`\`

### Delete All Contacts

\`\`\`
DELETE /api/contacts
\`\`\`

Response:
\`\`\`json
{
  "message": "All contacts deleted successfully"
}
\`\`\`

## Policies

### Get Policies

\`\`\`
GET /api/policies
\`\`\`

Response:
\`\`\`json
{
  "policies": [
    {
      "_id": "policy-id",
      "agentName": "Agent Name",
      "prompt": "Call instructions",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

### Create Policy

\`\`\`
POST /api/policies
\`\`\`

Request body:
\`\`\`json
{
  "agentName": "Agent Name",
  "prompt": "Call instructions"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Policy created successfully",
  "policyId": "policy-id"
}
\`\`\`

### Get Policy

\`\`\`
GET /api/policies/:id
\`\`\`

Response:
\`\`\`json
{
  "policy": {
    "_id": "policy-id",
    "agentName": "Agent Name",
    "prompt": "Call instructions",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
\`\`\`

### Update Policy

\`\`\`
PUT /api/policies/:id
\`\`\`

Request body:
\`\`\`json
{
  "agentName": "Updated Agent Name",
  "prompt": "Updated call instructions"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Policy updated successfully"
}
\`\`\`

### Delete Policy

\`\`\`
DELETE /api/policies/:id
\`\`\`

Response:
\`\`\`json
{
  "message": "Policy deleted successfully"
}
\`\`\`

## Calls

### Initiate Calls

\`\`\`
POST /api/calls/initiate
\`\`\`

Request body:
\`\`\`json
{
  "contacts": [
    {
      "_id": "contact-id",
      "phone_number": "+1234567890",
      "language": "en",
      "name": "John Doe"
    }
  ],
  "policyId": "policy-id"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Calls initiated successfully",
  "initiatedCalls": 1
}
\`\`\`

### Get Calls

\`\`\`
GET /api/calls
\`\`\`

Query parameters:
- `page` (optional): Page number (default: 0)
- `limit` (optional): Number of calls per page (default: 10)
- `search` (optional): Search term

Response:
\`\`\`json
{
  "calls": [
    {
      "_id": "call-id",
      "phoneNumber": "+1234567890",
      "contactName": "John Doe",
      "agentName": "Agent Name",
      "callSid": "CALL123",
      "status": "completed",
      "duration": 300,
      "startTime": "2023-01-01T00:00:00.000Z",
      "endTime": "2023-01-01T00:05:00.000Z",
      "transcript": [
        {
          "timestamp": "2023-01-01T00:00:10.000Z",
          "role": "AI_Agent",
          "text": "Hello, this is Agent Name calling from our company."
        }
      ],
      "location": "United States",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
\`\`\`

### Get Call Statistics

\`\`\`
GET /api/calls/stats
\`\`\`

Response:
\`\`\`json
{
  "totalCalls": 100,
  "avgDuration": 300,
  "totalMessages": 500,
  "callsByLanguage": [
    {
      "language": "en",
      "count": 80
    },
    {
      "language": "es",
      "count": 20
    }
  ],
  "callsByLocation": [
    {
      "location": "United States",
      "count": 70
    },
    {
      "location": "Canada",
      "count": 30
    }
  ]
}
\`\`\`

### Export Calls

\`\`\`
GET /api/calls/export
\`\`\`

Response: CSV file download

## Webhooks

### Register Webhook

\`\`\`
POST /api/webhooks
\`\`\`

Request body:
\`\`\`json
{
  "url": "https://example.com/webhook",
  "events": ["call.completed", "transcript.created"],
  "secret": "webhook-secret"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Webhook registered successfully",
  "webhookId": "webhook-id"
}
\`\`\`

## Users

### Get Users

\`\`\`
GET /api/users
\`\`\`

Response:
\`\`\`json
{
  "users": [
    {
      "id": "user-id",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastLogin": "2023-01-01T00:00:00.000Z",
      "active": true
    }
  ]
}
\`\`\`

### Create User

\`\`\`
POST /api/users
\`\`\`

Request body:
\`\`\`json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password",
  "role": "agent",
  "active": true
}
\`\`\`

Response:
\`\`\`json
{
  "message": "User created successfully",
  "userId": "user-id"
}
\`\`\`

### Update User

\`\`\`
PUT /api/users/:id
\`\`\`

Request body:
\`\`\`json
{
  "username": "updateduser",
  "email": "updateduser@example.com",
  "password": "newpassword",
  "role": "manager",
  "active": true
}
\`\`\`

Response:
\`\`\`json
{
  "message": "User updated successfully"
}
\`\`\`

### Delete User

\`\`\`
DELETE /api/users/:id
\`\`\`

Response:
\`\`\`json
{
  "message": "User deleted successfully"
}
\`\`\`

## Voice Analysis

### Get Voice Analytics

\`\`\`
GET /api/voice-analysis
\`\`\`

Query parameters:
- `timeRange` (optional): Time range (default: "7d")

Response:
\`\`\`json
{
  "sentimentScores": [
    {
      "subject": "Positive",
      "value": 80,
      "fullMark": 100
    }
  ],
  "keyPhrases": [
    {
      "phrase": "pricing plan",
      "count": 12
    }
  ],
  "callInsights": [
    {
      "id": "1",
      "callId": "CALL123",
      "insight": "Customer expressed frustration with technical issues",
      "sentiment": "Negative",
      "confidence": 0.85
    }
  ],
  "emotionDistribution": [
    {
      "name": "Satisfied",
      "value": 45
    }
  ]
}
\`\`\`

## WebSocket Events

The system uses WebSockets for real-time updates. Here are the available events:

### Call Monitoring

- `subscribe:calls`: Subscribe to call monitoring updates
- `data`: Receive initial data and updates
- `update`: Receive individual call updates
- `error`: Receive error notifications
\`\`\`

Let's also fix the package.json to include all the necessary dependencies for our enhanced features:
