# VocaMind

**An AI-Powered Outbound Calling System with Real-Time Analytics**

VocaMind is a sophisticated voice communication platform that combines AI-powered conversation capabilities with comprehensive call management and analytics. The system enables automated outbound calling with real-time sentiment analysis, conversation insights, and advanced reporting capabilities.

## Features

### Core Functionality
- **AI-Powered Conversations**: Integration with Azure OpenAI Realtime API for natural voice interactions
- **Automated Outbound Calls**: Bulk calling system using Twilio for phone number lists
- **Real-Time Audio Streaming**: WebSocket-based audio streaming between Twilio and Azure OpenAI
- **Multi-Language Support**: Support for English, Spanish, Chinese, Russian, Haitian Creole, and Korean
- **Sentiment Analysis**: Real-time sentiment scoring and analysis of conversations
- **Call Recording**: Automatic call recording with status tracking

### Analytics & Insights
- **Conversation Analytics**: Detailed sentiment analysis with positive/negative word tracking
- **Call Statistics**: Comprehensive call metrics and performance tracking
- **Real-Time Dashboard**: Live monitoring of active calls and queue status
- **Interactive Transcripts**: Chat-style transcript viewing with sentiment indicators
- **Export Capabilities**: Data export functionality for further analysis

### Management Features
- **Contact Management**: Upload and manage contact lists
- **Policy Management**: Configure call policies and guidelines
- **User Authentication**: Secure login and session management
- **Settings Management**: Configurable system settings and preferences

## Architecture

```
VocaMind/
├── Backend/                 # Node.js/Fastify API Server
│   ├── index.js            # Main server entry point
│   ├── server.js           # Fastify server configuration
│   ├── demo.js             # Demo functionality
│   ├── test-sentiment.js   # Sentiment analysis testing
│   └── phone_numbers.csv   # Sample phone number data
│
└── Frontend/               # Next.js React Application
    ├── app/                # Next.js 13+ App Router
    │   ├── api/           # API Routes
    │   │   ├── calls/     # Call management endpoints
    │   │   ├── contacts/  # Contact management
    │   │   ├── conversations/ # Conversation data
    │   │   └── dashboard/ # Dashboard statistics
    │   ├── dashboard/     # Dashboard pages
    │   └── page.tsx       # Landing/login page
    ├── components/        # React components
    │   ├── analytics/     # Analytics components
    │   ├── ui/           # UI component library
    │   └── app-layout.tsx # Main layout component
    └── lib/              # Utilities and configurations
        ├── auth-context.tsx # Authentication context
        ├── mongodb.ts      # MongoDB connection
        └── utils.ts        # Utility functions
```

## Technology Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Fastify (high-performance web framework)
- **Database**: MongoDB for data persistence
- **Communication**: 
  - Twilio for telephony services
  - Azure OpenAI Realtime API for AI conversations
  - WebSocket for real-time audio streaming
- **Additional Libraries**:
  - `sentiment` for sentiment analysis
  - `csv-parse` for CSV file processing
  - `axios` for HTTP requests

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with shadcn/ui
- **State Management**: React Context for authentication
- **Database**: MongoDB integration
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB database
- Twilio account with phone number
- Azure OpenAI account with Realtime API access

### Environment Variables

Create `.env` files in both Backend and Frontend directories:

#### Backend (.env)
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
MONGODB_URI=your_mongodb_connection_string
PORT=5050
```

#### Frontend (.env.local)
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_API_URL=http://localhost:5050
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VocaMind
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../Frontend
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev  # Development mode
   # or
   npm start    # Production mode
   ```

5. **Start the Frontend Application**
   ```bash
   cd Frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050

## API Documentation

### Core Endpoints

#### Call Management
- `GET /` - Health check
- `POST /batch-calls` - Initiate batch calls from CSV
- `GET /call-status-summary` - Get active call statistics

#### Twilio Webhooks
- `POST /call-status` - Call status updates
- `POST /gather-input` - DTMF input processing
- `POST /recording-status` - Recording status updates
- `POST /fallback` - Error handling
- `POST /twilio-events` - General Twilio events

#### WebSocket
- `WS /media-stream` - Real-time audio streaming

### Frontend API Routes
- `/api/calls` - Call data management
- `/api/contacts` - Contact management
- `/api/conversations` - Conversation data
- `/api/dashboard/stats` - Dashboard statistics
- `/api/generate-suggestions` - AI-generated suggestions

## CSV Format for Batch Calls

```csv
phone_number,language,name
+15551234567,en,John Doe
+15552345678,es,Maria Rodriguez
+15553456789,zh,李明
```

**Supported Languages**: `en`, `es`, `zh`, `ru`, `ht`, `ko`

## Usage

### Making Outbound Calls
1. Upload a CSV file with phone numbers via the Contacts page
2. Navigate to the Dashboard
3. Click "Initiate Calls" and select your contact list
4. Monitor real-time call progress and analytics

### Viewing Analytics
1. Access the Analytics page from the dashboard
2. View sentiment analysis charts and conversation metrics
3. Click on individual calls to see detailed transcripts
4. Export data for further analysis

### Managing Settings
1. Configure call policies in the Policy section
2. Adjust system settings via the Settings page
3. Manage user preferences and authentication

## Development

### Backend Development
```bash
cd Backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd Frontend
npm run dev  # Starts Next.js development server
```

### Testing
```bash
# Backend
cd Backend
npm test

# Frontend
cd Frontend
npm test
```

## Production Deployment

### Backend
1. Set production environment variables
2. Build and start the server:
   ```bash
   npm start
   ```

### Frontend
1. Build the Next.js application:
   ```bash
   npm run build
   npm start
   ```

### Docker (Optional)
Docker configurations can be added for containerized deployment.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
1. Check the API documentation in `Backend/API.md`
2. Review the frontend documentation in `Frontend/docs/api.md`
3. Create an issue in the repository

## Future Enhancements

- Advanced AI conversation flows
- Multi-tenant support
- Enhanced analytics and reporting
- Integration with CRM systems
- Advanced call routing and distribution
- Real-time collaboration features

---

**VocaMind** - Transforming voice communications with AI-powered insights and automation.
