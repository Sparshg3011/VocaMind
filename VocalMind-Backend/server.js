import Fastify from "fastify";
import WebSocket from "ws";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { parse } from "csv-parse/sync";
import twilio from "twilio";

// Load environment variables
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "wow-agent";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "wow-agent-transcript";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const MAX_CONCURRENT_CALLS = parseInt(process.env.MAX_CONCURRENT_CALLS || "5");
const PORT = process.env.PORT || 5050;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// Retrieve Azure OpenAI credentials
const {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT_NAME,
} = process.env;

// Check for required credentials
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
  console.error("Missing Azure OpenAI credentials. Please set them in the .env file.");
  process.exit(1);
}

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing Twilio credentials. Please set them in the .env file.");
  process.exit(1);
}

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Initialize MongoDB client
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Store active calls in a Map (keyed by streamSid)
const sessions = new Map();
const callQueue = [];
let activeCallCount = 0;

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      }
    }
  }
});

fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Twilio webhook validation middleware
fastify.addHook('preHandler', async (request, reply) => {
  // Skip validation for non-Twilio webhook routes
  if (!request.url.startsWith('/call-status') &&
      !request.url.startsWith('/recording-status') &&
      !request.url.startsWith('/fallback') &&
      !request.url.startsWith('/gather-input') &&
      !request.url.startsWith('/twilio-events')) {
    return;
  }
  
  // Skip validation in development when using ngrok for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping Twilio signature validation in development mode');
    return;
  }
  
  // Get the Twilio signature from the request headers
  const twilioSignature = request.headers['x-twilio-signature'];
  
  // The full URL that Twilio requested
  const url = SERVER_URL + request.url;
  
  // Validate the request using the Twilio validateRequest function
  const requestData = request.method === 'POST' ? request.body : request.query;
  
  const isValid = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    requestData
  );
  
  if (!isValid) {
    console.warn('Invalid Twilio signature for request to ' + request.url);
    reply.code(403).send({ error: 'Invalid Twilio signature' });
    return;
  }
});

