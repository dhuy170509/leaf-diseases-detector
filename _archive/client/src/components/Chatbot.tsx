/**
 * Chatbot Widget Component - Hỏi-đáp chuyên gia AI
 * Real-time expert advice on crop management and disease control
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/chatbot.css';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    confidence?: number;
}

interface ChatbotProps {
    cropType?: string;
    diseaseDetected?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ cropType = 'tomato', diseaseDetected }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load suggestions on mount
    useEffect(() => {
        fetchSuggestions();
    }, [cropType]);

    // Scroll to bottom on new message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSuggestions = async () => {
        try {
            const res = await fetch(`/api/chatbot/suggestions?crop=${cropType}`);
            const data = await res.json();
            if (data.success) {
                setSuggestions(data.data);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const sendMessage = async (question: string) => {
        if (!question.trim()) return;

        // Add user message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: question,
            timestamp: new Date()
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chatbot/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    cropType,
                    diseaseDetected,
                    confidence: 0.8
                })
            });

            const data = await res.json();
            if (data.success && data.data.message) {
                const botMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: data.data.message,
                    timestamp: new Date(),
                    confidence: data.data.confidence
                };
                setMessages((prev) => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: '❌ Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.',
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    return (
        <div className="chatbot-widget">
            {/* Chat Button */}
            <button
                className="chat-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Mở trợ lý AI"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>🤖 Trợ lý nông nghiệp AI</h3>
                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-welcome">
                                <p className="welcome-title">👋 Xin chào!</p>
                                <p className="welcome-text">
                                    Tôi là trợ lý nông nghiệp AI. Tôi có thể giúp bạn với:
                                </p>
                                <ul className="welcome-list">
                                    <li>🌱 Cách chăm sóc cây trồng</li>
                                    <li>🔍 Chẩn đoán bệnh</li>
                                    <li>💊 Phòng chống bệnh</li>
                                    <li>☀️ Ứng phó thời tiết</li>
                                </ul>
                                <p className="welcome-hint">
                                    Bắt đầu bằng cách chọn gợi ý hoặc gõ câu hỏi của bạn
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`chat-message ${msg.type}`}>
                                    <div className="message-icon">
                                        {msg.type === 'user' ? '👨‍🌾' : '🤖'}
                                    </div>
                                    <div className="message-content">
                                        <p>{msg.content}</p>
                                        {msg.confidence !== undefined && msg.type === 'bot' && (
                                            <span className="message-confidence">
                                                Độ tin cậy: {(msg.confidence * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="chat-message bot loading-message">
                                <div className="message-icon">🤖</div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length === 0 && suggestions.length > 0 && (
                        <div className="chat-suggestions">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    className="suggestion-btn"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={loading}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <form className="chat-input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Hỏi tôi về cây của bạn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
                            {loading ? '⏳' : '📤'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
