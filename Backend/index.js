import Fastify from "fastify";
import WebSocket from "ws";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import { parse } from "csv-parse/sync";
import twilio from "twilio";

// Add this import at the top of the file
import axios from 'axios';

// Load environment variables
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "wow-agent";
const COLLECTION_NAME = "wow-agent-transcript";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const MAX_CONCURRENT_CALLS = parseInt(process.env.MAX_CONCURRENT_CALLS || "5");
const PORT = process.env.PORT || 5050;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const AUTO_BATCH_CALLS_PATH = process.env.AUTO_BATCH_CALLS_PATH; // New variable

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

// Register CORS to allow frontend connections
fastify.register(fastifyCors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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
      transcript: session.conversationLog,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Successfully saved conversation to MongoDB (${session.conversationLog.length} messages) with ID: ${result.insertedId}`);
    console.log(`Phone number: ${session.phoneNumber}, Stream ID: ${session.streamSid}`);
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
            const agentInstructions = data.start.customParameters?.agentInstructions ? decodeURIComponent(data.start.customParameters.agentInstructions) : null;
            
            console.log(`New call stream started - SID: ${streamSid}, Phone: ${phoneNumber}, Call SID: ${callSid}, Language: ${chosenLanguage}`);
            
            // Initialize session with proper structure
            sessions.set(streamSid, {
              streamSid,
              phoneNumber,
              callSid,
              language: chosenLanguage,
              agentInstructions,
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
              callStartTime: Date.now()
            });
            
            const session = sessions.get(streamSid);
            
            // Set up a watchdog to monitor audio delta messages
            session.audioWatchdog = setInterval(() => {
              const now = Date.now();
              if (now - session.lastAudioDeltaTime > 5000) { // 5 seconds threshold
                console.log(`Audio watchdog: No audio delta received for session ${streamSid} in over 5 seconds. Sending session update.`);
                if (session.openAiWs && session.openAiWs.readyState === WebSocket.OPEN) {
                  console.log('Using agent instructions:', session.agentInstructions);
                  const systemMessage = session.agentInstructions || getSystemMessage(session.language);
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
              console.log('Using agent instructions:', session.agentInstructions);
              const systemMessage = session.agentInstructions || getSystemMessage(session.language);
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
              
              // Send initial greeting
              setTimeout(() => {
                const initialUserMessage =  "Greet the user and introduce yourself." || session.initialUserMessage ;

                const initialMessage = {
                  type: "conversation.item.create",
                  item: {
                    type: "message",
                    role: "user",
                    content: [
                      {
                        type: "input_text",
                        text: initialUserMessage
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

// Endpoint to handle call status callbacks from Twilio
fastify.all("/call-status", async (request, reply) => {
  const callSid = request.body?.CallSid || request.query?.CallSid;
  const callStatus = request.body?.CallStatus || request.query?.CallStatus;
  const phoneNumber = request.body?.To || request.query?.To || "Unknown";
  
  console.log(`Call status update: SID ${callSid}, Status: ${callStatus}, Number: ${phoneNumber}`);
  
  // Find the session for this call
  let sessionFound = false;
  for (const [sid, session] of sessions.entries()) {
    if (session.callSid === callSid) {
      session.callStatus = callStatus;
      
      // If call ended unexpectedly, make sure we clean up
      if (["completed", "failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
        console.log(`Call ${callSid} ended with status ${callStatus}. Cleaning up...`);
        
        // Calculate call duration
        session.callDuration = Math.floor((Date.now() - session.callStartTime) / 1000);
        
        // Save the conversation if it hasn't been saved yet
        if (session.conversationLog && session.conversationLog.length > 0) {
          try {
            await saveConversationToMongoDB(session);
          } catch (error) {
            console.error(`Error saving conversation for ended call ${callSid}:`, error);
          }
        }
        
        // Close OpenAI WebSocket
        if (session.openAiWs?.readyState === WebSocket.OPEN) {
          session.openAiWs.close();
        }
        
        // Clear the watchdog timer
        if (session.audioWatchdog) {
          clearInterval(session.audioWatchdog);
        }
        
        // Remove session
        sessions.delete(sid);
        activeCallCount--;
        
        // Process next call in queue
        processNextCallInQueue();
      }
      
      sessionFound = true;
      break;
    }
  }
  
  if (!sessionFound && ["in-progress", "ringing"].includes(callStatus)) {
    console.log(`No session found for call ${callSid} with status ${callStatus}`);
  }
  
  reply.send({ status: "received" });
});

// Function to process the next call in the queue
function processNextCallInQueue() {
  if (callQueue.length > 0 && activeCallCount < MAX_CONCURRENT_CALLS) {
    const nextCall = callQueue.shift();
    console.log(`Processing next call in queue to ${nextCall.phoneNumber}. Queue length: ${callQueue.length}`);
    makeOutboundCall(nextCall.phoneNumber, nextCall.language, nextCall.agentInstructions);
  }
}

// Function to make an outbound call
async function makeOutboundCall(phoneNumber, language = 'en', agentInstructions = null) {
  try {
    // Check if instructions are too long for voice calls
    if (agentInstructions && agentInstructions.length > 1000) {
      console.error(`❌ Cannot make call to ${phoneNumber}: Agent instructions too long (${agentInstructions.length} characters). Voice calls work best with under 1000 characters.`);
      return { error: 'INSTRUCTIONS_TOO_LONG', message: 'Agent instructions too long for voice calls' };
    }
    
    if (activeCallCount >= MAX_CONCURRENT_CALLS) {
      console.log(`Maximum concurrent calls (${MAX_CONCURRENT_CALLS}) reached. Queuing call to ${phoneNumber}`);
      callQueue.push({ phoneNumber, language, agentInstructions });
      return;
    }
    
    activeCallCount++;
    console.log(`Making outbound call to ${phoneNumber} in ${language}. Active calls: ${activeCallCount}`);
    
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
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
                }">Hello from WorkOnward Assistant. We will begin our conversation shortly.</Say>
                <Connect>
                  <Stream url="wss://${new URL(SERVER_URL).hostname}/media-stream">
                    <Parameter name="phoneNumber" value="${phoneNumber}"/>
                    <Parameter name="language" value="${language}"/>
                    <Parameter name="callSid" value="{{CallSid}}"/>
                    <Parameter name="agentInstructions" value="${encodeURIComponent(agentInstructions || '')}"/>
                  </Stream>
                </Connect>
              </Response>`,
      statusCallback: `${SERVER_URL}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });
    
    console.log(`Call initiated to ${phoneNumber}, Call SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error(`❌ Error making outbound call to ${phoneNumber}:`, error.message);
    console.error(`❌ Full error details:`, error);
    activeCallCount--;
    
    // Process next call in queue since this one failed
    processNextCallInQueue();
    
    return null;
  }
}

