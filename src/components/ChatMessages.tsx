/**
 * Container for chat messages with auto-scroll
 */

import { BadgeDollarSign, CalendarCheck2, LifeBuoy, ShoppingCart } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { ChatMessage } from './ChatMessage';

interface ChatMessagesProps {
    messages: Message[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar"
        >
            {messages.length === 0 ? (
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-5 animate-fade-in">
                        <h2 className="text-3xl font-bold mb-2">
                            Welcome to iVersana
                        </h2>

                        <p className="max-w-2xl mx-auto text-sm text-gray-500 leading-relaxed">
                            Your all-in-one AI workspace for intelligent conversations,
                            specialized RAG knowledge collections, and production-ready AI agents.
                            Start a regular AI chat, interact with custom knowledge bases,
                            or automate workflows using advanced AI-powered agents.
                        </p>

                        {/* Mode Pills */}
                        <div className="flex flex-wrap justify-center gap-2 mt-5">
                            <div className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold border border-primary-100">
                                Regular AI Chat
                            </div>

                            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">
                                RAG Collections
                            </div>

                            <div className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold border border-violet-100">
                                AI Workflow Agents
                            </div>
                        </div>
                    </div>

                    {/* Agent Feature Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

                        {[
                            {
                                icon: <ShoppingCart className="w-5 h-5" />,
                                title: "Order Taking Agent",
                                desc: "Automate customer orders with intelligent step-by-step AI conversations and structured data collection.",
                                color: "group-hover:bg-orange-500"
                            },

                            {
                                icon: <CalendarCheck2 className="w-5 h-5" />,
                                title: "Appointment Booking",
                                desc: "Schedule appointments seamlessly with AI-powered booking flows, confirmations, and reminders.",
                                color: "group-hover:bg-blue-500"
                            },

                            {
                                icon: <LifeBuoy className="w-5 h-5" />,
                                title: "Support Ticket Agent",
                                desc: "Create smart support workflows with issue categorization, prioritization, and automated responses.",
                                color: "group-hover:bg-emerald-500"
                            },

                            {
                                icon: <BadgeDollarSign className="w-5 h-5" />,
                                title: "Lead Qualification",
                                desc: "Capture and qualify leads automatically through intelligent conversational AI workflows.",
                                color: "group-hover:bg-violet-500"
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="
                                    group
                                    flex
                                    flex-col
                                    items-center
                                    p-5
                                    bg-white
                                    border
                                    border-gray-100
                                    rounded-2xl
                                    shadow-sm
                                    hover:shadow-lg
                                    hover:-translate-y-1
                                    transition-all
                                    duration-300
                                "
                            >
                                <div
                                    className={`
                                        p-3
                                        rounded-xl
                                        bg-gray-50
                                        text-primary-500
                                        transition-all
                                        duration-300
                                        mb-4
                                        ${feature.color}
                                        group-hover:text-white
                                    `}
                                >
                                    {feature.icon}
                                </div>

                                <h3 className="text-sm font-semibold text-gray-900 text-center">
                                    {feature.title}
                                </h3>

                                <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-7 text-center">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-semibold animate-pulse">
                            Choose a mode below to begin your AI experience
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};