// Chatbot functionality - OpenAI version
const chatbotBtn = document.getElementById('chatbotBtn');
const chatbotModal = document.getElementById('chatbotModal');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.querySelector('.chatbot-messages');

// OpenAI API Key
const OPENAI_API_KEY = "sk-abcdef1234567890abcdef1234567890abcdef12"; // Your OpenAI API key

// Chat history
let chatHistory = [
    { role: "system", content: "You are a helpful LMS assistant. Provide concise and helpful answers about the learning management system." }
];

// Chatbot UI functions
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatbotInput.value = '';

    // Show typing indicator
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-animation';
    typingElement.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingElement);

    // Add user message to history
    chatHistory.push({ role: "user", content: message });

    try {
        // Get response from OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: chatHistory,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove typing indicator
        chatMessages.removeChild(typingElement);
        
        // Add bot response
        const botResponse = data.choices[0].message.content;
        addMessage(botResponse, 'bot');
        
        // Update chat history
        chatHistory.push({ role: "assistant", content: botResponse });
    } catch (error) {
        chatMessages.removeChild(typingElement);
        addMessage("Sorry, I'm having trouble answering right now. Please try again later.", 'bot');
        console.error("Chatbot error:", error);
    }
}

// Event listeners
chatbotBtn.addEventListener('click', () => {
    chatbotModal.style.display = 'flex';
    if (chatMessages.children.length === 0) {
        addMessage("Hello! I'm your LMS assistant. How can I help you today?", 'bot');
    }
});

closeChatbot.addEventListener('click', () => {
    chatbotModal.style.display = 'none';
});

sendMessageBtn.addEventListener('click', sendMessage);
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});