// Function to load phone numbers from CSV
function loadPhoneNumbersFromCSV(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const phoneNumbers = [];
    for (const record of records) {
      // Find the phone number field - check common column names
      const phoneField = record.phone_number || record.phoneNumber || record.phone || 
                         record.Phone || record.PhoneNumber || record.PHONE || 
                         Object.values(record)[0]; // Fallback to first column
      
      // Find language field if it exists
      const languageField = record.language || record.Language || record.LANGUAGE || 'en';
      
      if (phoneField) {
        phoneNumbers.push({
          phoneNumber: phoneField.trim(),
          language: languageField.trim().toLowerCase()
        });
      }
    }
    
    console.log(`Loaded ${phoneNumbers.length} phone numbers from CSV`);
    return phoneNumbers;
  } catch (error) {
    console.error(`Error loading phone numbers from CSV:`, error);
    return [];
  }
}

// API endpoint to initiate batch calls from CSV file OR contact data
fastify.post("/batch-calls", async (request, reply) => {
  try {
    const { filePath, contacts, policyId } = request.body;
    
    // Check if we have either filePath OR contacts
    if (!filePath && (!contacts || !Array.isArray(contacts) || contacts.length === 0)) {
      return reply.code(400).send({ error: "Missing file path or contacts data" });
    }

    // Fetch agent instructions from policy if policyId is provided
    let agentInstructions = null;
    if (policyId) {
      const db = client.db(DB_NAME);
      const collection = db.collection("agent_policies");
      const policy = await collection.findOne({ _id: new ObjectId(policyId) });
      if (!policy) {
        return reply.code(400).send({ error: "Policy not found" });
      }
      agentInstructions = policy.agentInstructions;
    }

    let phoneNumbers = [];

    // If filePath is provided, load from CSV
    if (filePath) {
      phoneNumbers = loadPhoneNumbersFromCSV(filePath);
      if (phoneNumbers.length === 0) {
        return reply.code(400).send({ error: "No valid phone numbers found in CSV" });
      }
    } 
    // If contacts are provided directly, use them
    else if (contacts) {
      phoneNumbers = contacts.map(contact => ({
        phoneNumber: contact.phoneNumber || contact.phone_number,
        language: contact.language || 'en',
        name: contact.name || ''
      }));
    }

    // Pass agentInstructions to each call session
    const initialBatch = phoneNumbers.slice(0, MAX_CONCURRENT_CALLS).map(entry => ({ ...entry, agentInstructions }));
    const remainingBatch = phoneNumbers.slice(MAX_CONCURRENT_CALLS).map(entry => ({ ...entry, agentInstructions }));

    remainingBatch.forEach(entry => {
      callQueue.push(entry);
    });

    const callPromises = initialBatch.map(entry =>
      makeOutboundCall(entry.phoneNumber, entry.language, entry.agentInstructions)
    );

    await Promise.allSettled(callPromises);

    reply.send({
      message: `Started ${initialBatch.length} calls, queued ${remainingBatch.length} calls`,
      totalCalls: phoneNumbers.length,
      activeCalls: activeCallCount,
      queuedCalls: callQueue.length
    });
  } catch (error) {
    console.error("Error processing batch calls:", error);
    reply.code(500).send({ error: "Failed to process batch calls" });
  }
});

