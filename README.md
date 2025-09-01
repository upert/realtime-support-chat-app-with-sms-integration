# Starlight Support Suite - Real-Time Chat & Contact System

![Project Demo GIF](URL_TO_YOUR_PROJECT_GIF_HERE)

A full-stack web application featuring a real-time chat widget for customers and a dashboard for support agents. The system includes group-based chat routing and integrates with the Infobip API to send SMS confirmations for contact form submissions.

---

### **Features**

* **Real-Time Chat:** Instant two-way messaging between customers and agents using WebSockets (Socket.IO).
* **Agent Dashboard:** A dedicated interface for support agents to manage incoming conversations.
* **Dynamic Group Routing:** Agents can subscribe to different support queues (e.g., "General Support", "Insurance"), and new chats are routed to the correct group based on the customer's selection.
* **API Integration:** Securely connects to the Infobip API from the backend to send automated SMS confirmations.
* **Secure Credential Management:** API keys and other secrets are stored securely in a `.env` file and are not exposed to the client-side.

---

### **Tech Stack**

* **Backend:** Node.js, Express.js, Socket.IO, Axios, Dotenv
* **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
* **Third-Party Services:** Infobip SMS API

---

### **Running the Project Locally**

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/realtime-support-chat-app.git](https://github.com/your-username/realtime-support-chat-app.git)
    cd realtime-support-chat-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Infobip credentials:
    ```
    INFOBIP_API_URL=YOUR_INFOBIP_API_URL_ENDPOINT
    INFOBIP_API_KEY=YOUR_INFOBIP_API_KEY
    ```

4.  **Start the server:**
    ```bash
    node server.js
    ```
    The server will be running at `http://localhost:3000`.

5.  **Launch the frontends:**
    * Open `index.html` in your browser to use the customer chat widget.
    * Open `agent-dashboard.html` in another browser tab to use the agent dashboard.