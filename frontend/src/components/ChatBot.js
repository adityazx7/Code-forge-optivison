'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const API_BASE = 'http://localhost:8000';

const QUICK_PROMPTS = [
    '📊 Explain the current volatility surface',
    '🔍 What are the unusual activity zones?',
    '📈 Identify volatility skews in the data',
    '🎯 Where is the max pain for nearest expiry?',
    '🐂 Is the market bullish or bearish right now?',
];

export default function ChatBot() {
    const { token, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm OptiVision AI Assistant, powered by Llama 3. I can analyze market data, explain volatility surfaces, identify unusual patterns, and provide strategy insights. What would you like to know?",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage(text) {
        if (!text.trim() || loading || !token) return;

        const userMessage = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Try streaming first
            const res = await fetch(`${API_BASE}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: userMessage }),
            });

            if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';

                setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.token) {
                                    fullResponse += data.token;
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = {
                                            role: 'assistant',
                                            content: fullResponse,
                                        };
                                        return updated;
                                    });
                                }
                                if (data.done) break;
                            } catch { }
                        }
                    }
                }
            } else {
                // Fallback to non-streaming
                const data = await res.json();
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.response || 'Sorry, I could not process that request.',
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Failed to connect to AI service. Make sure the backend is running.',
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Floating Bubble */}
            <button
                className={`chat-bubble ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                id="chat-bubble"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                {!isOpen && <span className="chat-bubble-label">AI Chat</span>}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <Sparkles size={18} />
                            <div>
                                <h3>OptiVision AI</h3>
                                <span>Powered by Llama 3 · RAG</span>
                            </div>
                        </div>
                        <button className="chat-close" onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-message ${msg.role}`}>
                                <div className="chat-message-content">
                                    {msg.content || (loading && i === messages.length - 1 ? (
                                        <span className="typing-indicator">
                                            <span />
                                            <span />
                                            <span />
                                        </span>
                                    ) : '')}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length <= 1 && (
                        <div className="chat-quick-prompts">
                            {QUICK_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    className="quick-prompt"
                                    onClick={() => sendMessage(prompt)}
                                    disabled={loading}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="chat-input-area">
                        <input
                            id="chat-input"
                            type="text"
                            placeholder="Ask about market data..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            className="chat-send"
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