// API endpoint to initiate calls directly from contact data (for frontend)
fastify.post("/calls/initiate", async (request, reply) => {
  try {
    const { contacts, policyId } = request.body;
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return reply.code(400).send({ error: "No contacts provided" });
    }

    // Fetch agent instructions from policy if policyId is provided
    let agentInstructions = null;
    if (policyId) {
      const db = client.db(DB_NAME);
      const collection = db.collection("agent_policies");
      const policy = await collection.findOne({ _id: new ObjectId(policyId) });
      if (!policy) {
        return reply.code(400).send({ error: "Policy not found" });
      }
      agentInstructions = policy.agentInstructions;
      
      // Check if instructions are too long
      if (agentInstructions && agentInstructions.length > 1000) {
        return reply.code(400).send({ 
          error: "Agent instructions too long for voice calls",
          details: `Instructions are ${agentInstructions.length} characters. Voice calls work best with under 1000 characters. Please shorten the policy instructions.`
        });
      }
    }

    // Convert contacts to the format expected by makeOutboundCall
    const phoneNumbers = contacts.map(contact => ({
      phoneNumber: contact.phoneNumber || contact.phone_number,
      language: contact.language || 'en',
      name: contact.name || '',
      agentInstructions
    }));

    // Pass agentInstructions to each call session
    const initialBatch = phoneNumbers.slice(0, MAX_CONCURRENT_CALLS);
    const remainingBatch = phoneNumbers.slice(MAX_CONCURRENT_CALLS);

    remainingBatch.forEach(entry => {
      callQueue.push(entry);
    });

    const callPromises = initialBatch.map(entry =>
      makeOutboundCall(entry.phoneNumber, entry.language, entry.agentInstructions)
    );

    await Promise.allSettled(callPromises);

    reply.send({
      message: `Started ${initialBatch.length} calls, queued ${remainingBatch.length} calls`,
      totalCalls: phoneNumbers.length,
      activeCalls: activeCallCount,
      queuedCalls: callQueue.length
    });
  } catch (error) {
    console.error("Error processing direct calls:", error);
    reply.code(500).send({ error: "Failed to initiate calls" });
  }
});

