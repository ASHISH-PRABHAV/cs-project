
const chatbotBtn = document.getElementById('chatbotBtn');
const chatbotModal = document.getElementById('chatbotModal');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.querySelector('.chatbot-messages');
const newChatBtn = document.getElementById('newChatBtn');

const OPENAI_API_KEY = "sk-abcdef1234567890abcdef1234567890abcdef12"; 

let chatHistory = [
    { 
        role: "system", 
        content: `You are a helpful LMS assistant. Provide concise, helpful answers about the learning management system.
        - Vary your response style occasionally
        - If the user repeats similar questions, acknowledge this
        - Keep responses under 3 sentences unless detailed explanation is needed
        - Be friendly and professional`
    }
];

const responseCache = new Map();

function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function isSimilarToPrevious(message) {
    if (chatHistory.length < 3) return false;
    
    const lastUserMessages = chatHistory
        .filter(m => m.role === "user")
        .slice(-3)
        .map(m => m.content.toLowerCase());
        
    return lastUserMessages.some(m => {
        const wordsA = new Set(m.split(/\s+/));
        const wordsB = new Set(message.toLowerCase().split(/\s+/));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        return intersection.size / Math.max(wordsA.size, wordsB.size) > 0.7;
    });
}

async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    chatbotInput.value = '';

    const typingElement = document.createElement('div');
    typingElement.className = 'typing-animation';
    typingElement.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingElement);

    if (isSimilarToPrevious(message)) {
        setTimeout(() => {
            chatMessages.removeChild(typingElement);
            addMessage("You've asked similar questions before. Would you like me to elaborate or clarify anything specific?", 'bot');
            chatHistory.push(
                { role: "user", content: message },
                { role: "assistant", content: "You've asked similar questions before. Would you like me to elaborate or clarify anything specific?" }
            );
        }, 1000);
        return;
    }

    if (responseCache.has(message)) {
        setTimeout(() => {
            chatMessages.removeChild(typingElement);
            const cachedResponse = responseCache.get(message);
            addMessage(cachedResponse, 'bot');
            chatHistory.push(
                { role: "user", content: message },
                { role: "assistant", content: cachedResponse }
            );
        }, 1000);
        return;
    }

    chatHistory.push({ role: "user", content: message });

    if (chatHistory.length > 10) {
        chatHistory = [
            chatHistory[0], 
            ...chatHistory.slice(-9)
        ];
    }

    try {

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: chatHistory,
                temperature: 0.8,
                frequency_penalty: 0.5,
                presence_penalty: 0.5,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        chatMessages.removeChild(typingElement);

        const botResponse = data.choices[0].message.content;
        addMessage(botResponse, 'bot');

        chatHistory.push({ role: "assistant", content: botResponse });
        
        responseCache.set(message, botResponse);

        if (responseCache.size > 50) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
        }
    } catch (error) {
        chatMessages.removeChild(typingElement);
        addMessage("Sorry, I'm having trouble answering right now. Please try again later.", 'bot');
        console.error("Chatbot error:", error);
    }
}

function resetConversation() {
    chatHistory = [
        { 
            role: "system", 
            content: `You are a helpful LMS assistant. Provide concise, helpful answers about the learning management system.
            - Vary your response style occasionally
            - If the user repeats similar questions, acknowledge this
            - Keep responses under 3 sentences unless detailed explanation is needed
            - Be friendly and professional`
        }
    ];
    chatMessages.innerHTML = '';
    addMessage("Hello! I'm your LMS assistant. How can I help you today?", 'bot');
}

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

newChatBtn.addEventListener('click', resetConversation);