Below is the complete markdown content in a single code block. You can copy this content into a file named, for example, `outbound-calling-system.md` and save or open it in your favorite text editor (or "canvas") for further use.

```markdown
# Outbound Calling System API Documentation

This document provides a comprehensive overview of the API structure for the Outbound Calling System, including endpoints for initiating, managing, and monitoring outbound calls, Twilio webhook configurations, WebSocket connections for media streaming, and the expected CSV format for batch calls.

## API Endpoints

**1. Root Endpoint**  
**URL:** `/`  
**Method:** `GET`  
**Description:** Health check to verify that the server is running.  
**Response:**
```json
{
  "message": "Outbound Call Server is running!"
}
```

**2. Batch Calls Endpoint**  
**URL:** `/batch-calls`  
**Method:** `POST`  
**Description:** Initiates outbound calls using a CSV file.  
**Request Body:**
```json
{
  "filePath": "/path/to/phone_numbers.csv"
}
```
**Response:**
```json
{
  "message": "Started 5 calls, queued 10 calls",
  "totalCalls": 15,
  "activeCalls": 5,
  "queuedCalls": 10
}
```

**3. Call Status Summary Endpoint**  
**URL:** `/call-status-summary`  
**Method:** `GET`  
**Description:** Retrieves the status of all active and queued calls.  
**Response:**
```json
{
  "activeCalls": 3,
  "queuedCalls": 8,
  "activeSessions": [
    {
      "streamSid": "MS123456...",
      "phoneNumber": "+1234567890",
      "callSid": "CA123456...",
      "status": "in-progress",
      "language": "en",
      "messageCount": 12,
      "duration": 180
    }
  ]
}
```

## Twilio Webhook Endpoints

**Call Status Webhook**  
**URL:** `/call-status`  
**Method:** `POST` (primarily) or `GET`  
**Description:** Receives updates from Twilio regarding call statuses.  
**Parameters:** Twilio call status parameters.  
**Response:**
```json
{
  "status": "received"
}
```

**Gather Input Webhook**  
**URL:** `/gather-input`  
**Method:** `POST` (primarily) or `GET`  
**Description:** Processes DTMF input from users during calls.  
**Parameters:** Twilio gather parameters (Digits, CallSid, etc.).  
**Response:** TwiML instructions for subsequent steps.

**Recording Status Webhook**  
**URL:** `/recording-status`  
**Method:** `POST` (primarily) or `GET`  
**Description:** Receives recording URLs and status updates.  
**Parameters:** Twilio recording parameters.  
**Response:**
```json
{
  "status": "received"
}
```

**Fallback Webhook**  
**URL:** `/fallback`  
**Method:** `POST` (primarily) or `GET`  
**Description:** Handles errors during the call flow.  
**Parameters:** Twilio error parameters.  
**Response:** TwiML instructions for error handling.

**Twilio Events Webhook**  
**URL:** `/twilio-events`  
**Method:** `POST` (primarily) or `GET`  
**Description:** Generic endpoint for other Twilio events.  
**Parameters:** Various Twilio event parameters.  
**Response:**
```json
{
  "status": "received"
}
```

## WebSocket Endpoint

**Media Stream Connection**  
**URL:** `/media-stream`  
**Protocol:** `WebSocket`  
**Description:** Manages real-time audio streaming between Twilio and Azure OpenAI.  
**Parameters:** Passed via Twilio Stream Connect parameters.  
**Events:**
- **start:** Initializes a new stream.
- **media:** Transfers audio data.
- **mark:** Manages timing of audio playback.
- **disconnect:** Ends the WebSocket connection.

## CSV Format for Batch Calls

The system expects a CSV file containing at least the following columns:

- **phone_number:** The number to call (required)
- **language:** Language code (optional, defaults to `'en'`)

### Example CSV:
```csv
phone_number,language,name
+15551234567,en,John Doe
+15552345678,es,Maria Rodriguez
```

### Supported Language Codes:
- `en`
- `es`
- `zh`
- `ru`
- `ht`
- `ko`
```

To download this file, simply copy the content above into your preferred text editor and save it as `outbound-calling-system.md`.