// Endpoint to check status of outbound calls
fastify.get("/call-status-summary", async (request, reply) => {
  reply.send({
    activeCalls: activeCallCount,
    queuedCalls: callQueue.length,
    activeSessions: Array.from(sessions.entries()).map(([sid, session]) => ({
      streamSid: sid,
      phoneNumber: session.phoneNumber,
      callSid: session.callSid,
      status: session.callStatus,
      language: session.language,
      messageCount: session.conversationLog?.length || 0,
      duration: Math.floor((Date.now() - session.callStartTime) / 1000)
    }))
  });
});

// --- Contacts API ---

// Get contacts with pagination
fastify.get("/api/contacts", async (request, reply) => {
  try {
    const page = parseInt(request.query.page || "0");
    const limit = parseInt(request.query.limit || "10");
    const skip = page * limit;

    const db = client.db(DB_NAME);
    const collection = db.collection("contacts");

    // Get total count
    const total = await collection.countDocuments();

    // Get paginated contacts
    const contacts = await collection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    reply.send({ contacts, total });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    reply.code(500).send({ error: "Failed to fetch contacts" });
  }
});

// --- Conversations API ---

// Get conversations with pagination and filtering
fastify.get("/api/conversations", async (request, reply) => {
  try {
    const page = parseInt(request.query.page || "0");
    const limit = parseInt(request.query.limit || "10");
    const search = request.query.search || "";
    const skip = page * limit;

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { phone_number: { $regex: search, $options: "i" } },
        { call_sid: { $regex: search, $options: "i" } },
        { stream_id: { $regex: search, $options: "i" } },
        { "transcript.text": { $regex: search, $options: "i" } }
      ];
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated conversations
    const conversations = await collection.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    reply.send({ conversations, total });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    reply.code(500).send({ error: "Failed to fetch conversations" });
  }
});

// Get a single conversation by ID
fastify.get("/api/conversations/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Try to find by MongoDB _id first, then by custom id
    let conversation;
    try {
      conversation = await collection.findOne({ _id: new ObjectId(id) });
    } catch (err) {
      // If ObjectId conversion fails, try by custom id field
      conversation = await collection.findOne({ id: parseInt(id) });
    }
    
    if (!conversation) {
      return reply.code(404).send({ error: "Conversation not found" });
    }
    
    reply.send(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    reply.code(500).send({ error: "Failed to fetch conversation" });
  }
});

// Get conversation statistics
fastify.get("/api/conversations/stats", async (request, reply) => {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get basic stats
    const totalConversations = await collection.countDocuments();
    const completedCalls = await collection.countDocuments({ call_status: "completed" });
    
    // Get average call duration
    const avgDurationResult = await collection.aggregate([
      { $match: { call_duration: { $exists: true, $type: "number" } } },
      { $group: { _id: null, avgDuration: { $avg: "$call_duration" } } }
    ]).toArray();
    
    const avgDuration = avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avgDuration) : 0;

    // Get recent conversations count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentConversations = await collection.countDocuments({
      timestamp: { $gte: yesterday.toISOString() }
    });

    reply.send({
      totalConversations,
      completedCalls,
      avgDuration,
      recentConversations
    });
  } catch (error) {
    console.error("Error fetching conversation stats:", error);
    reply.code(500).send({ error: "Failed to fetch conversation stats" });
  }
});

