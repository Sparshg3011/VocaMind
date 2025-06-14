# Outbound Call AI Assistant

This application allows you to make concurrent outbound calls to phone numbers listed in a CSV file. Each call connects to an AI voice assistant that uses Azure OpenAI's Realtime API to have natural conversations with the call recipients. The application can handle multiple concurrent calls, manages a queue for additional calls beyond the concurrency limit, and saves conversation transcripts to MongoDB.

## Features

- Make outbound calls to phone numbers listed in a CSV file
- Support for multiple languages (English, Spanish, Chinese, Russian, Haitian Creole, Korean)
- Concurrent call handling with queue management
- Interrupt handling for natural conversation flow
- Conversation transcript saving to MongoDB
- Call status monitoring

## Prerequisites

- Node.js 18+ (recommended: 18.20.4 or later)
- MongoDB database (Atlas or self-hosted)
- A Twilio account with:
  - Twilio phone number with Voice capabilities
  - Twilio Account SID and Auth Token
- Azure OpenAI account with:
  - Realtime API access
  - API Key and Endpoint
  - GPT-4o mini realtime deployment
- Ngrok or similar tool for exposing your local server to the internet

## Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Start ngrok to expose your server: `ngrok http 5050`
5. Update the `SERVER_URL` in your `.env` file with the ngrok URL

## Running the Application

1. Start the server: `npm start`
2. Prepare a CSV file with the phone numbers you want to call (see `phone_numbers.csv` for example format)
3. Trigger outbound calls by sending a POST request to the server:

```bash
curl -X POST http://localhost:5050/batch-calls \
  -H "Content-Type: application/json" \
  -d '{"filePath": "phone_numbers.csv"}'
```

## CSV File Format

The CSV file should have at least a `phone_number` column. Optionally, it can include a `language` column with language codes (`en`, `es`, `zh`, `ru`, `ht`, `ko`). For example:

```csv
phone_number,language,name
+15551234567,en,John Doe
+15552345678,es,Maria Rodriguez
```

## Monitoring Calls

You can check the status of your calls by sending a GET request to:

```bash
curl http://localhost:5050/call-status-summary
```

## Customization

You can customize the behavior of the AI assistant by modifying the `getSystemMessage` function in `index.js`. This allows you to change the conversation style, tone, and objectives for each supported language.

## Environment Variables

- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI API endpoint
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Your Azure OpenAI deployment name
- `MONGODB_URI`: Connection string for MongoDB
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
- `PORT`: The port to run the server on (default: 5050)
- `SERVER_URL`: Your server's public URL (ngrok or similar)
- `MAX_CONCURRENT_CALLS`: Maximum number of concurrent calls (default: 5)

## License

ISC


# Setting Up Ngrok and Twilio for Outbound Calling System

This guide explains how to set up Ngrok to expose your local server to the internet and configure Twilio to interact with your webhooks.

## Ngrok Setup

### 1. Install Ngrok

If you haven't already installed Ngrok, download it from [https://ngrok.com/download](https://ngrok.com/download) and follow the installation instructions.

### 2. Start Ngrok

Open a terminal window and run:

```bash
ngrok http 5050
```

This will create a secure tunnel to your local server running on port 5050.

### 3. Note Your Ngrok URL

After starting Ngrok, you'll see a screen like this:

```
Session Status                online
Account                       Your Account (Plan: Free)
Version                       3.8.0
Region                        United States (us)
Latency                       41ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-123-456-789-10.ngrok.io -> http://localhost:5050
```

**Copy the HTTPS URL** (in this example, `https://abcd-123-456-789-10.ngrok.io`). You'll need this for the next steps.

### 4. Update Your .env File

Open your `.env` file and update the `SERVER_URL` variable with your Ngrok URL:

```bash
SERVER_URL=https://abcd-123-456-789-10.ngrok.io
```

## Twilio Configuration

### 1. Log into Twilio Console

Go to [https://console.twilio.com](https://console.twilio.com) and log in to your account.

### 2. Get Your Account SID and Auth Token

From the Twilio Console Dashboard, copy your:
- Account SID
- Auth Token (click "Show" to reveal it)

Add these to your `.env` file:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

### 3. Purchase or Configure a Phone Number

#### If you don't have a phone number yet:
1. Go to "Phone Numbers" > "Buy a Number"
2. Select a number with Voice capabilities
3. Complete the purchase

#### If you already have a phone number:
1. Go to "Phone Numbers" > "Manage" > "Active Numbers"
2. Select your phone number

### 4. Configure Your Phone Number for Webhooks

Add your phone number to the `.env` file:

```bash
TWILIO_PHONE_NUMBER=+1234567890
```

**Important:** When making outbound calls with the code provided, you don't need to configure webhook URLs in the Twilio Console. All webhook URLs are specified programmatically in the `makeOutboundCall` function.

### 5. Set Up Trusted Webhook URLs (Optional)

For enhanced security, you can add your Ngrok URLs to Twilio's trusted URL list:

1. Go to "Settings" > "General" > "HTTP Webhooks"
2. Click "Add a webhook URL"
3. Add your base Ngrok URL (e.g., `https://abcd-123-456-789-10.ngrok.io`)

## Testing Your Setup

### 1. Start Your Node.js Server

```bash
npm start
```

### 2. Trigger Outbound Calls

Create a CSV file with phone numbers, then call the API endpoint:

```bash
curl -X POST http://localhost:5050/batch-calls \
  -H "Content-Type: application/json" \
  -d '{"filePath": "path/to/your/phone_numbers.csv"}'
```

### 3. Monitor Call Status

To check the status of ongoing calls:

```bash
curl http://localhost:5050/call-status-summary
```

## Important Notes

1. **Ngrok Sessions Expire**: Free Ngrok sessions expire and URLs change when you restart Ngrok. You'll need to update your SERVER_URL in the .env file each time.

2. **Webhook Validation**: The code includes validation for Twilio webhooks. In development, it's disabled by setting `NODE_ENV=development`. For production, enable validation by removing this setting.

3. **Voice Testing**: Ensure your Twilio account has sufficient funds for voice calls.

4. **Call Recording**: The system is set up to record calls. Make sure your users are aware of this and that you comply with local recording consent laws.

5. **MongoDB Connection**: Verify your MongoDB connection string is correct and that your database is accessible.

6. **Twilio Rate Limits**: Be aware of Twilio's rate limits for outbound calls. The system is designed to respect these limits with its queue mechanism, but you may need to adjust `MAX_CONCURRENT_CALLS` based on your Twilio plan.

By following these setup instructions, your outbound calling system should be properly connected to both Twilio and ngrok, allowing you to make calls and handle webhooks successfully.