// Improved MongoDB connection with retry mechanism
async function connectToDatabase(retryAttempt = 0, maxRetries = 5) {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    // Test connection by pinging the database
    await client.db(DB_NAME).command({ ping: 1 });
    console.log("MongoDB connection verified successfully!");
    return true;
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${retryAttempt + 1}/${maxRetries}):`, error);
    if (retryAttempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 30000); // Exponential backoff with max 30s
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectToDatabase(retryAttempt + 1, maxRetries);
    } else {
      console.error("Failed to connect to MongoDB after maximum retry attempts.");
      process.exit(1);
    }
  }
}

// Helper function to save conversation to MongoDB
async function saveConversationToMongoDB(session) {
  if (!session || !session.conversationLog || session.conversationLog.length === 0) {
    console.log("No conversation data to save");
    return false;
  }

  try {
    // Ensure MongoDB connection is alive
    await client.db(DB_NAME).command({ ping: 1 });
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.insertOne({
      id: Date.now(),
      phone_number: session.phoneNumber || "Unknown",
      stream_id: session.streamSid,
      call_sid: session.callSid,
      call_status: session.callStatus,
      call_duration: session.callDuration,
      recording_url: session.recordingUrl || null,
      transcript: session.conversationLog,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Successfully saved conversation to MongoDB (${session.conversationLog.length} messages) with ID: ${result.insertedId}`);
    console.log(`Phone number: ${session.phoneNumber}, Call SID: ${session.callSid}`);
    return true;
  } catch (error) {
    console.error("Error saving conversation to MongoDB:", error);
    // Attempt to reconnect if the connection was lost
    try {
      console.log("Attempting to reconnect to MongoDB...");
      await connectToDatabase(0, 2); // Fewer retries for runtime reconnection
      console.log("Reconnected to MongoDB, retrying save operation...");
      
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);
      
      const result = await collection.insertOne({
        id: Date.now(),
        phone_number: session.phoneNumber || "Unknown",
        stream_id: session.streamSid,
        call_sid: session.callSid,
        call_status: session.callStatus,
        call_duration: session.callDuration,
        recording_url: session.recordingUrl || null,
        transcript: session.conversationLog,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Successfully saved conversation to MongoDB after reconnection with ID: ${result.insertedId}`);
      return true;
    } catch (retryError) {
      console.error("Failed to save conversation after reconnection attempt:", retryError);
      return false;
    }
  }
}

// Helper function to return language-specific system instructions
function getSystemMessage(language = 'en') {
  switch(language) {
    case 'es':
      return `
# ROL:
- Eres un asistente de voz con IA diseñado para mantener conversaciones amigables con candidatos y recopilar información para crear currículums efectivos.
- Tu objetivo principal es guiar a los usuarios en el proceso de creación de currículums y garantizar que se recopilen todos los detalles necesarios de forma comprensiva.
- Debes mantener un tono cálido y accesible durante toda la conversación, manteniendo un tono profesional.
`;

    case 'zh':
      return `
# 角色：
- 您是 AI 语音助手，旨在与求职者进行友好对话，以收集创建有效简历的信息。
- 您的主要目标是指导用户完成简历构建过程，并确保以支持性的方式收集所有必要的详细信息。
- 在整个对话过程中，您必须保持热情、平易近人的语气，同时保持专业性。
`;

    case 'ru':
      return `
# РОЛЬ:
- Вы - голосовой помощник на основе искусственного интеллекта, предназначенный для ведения дружеских бесед с кандидатами на работу, чтобы собирать информацию для создания эффективных резюме.
- Ваша главная цель - направлять пользователей в процессе составления резюме и обеспечивать сбор всех необходимых данных в поддерживающей манере.
- Вы должны поддерживать теплый, доступный тон на протяжении всего разговора, сохраняя при этом профессионализм.
`;

    case 'ht':
      return `
# WÒL:
 - Ou se yon asistan vwa AI ki fèt pou fè konvèsasyon zanmitay ak kandida travay pou kolekte enfòmasyon pou kreye rezime efikas.
 - Objektif prensipal ou se gide itilizatè yo atravè pwosesis rezime-a epi asire yo kolekte tout detay ki nesesè yo nan yon fason ki bay sipò.
 - Ou dwe kenbe yon ton cho, apwòch pandan tout konvèsasyon an pandan w ap kenbe bagay yo pwofesyonèl.
`;

    case 'ko':
      return `
# 역할:
- 효과적인 이력서 작성을 위한 정보를 수집하기 위해 구직자와 친근하게 대화하도록 설계된 AI 음성 비서입니다.
- 주요 목표는 이력서 작성 프로세스를 안내하고 필요한 모든 세부 정보가 지원적인 방식으로 수집되도록 하는 것입니다.
- 전문적인 내용을 유지하면서 대화 내내 따뜻하고 친근한 어조를 유지해야 합니다.
`;
    
    default:
      return `
# ROLE:
- You are an AI voice assistant designed to conduct friendly conversations with job candidates to collect information for creating effective resumes.
- Your primary goal is to guide users through the resume-building process and ensure all necessary details are collected in a supportive manner.
- You must maintain a warm, approachable tone throughout the conversation while keeping things professional.
`;
  }
}

// --- Topical Guardrail Setup ---
const NOT_ALLOWED_TOPICS = [
  "politics",
  "religion",
  "hate speech",
  "adult content",
  "self-harm",
  "violence",
  "drugs",
  "extremism",
];

const TOPIC_BLOCK_MESSAGE =
  "I'm sorry, but I cannot discuss that topic. Let's stay focused on resume assistance.";

function isTopicAllowed(text) {
  if (!text) return true;
  const lowerText = text.toLowerCase();
  return !NOT_ALLOWED_TOPICS.some(topic => lowerText.includes(topic));
}

// Root Route
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Outbound Call Server is running!" });
});

// Fallback URL for error handling
fastify.all("/fallback", async (request, reply) => {
  const callSid = request.body?.CallSid || request.query?.CallSid;
  const errorCode = request.body?.ErrorCode || request.query?.ErrorCode;
  
  console.log(`Call ${callSid} failed with error code ${errorCode}`);
  
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                        <Response>
                            <Say>We're sorry, but an error occurred during your call. Please try again later.</Say>
                            <Hangup/>
                        </Response>`;
  
  reply.type("text/xml").send(twimlResponse);
});

// DTMF Input handling
fastify.all("/gather-input", async (request, reply) => {
  const digits = request.body?.Digits || request.query?.Digits;
  const callSid = request.body?.CallSid || request.query?.CallSid;
  const phoneNumber = request.body?.To || request.query?.To || "Unknown";
  
  console.log(`Received DTMF input from call ${callSid}: ${digits}`);
  
  // Look up the caller's preferred language - default to English if not found
  let language = 'en';
  for (const [sid, session] of sessions.entries()) {
    if (session.callSid === callSid || session.phoneNumber === phoneNumber) {
      language = session.language;
      break;
    }
  }
  
  // Handle different input options
  let twimlResponse;
  
  if (digits === '1') {
    // Option 1: Continue with AI assistant
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say language="${
                          language === 'es'
                            ? 'es-ES'
                            : language === 'zh'
                            ? 'zh-CN'
                            : language === 'ru'
                            ? 'ru-RU'
                            : language === 'ht'
                            ? 'fr-CA'  
                            : language === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        }">Continuing with the resume building assistant.</Say>
                        <Connect>
                            <Stream url="wss://${new URL(SERVER_URL).hostname}/media-stream">
                              <Parameter name="phoneNumber" value="${phoneNumber}"/>
                              <Parameter name="language" value="${language}"/>
                              <Parameter name="callSid" value="${callSid}"/>
                              <Parameter name="action" value="continue"/>
                            </Stream>
                        </Connect>
                    </Response>`;
  } else if (digits === '2') {
    // Option 2: Repeat information
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say language="${
                          language === 'es'
                            ? 'es-ES'
                            : language === 'zh'
                            ? 'zh-CN'
                            : language === 'ru'
                            ? 'ru-RU'
                            : language === 'ht'
                            ? 'fr-CA'  
                            : language === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        }">I'll repeat the previous information.</Say>
                        <Connect>
                            <Stream url="wss://${new URL(SERVER_URL).hostname}/media-stream">
                              <Parameter name="phoneNumber" value="${phoneNumber}"/>
                              <Parameter name="language" value="${language}"/>
                              <Parameter name="callSid" value="${callSid}"/>
                              <Parameter name="action" value="repeat"/>
                            </Stream>
                        </Connect>
                    </Response>`;
  } else if (digits === '9') {
    // Option 9: End the call
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say language="${
                          language === 'es'
                            ? 'es-ES'
                            : language === 'zh'
                            ? 'zh-CN'
                            : language === 'ru'
                            ? 'ru-RU'
                            : language === 'ht'
                            ? 'fr-CA'  
                            : language === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        }">Thank you for your time. Goodbye.</Say>
                        <Hangup/>
                    </Response>`;
  } else {
    // Invalid option
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say language="${
                          language === 'es'
                            ? 'es-ES'
                            : language === 'zh'
                            ? 'zh-CN'
                            : language === 'ru'
                            ? 'ru-RU'
                            : language === 'ht'
                            ? 'fr-CA'  
                            : language === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        }">Invalid option. Continuing with the assistant.</Say>
                        <Connect>
                            <Stream url="wss://${new URL(SERVER_URL).hostname}/media-stream">
                              <Parameter name="phoneNumber" value="${phoneNumber}"/>
                              <Parameter name="language" value="${language}"/>
                              <Parameter name="callSid" value="${callSid}"/>
                              <Parameter name="action" value="continue"/>
                            </Stream>
                        </Connect>
                    </Response>`;
  }
  
  reply.type("text/xml").send(twimlResponse);
});

