// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';

// Define the message type
interface Message {
    type: 'user' | 'bot' | 'error';
    text: string;
}

function App() {
    const [userInput, setUserInput] = useState<string>('');
    const [chatLog, setChatLog] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Effect to load chat history from local storage when the app starts
    useEffect(() => {
        const storedChatLog = localStorage.getItem('chatLog');
        if (storedChatLog) {
            setChatLog(JSON.parse(storedChatLog));
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!userInput.trim()) return;

        const userMessage: Message = { type: 'user', text: userInput };
        const newChatLog = [...chatLog, userMessage];
        setChatLog(newChatLog);
        setUserInput('');
        setLoading(true);

        try {
            // Build full conversation history
            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                ...chatLog.map(msg => ({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.text
                })),
                { role: "user", content: userInput }
            ];
        
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botMessage: Message = { type: 'bot', text: data.bot_response };

            const finalChatLog = [...newChatLog, botMessage];
            setChatLog(finalChatLog);
            localStorage.setItem('chatLog', JSON.stringify(finalChatLog));

        } catch (error) {
            console.error('Error fetching chat response:', error);
            const errorMessage: Message = { type: 'error', text: 'Sorry, something went wrong. Please try again.' };
            setChatLog(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <h1>AI Chatbot</h1>
            <button 
                onClick={() => {
                    setChatLog([]);
                    localStorage.removeItem('chatLog');
                }}
                style={{ marginBottom: '20px' }}
            >
                Clear Chat
            </button>
            <div className="chat-window">
                {chatLog.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        {message.text}
                    </div>
                ))}
                {loading && <div className="message bot">Loading...</div>}
            </div>
            <form onSubmit={handleSubmit} className="chat-form">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>Send</button>
            </form>
        </div>
    );
}

export default App;