// --- Agent Policy API ---

// Create a new agent policy
fastify.post("/api/policies", async (request, reply) => {
  const { agentName, agentInstructions } = request.body;
  if (!agentName || !agentInstructions) {
    return reply.code(400).send({ error: "agentName and agentInstructions are required" });
  }
  
  if (agentInstructions.length > 1000) {
    return reply.code(400).send({ 
      error: "Agent instructions too long (1000+ characters). Please shorten for better voice call performance." 
    });
  }
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection("agent_policies");
    const result = await collection.insertOne({
      agentName,
      agentInstructions,
      createdAt: new Date().toISOString()
    });
    reply.send({ message: "Policy created", id: result.insertedId });
  } catch (error) {
    reply.code(500).send({ error: "Failed to create policy" });
  }
});

// List all agent policies
fastify.get("/api/policies", async (request, reply) => {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection("agent_policies");
    const policies = await collection.find({}).toArray();
    reply.send(policies);
  } catch (error) {
    reply.code(500).send({ error: "Failed to fetch policies" });
  }
});

// Get a single agent policy by ID
fastify.get("/api/policies/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection("agent_policies");
    const policy = await collection.findOne({ _id: new ObjectId(id) });
    if (!policy) {
      return reply.code(404).send({ error: "Policy not found" });
    }
    reply.send(policy);
  } catch (error) {
    reply.code(500).send({ error: "Failed to fetch policy" });
  }
});

// Update an agent policy by ID
fastify.put("/api/policies/:id", async (request, reply) => {
  const { id } = request.params;
  const { agentName, agentInstructions } = request.body;
  if (!agentName || !agentInstructions) {
    return reply.code(400).send({ error: "agentName and agentInstructions are required" });
  }
  
  if (agentInstructions.length > 1000) {
    return reply.code(400).send({ 
      error: "Agent instructions too long (1000+ characters). Please shorten for better voice call performance." 
    });
  }
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection("agent_policies");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          agentName, 
          agentInstructions, 
          updatedAt: new Date().toISOString() 
        } 
      }
    );
    if (result.matchedCount === 0) {
      return reply.code(404).send({ error: "Policy not found" });
    }
    reply.send({ message: "Policy updated successfully" });
  } catch (error) {
    reply.code(500).send({ error: "Failed to update policy" });
  }
});

// Delete an agent policy by ID
fastify.delete("/api/policies/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection("agent_policies");
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: "Policy not found" });
    }
    reply.send({ message: "Policy deleted successfully" });
  } catch (error) {
    reply.code(500).send({ error: "Failed to delete policy" });
  }
});

// Connect to MongoDB when the server starts
await connectToDatabase();

// Removed automatic batch calls trigger to prevent hardcoded policy ID errors


// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing server and database connections...');
  
  // Save all active conversations
  for (const [streamSid, session] of sessions.entries()) {
    if (session.conversationLog && session.conversationLog.length > 0) {
      console.log(`Saving conversation for stream ${streamSid} during shutdown...`);
      await saveConversationToMongoDB(session);
    }
    
    // Close OpenAI WebSocket
    if (session.openAiWs?.readyState === WebSocket.OPEN) {
      session.openAiWs.close();
    }
    
    // Clear watchdog timer
    if (session.audioWatchdog) {
      clearInterval(session.audioWatchdog);
    }
  }
  
  await client.close();
  console.log('MongoDB connection closed.');
  
  await fastify.close();
  console.log('Fastify server closed.');
  
  process.exit(0);
});

// Start the server
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
  console.log(`To make outbound calls, POST to ${SERVER_URL}/batch-calls with a filePath parameter`);
  console.log(`Maximum concurrent calls: ${MAX_CONCURRENT_CALLS}`);
});