// Recording status webhook
fastify.all("/recording-status", async (request, reply) => {
  const recordingUrl = request.body?.RecordingUrl || request.query?.RecordingUrl;
  const callSid = request.body?.CallSid || request.query?.CallSid;
  const recordingStatus = request.body?.RecordingStatus || request.query?.RecordingStatus;
  
  console.log(`Recording ${recordingStatus} for call ${callSid}: ${recordingUrl}`);
  
  // Find the session for this call and update it
  for (const [sid, session] of sessions.entries()) {
    if (session.callSid === callSid) {
      session.recordingUrl = recordingUrl;
      console.log(`Updated session with recording URL for call ${callSid}`);
      break;
    }
  }
  
  reply.send({ status: "received" });
});

// Twilio general events webhook
fastify.all("/twilio-events", async (request, reply) => {
  const eventType = request.body?.EventType || request.query?.EventType;
  const callSid = request.body?.CallSid || request.query?.CallSid;
  
  console.log(`Received Twilio event: ${eventType} for call ${callSid}`);
  
  // You can process different event types here as needed
  // Example: logging all events to a separate MongoDB collection for analytics
  
  reply.send({ status: "received" });
});

// WebSocket handler for media streams
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, (connection, req) => {
    console.log("New WebSocket client connected");
    let streamSid = null;
    
    connection.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.event) {
          case "start":
            streamSid = data.start.streamSid;
            const phoneNumber = data.start.customParameters?.phoneNumber || "Unknown";
            const callSid = data.start.customParameters?.callSid || "Unknown";
            const chosenLanguage = data.start.customParameters?.language || 'en';
            const action = data.start.customParameters?.action || 'normal';
            
            console.log(`New call stream started - SID: ${streamSid}, Phone: ${phoneNumber}, Call SID: ${callSid}, Language: ${chosenLanguage}, Action: ${action}`);
            
            // Check if this is a reconnection of an existing session
            const existingSessionKey = Array.from(sessions.keys()).find(key => {
              const session = sessions.get(key);
              return session.callSid === callSid;
            });
            
            if (existingSessionKey && existingSessionKey !== streamSid) {
              console.log(`Found existing session for Call SID ${callSid}, transferring data to new stream SID ${streamSid}`);
              const existingSession = sessions.get(existingSessionKey);
              
              // Close any existing WebSocket
              if (existingSession.openAiWs && existingSession.openAiWs.readyState === WebSocket.OPEN) {
                existingSession.openAiWs.close();
              }
              
              // Clear existing watchdog
              if (existingSession.audioWatchdog) {
                clearInterval(existingSession.audioWatchdog);
              }
              
              // Transfer data to new session
              sessions.set(streamSid, {
                ...existingSession,
                streamSid,
                latestMediaTimestamp: 0,
                lastAudioDeltaTime: Date.now(),
                lastAssistantItem: null,
                markQueue: [],
                responseStartTimestampTwilio: null,
                audioWatchdog: null,
                openAiWs: null,
                action
              });
              
              // Remove old session
              sessions.delete(existingSessionKey);
            } else {
              // Initialize new session
              sessions.set(streamSid, {
                streamSid,
                phoneNumber,
                callSid,
                language: chosenLanguage,
                latestMediaTimestamp: 0,
                lastAudioDeltaTime: Date.now(),
                lastAssistantItem: null,
                markQueue: [],
                responseStartTimestampTwilio: null,
                conversationLog: [],
                audioWatchdog: null,
                openAiWs: null,
                callStatus: "in-progress",
                callDuration: 0,
                callStartTime: Date.now(),
                action
              });
            }
            
            const session = sessions.get(streamSid);
            
            // Set up a watchdog to monitor audio delta messages
            session.audioWatchdog = setInterval(() => {
              const now = Date.now();
              if (now - session.lastAudioDeltaTime > 5000) { // 5 seconds threshold
                console.log(`Audio watchdog: No audio delta received for session ${streamSid} in over 5 seconds. Sending session update.`);
                if (session.openAiWs && session.openAiWs.readyState === WebSocket.OPEN) {
                  const systemMessage = getSystemMessage(session.language);
                  const sessionUpdate = {
                    type: "session.update",
                    session: {
                      turn_detection: { type: "server_vad" },
                      input_audio_format: "g711_ulaw",
                      output_audio_format: "g711_ulaw",
                      voice: "sage",
                      instructions: systemMessage,
                      modalities: ["text", "audio"],
                      temperature: 0.7,
                      input_audio_transcription: { model: "whisper-1" },
                    },
                  };
                  session.openAiWs.send(JSON.stringify(sessionUpdate));
                }
              }
            }, 2000);
            
            // Connect to Azure OpenAI WebSocket
            const openAiWs = new WebSocket(
              `${AZURE_OPENAI_ENDPOINT}/openai/realtime?api-version=2024-10-01-preview&deployment=${AZURE_OPENAI_DEPLOYMENT_NAME}`,
              {
                headers: {
                  "api-key": AZURE_OPENAI_API_KEY,
                  "OpenAI-Beta": "2024-12-17",
                },
              }
            );
            
            session.openAiWs = openAiWs;
            
            openAiWs.on("open", () => {
              console.log(`Connected to Azure OpenAI for stream ${streamSid}`);
              const systemMessage = getSystemMessage(session.language);
              const sessionUpdate = {
                type: "session.update",
                session: {
                  turn_detection: { type: "server_vad" },
                  input_audio_format: "g711_ulaw",
                  output_audio_format: "g711_ulaw",
                  voice: "sage",
                  instructions: systemMessage,
                  modalities: ["text", "audio"],
                  temperature: 0.7,
                  input_audio_transcription: { model: "whisper-1" },
                },
              };
              openAiWs.send(JSON.stringify(sessionUpdate));
              
              // Send initial message based on action
              setTimeout(() => {
                let initialText;
                
                if (action === 'repeat') {
                  initialText = "Please repeat the previous information about resume building.";
                } else {
                  initialText = "Greet the user warmly and explain that you'll be helping them create a professional resume. Ask for their full name to begin the process.";
                }
                
                const initialMessage = {
                  type: "conversation.item.create",
                  item: {
                    type: "message",
                    role: "user",
                    content: [
                      {
                        type: "input_text",
                        text: initialText
                      }
                    ]
                  }
                };
                
                openAiWs.send(JSON.stringify(initialMessage));
                openAiWs.send(JSON.stringify({ type: "response.create" }));
              }, 1000);
            });
            
            openAiWs.on("message", (data) => {
              try {
                const response = JSON.parse(data);
                if (!sessions.has(streamSid)) return;
                const session = sessions.get(streamSid);
                
                // Process audio delta responses
                if (response.type === "response.audio.delta" && response.delta) {
                  session.lastAudioDeltaTime = Date.now();
                  connection.send(JSON.stringify({
                    event: "media",
                    streamSid: session.streamSid,
                    media: { payload: response.delta }
                  }));
                  
                  if (!session.responseStartTimestampTwilio) {
                    session.responseStartTimestampTwilio = session.latestMediaTimestamp;
                  }
                  
                  if (response.item_id) session.lastAssistantItem = response.item_id;
                  
                  connection.send(JSON.stringify({
                    event: "mark",
                    streamSid: session.streamSid,
                    mark: { name: "responsePart" }
                  }));
                  
                  session.markQueue.push("responsePart");
                }
                
                // Process user transcription
                if (response.type === "conversation.item.input_audio_transcription.completed") {
                  let transcript = response.transcript;
                  if (!isTopicAllowed(transcript)) {
                    console.log(`User transcript contains disallowed topic: "${transcript}"`);
                    transcript = TOPIC_BLOCK_MESSAGE;
                  }
                  const timestamp = new Date().toISOString();
                  const logEntry = { timestamp, role: "User", text: transcript };
                  console.log(`[${streamSid}] User: ${transcript}`);
                  session.conversationLog.push(logEntry);
                }
                
                // Process AI transcription
                if (response.type === "response.audio_transcript.done") {
                  let transcript = response.transcript;
                  if (!isTopicAllowed(transcript)) {
                    console.log(`AI transcript contains disallowed topic: "${transcript}"`);
                    transcript = TOPIC_BLOCK_MESSAGE;
                  }
                  const timestamp = new Date().toISOString();
                  const logEntry = { timestamp, role: "AI_Agent", text: transcript };
                  console.log(`[${streamSid}] AI: ${transcript}`);
                  session.conversationLog.push(logEntry);
                  
                  // If the AI says goodbye, send a disconnect message and close the connection.
                  if (transcript.toLowerCase().includes("goodbye") || 
                      transcript.toLowerCase().includes("thank you for your time")) {
                    console.log(`Goodbye detected for stream ${streamSid}. Initiating disconnect sequence.`);
                    
                    // Send a disconnect event to the client
                    connection.send(JSON.stringify({
                      event: "disconnect",
                      streamSid: session.streamSid,
                      message: "Conversation ended. Disconnecting call in 5 seconds"
                    }));
                    
                    // Delay the disconnection
                    setTimeout(() => {
                      connection.close();
                    }, 5000);
                    return;
                  }
                  
                  // After each AI response, offer options to user (except when it's a goodbye message)
                  setTimeout(() => {
                    // Send DTMF gather options periodically
                    // This will disconnect the stream temporarily, but the client will reconnect
                    twilioClient.calls(session.callSid)
                      .update({
                        twiml: `<?xml version="1.0" encoding="UTF-8"?>
                                <Response>
                                  <Gather numDigits="1" action="${SERVER_URL}/gather-input" method="POST" timeout="3">
                                    <Say language="${
                                      session.language === 'es'
                                        ? 'es-ES'
                                        : session.language === 'zh'
                                        ? 'zh-CN'
                                        : session.language === 'ru'
                                        ? 'ru-RU'
                                        : session.language === 'ht'
                                        ? 'fr-CA'  
                                        : session.language === 'ko'
                                        ? 'ko-KR'
                                        : 'en-US'
                                    }">Press 1 to continue, 2 to repeat information, or 9 to end call.</Say>
                                  </Gather>
                                  <Connect>
                                    <Stream url="wss://${new URL(SERVER_URL).hostname}/media-stream">
                                      <Parameter name="phoneNumber" value="${session.phoneNumber}"/>
                                      <Parameter name="language" value="${session.language}"/>
                                      <Parameter name="callSid" value="${session.callSid}"/>
                                      <Parameter name="action" value="continue"/>
                                    </Stream>
                                  </Connect>
                                </Response>`
                      })
                      .catch(error => {
                        console.error(`Error updating call with DTMF options: ${error}`);
                      });
                  }, 10000); // Wait 10 seconds after AI response before offering options
                }
                
                // Handle interruption when the caller's speech starts
                if (response.type === "input_audio_buffer.speech_started") {
                  if (session.markQueue.length > 0 && session.responseStartTimestampTwilio != null) {
                    const elapsedTime = session.latestMediaTimestamp - session.responseStartTimestampTwilio;
                    console.log(`Speech started, truncating AI response after ${elapsedTime}ms`);
                    
                    if (session.lastAssistantItem) {
                      const truncateEvent = {
                        type: "conversation.item.truncate",
                        item_id: session.lastAssistantItem,
                        content_index: 0,
                        audio_end_ms: elapsedTime
                      };
                      session.openAiWs.send(JSON.stringify(truncateEvent));
                    }
                    
                    connection.send(JSON.stringify({
                      event: "clear",
                      streamSid: session.streamSid
                    }));
                    
                    // Reset
                    session.markQueue = [];
                    session.lastAssistantItem = null;
                    session.responseStartTimestampTwilio = null;
                  }
                }
              } catch (error) {
                console.error(`Error processing OpenAI message for stream ${streamSid || 'unknown'}:`, error);
              }
            });
            
            openAiWs.on("close", () => {
              console.log(`Disconnected from Azure OpenAI for stream ${streamSid}`);
            });
            
            openAiWs.on("error", (error) => {
              console.error(`OpenAI WebSocket error for stream ${streamSid}:`, error);
            });
            break;
            
          case "media":
            if (sessions.has(streamSid)) {
              const session = sessions.get(streamSid);
              session.latestMediaTimestamp = data.media.timestamp;
              if (session.openAiWs && session.openAiWs.readyState === WebSocket.OPEN) {
                session.openAiWs.send(JSON.stringify({ 
                  type: "input_audio_buffer.append", 
                  audio: data.media.payload 
                }));
              }
            }
            break;
            
          case "mark":
            if (sessions.has(streamSid)) {
              const session = sessions.get(streamSid);
              if (session.markQueue.length > 0) session.markQueue.shift();
            }
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error(`Error parsing WebSocket message for stream ${streamSid || 'unknown'}:`, error);
      }
    });
    
    connection.on("close", async () => {
      if (!streamSid || !sessions.has(streamSid)) {
        console.log("Connection closed for unknown or already closed session");
        return;
      }
      
      const session = sessions.get(streamSid);
      console.log(`WebSocket connection closing for stream ${streamSid} with ${session.conversationLog.length} messages`);
      
      if (session.openAiWs?.readyState === WebSocket.OPEN) {
        session.openAiWs.close();
        console.log(`Closed OpenAI WebSocket for stream ${streamSid}`);
      }
      
      // Clear the watchdog timer if set
      if (session.audioWatchdog) {
        clearInterval(session.audioWatchdog);
      }
      
      // Calculate call duration
      session.callDuration = Math.floor((Date.now() - session.callStartTime) / 1000);
      session.callStatus = "completed";
      
      if (session.conversationLog && session.conversationLog.length > 0) {
        console.log(`Saving conversation with ${session.conversationLog.length} messages to MongoDB...`);
        try {
          const saved = await saveConversationToMongoDB(session);
          if (saved) {
            console.log(`Successfully saved conversation for stream ${streamSid} to MongoDB`);
          } else {
            console.error(`Failed to save conversation for stream ${streamSid} to MongoDB`);
          }
        } catch (error) {
          console.error(`Error during MongoDB save for stream ${streamSid}:`, error);
        }
      } else {
        console.log(`No conversation data to save for stream ${streamSid}`);
      }
      
      sessions.delete(streamSid);
      activeCallCount--;
      console.log(`Session ${streamSid} cleaned up and removed from active sessions. Active calls: ${activeCallCount}`);
      
      // Process next call in queue if any
      processNextCallInQueue();
    });
  });
});