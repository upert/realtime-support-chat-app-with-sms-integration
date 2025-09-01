// server.js
require('dotenv').config();

// 1. Import necessary libraries
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const axios = require('axios'); // <-- NEW: Import axios for API requests

// 2. Initialize the server
const app = express();
app.use(cors()); 
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// --- In-memory storage ---
const supportGroups = {
  'general': { name: 'General Support', members: new Set() },
  'fido': { name: 'Fido Based', members: new Set() },
  'insurance': { name: 'Insurance', members: new Set() }
};
const connectedAgents = {}; 
const conversations = {};   

// --- API Endpoint for Contact Form ---
app.post('/api/contact', async (req, res) => { // <-- Changed to async to handle the API call
  const { name, email, phone, subject, message } = req.body;

  console.log('\n--- New Contact Form Submission ---');
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  console.log('------------------------------------\n');

  // --- NEW: Send SMS Confirmation via Infobip ---
  // Ensure a phone number was provided before trying to send an SMS
  if (phone) {
    // --- IMPORTANT: Fill in your Infobip details here ---
    const INFOBIP_API_URL = process.env.INFOBIP_API_URL;
    const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY      // Example: 'App a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
    
    const smsPayload = {
        messages: [
            {
                destinations: [{ to: phone }],
                from: "Fido Credit", // This can be your registered Sender ID
                text: `Hello ${name}, we have received your message regarding "${subject}". Our team in Accra will get back to you shortly.`
            }
        ]
    };

    try {
        console.log('Sending SMS to Infobip...');
        await axios.post(INFOBIP_API_URL, smsPayload, {
            headers: {
                'Authorization': INFOBIP_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log('✅ SMS confirmation request sent successfully.');
    } catch (error) {
        // Log any errors from the Infobip API call
        console.error('❌ Error sending Infobip SMS:', error.response ? error.response.data : error.message);
        // Note: We don't stop the process here. The user's form submission is still valid
        // even if the SMS confirmation fails.
    }
  } else {
    console.log('No phone number provided, skipping SMS confirmation.');
  }
  
  // Send a success response back to the browser
  res.status(200).json({ status: 'success', message: 'Form submission received successfully!' });
});


// --- WebSocket Logic (remains the same) ---
io.on('connection', (socket) => {
  console.log(`✅ A user connected: ${socket.id}`);

  // Event Handlers for Agent Dashboard
  socket.on('agent_connect', (data) => {
    const agentId = data.agentId || 'agent_' + socket.id;
    console.log(`🤵 Agent connected: ${agentId}`);
    connectedAgents[socket.id] = { agentId: agentId, socket: socket };
  });

  socket.on('agent_update_subscriptions', (groups) => {
    if (!connectedAgents[socket.id]) return;
    
    console.log(`Agent ${connectedAgents[socket.id].agentId} updating subscriptions to:`, groups);

    for (const groupKey in supportGroups) {
      supportGroups[groupKey].members.delete(socket.id);
    }

    if (Array.isArray(groups)) {
      groups.forEach(groupKey => {
        if (supportGroups[groupKey]) {
          supportGroups[groupKey].members.add(socket.id);
        }
      });
    }
  });

  socket.on('message_from_agent', (data) => {
    console.log(`🤵 Message from agent for ${data.conversationId}: "${data.text}"`);
    const customerSocketId = conversations[data.conversationId];
    if (customerSocketId) {
      io.to(customerSocketId).emit('new_message', {
        text: data.text,
        conversationId: data.conversationId
      });
    }
  });

  // Event Handlers for Customer Chat Widget
  socket.on('start_conversation', (data) => {
    console.log(`🚀 Conversation started: ${data.conversationId}`);
    conversations[data.conversationId] = socket.id;
  });

  socket.on('quick_reply_selected', (data) => {
    console.log(`👇 Quick reply in ${data.conversationId}:`, data);
    
    const targetGroupKey = data.value;
    const targetGroup = supportGroups[targetGroupKey];

    if (targetGroup) {
      console.log(`Routing conversation to group: ${targetGroup.name}`);
      
      targetGroup.members.forEach(agentSocketId => {
        const agent = connectedAgents[agentSocketId];
        if (agent) {
          agent.socket.emit('new_conversation_queued', {
            conversationId: data.conversationId,
            text: data.text,
            groupName: targetGroup.name
          });
        }
      });
    }

    let responseText = `Thank you. Connecting you to ${targetGroup ? targetGroup.name : 'an agent'}.`;
    socket.emit('new_message', {
        conversationId: data.conversationId,
        text: responseText
    });
  });

  socket.on('new_message', (data) => {
    if (data.sender === 'customer') {
      console.log(`💬 New message from customer in ${data.conversationId}: "${data.text}"`);
      Object.values(connectedAgents).forEach(agent => {
        agent.socket.emit('message_from_customer', {
          conversationId: data.conversationId,
          text: data.text
        });
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    if (connectedAgents[socket.id]) {
      for (const groupKey in supportGroups) {
          supportGroups[groupKey].members.delete(socket.id);
      }
      delete connectedAgents[socket.id];
      console.log('An agent was removed.');
    }
  });
});

// 4. Start the server
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is running on http://localhost:${PORT}`);
});
