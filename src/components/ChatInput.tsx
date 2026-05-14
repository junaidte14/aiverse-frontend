/**
 * Chat input component with send button
 */

import { Bot, Check, ChevronUp, Cpu, Database, Plus, Send } from 'lucide-react';
import React, { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRagStore } from '../store/useRagStore';
import { useStore } from '../store/useStore';
import { ProviderSelector } from './ProviderSelector';
import { useAgentStore } from '../store/useAgentStore';
import { AgentSelectInput } from './agents/AgentSelectInput';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    disabled = false,
    placeholder = 'Type your message...'
}) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const { settings, updateSettings } = useStore();
    const [showRagPicker, setShowRagPicker] = useState(false);
    const { collections, selectedCollection, setSelectedCollection, fetchCollections } = useRagStore();
    const { selectedAgent, setSelectedAgent } = useAgentStore();
    const agents = useAgentStore((state) => state.agents);
    const fetchAgents = useAgentStore((state) => state.fetchAgents);

    const currentStep = useAgentStore((state) => state.currentStep);
    const activeAgentSession = useAgentStore((state) => state.activeAgentSession);
    const isSelectField = currentStep?.field_type === 'select';
    const selectOptions = currentStep?.validation?.options || [];

    const handleSelectOption = (option: string) => {
        // When user selects an option, send it as a message
        onSend(option);
    };

    useEffect(() => {
        if (agents.length === 0) {
            fetchAgents();
        }
    }, [agents.length, fetchAgents]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; // Set a maximum height of 200px
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="px-4 bg-gradient-to-t from-background via-background to-transparent">
            <div className="border rounded-xl bg-card shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* Show SELECT options when active agent has SELECT field */}
                {activeAgentSession && isSelectField && selectOptions.length > 0 ? (
                    <AgentSelectInput
                        options={selectOptions}
                        onSelect={handleSelectOption}
                        disabled={disabled}
                    />
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        rows={1}
                        className="w-full p-4 bg-transparent resize-none outline-none border-none custom-scrollbar overflow-y-auto"
                    />
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/30">

                    <div className="flex items-center gap-1 relative">
                        {/* Main Unified Dropdown Trigger */}
                        <button
                            onClick={() => {
                                if (collections.length === 0) {
                                    fetchCollections();
                                }

                                setShowRagPicker(!showRagPicker);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-500 transition-all"
                        >
                            <Plus className={`w-4 h-4 transition-transform ${showRagPicker ? 'rotate-45' : ''}`} />

                            <span className="max-w-[120px] truncate">
                                {selectedAgent
                                    ? selectedAgent.name
                                    : selectedCollection
                                        ? selectedCollection
                                        : 'Workspace'}
                            </span>
                        </button>

                        {/* Unified Dropdown */}
                        {showRagPicker && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowRagPicker(false)}
                                />

                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95">

                                    {/* STANDARD CHAT */}
                                    <button
                                        onClick={() => {
                                            setSelectedCollection(null);
                                            setSelectedAgent(null);
                                            setShowRagPicker(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors`}
                                    >
                                        <span>Standard Chat</span>

                                        {!selectedCollection && !selectedAgent && (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-800" />

                                    {/* RAG SECTION */}
                                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        RAG Collections
                                    </div>

                                    <div className="max-h-40 overflow-y-auto">
                                        {collections.map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => {
                                                    setSelectedCollection(name);
                                                    setSelectedAgent(null);
                                                    setShowRagPicker(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Database className="w-4 h-4 shrink-0" />

                                                    <span className="truncate">
                                                        {name}
                                                    </span>
                                                </div>

                                                {selectedCollection === name && (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-800 mt-1" />

                                    {/* AGENTS SECTION */}
                                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Agents
                                    </div>

                                    <div className="max-h-48 overflow-y-auto">
                                        {agents.map((agent:any) => (
                                            <button
                                                key={agent.id}
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setSelectedCollection(null);
                                                    setShowRagPicker(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors`}
                                            >
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <Bot className="w-4 h-4 mt-0.5 shrink-0" />

                                                    <div className="flex flex-col min-w-0 text-left">
                                                        <span className="truncate font-medium">
                                                            {agent.name}
                                                        </span>

                                                        {agent.description && (
                                                            <span className="text-[10px] opacity-70 truncate">
                                                                {agent.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {selectedAgent?.id === agent.id && (
                                                    <Check className="w-4 h-4 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-xs mt-1">
                        Press Enter to send, Shift + Enter for new line
                    </div>

                    {/* Right Side: Model Selector & Send */}
                    <div className="flex items-center gap-3">
                        {/* Model Dropdown (Simplified implementation) */}
                        <div className="relative group">
                            {/* Model Selector Popover */}
                            {showModelPicker && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                                    <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 mb-3 text-gray-500">
                                            <Cpu className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Switch Model</span>
                                        </div>
                                        <ProviderSelector
                                            variant="list"
                                            selectedProvider={settings.provider}
                                            selectedModel={settings.model}
                                            onProviderChange={(p) => updateSettings({ provider: p })}
                                            onModelChange={(m) => {
                                                updateSettings({ model: m });
                                                setShowModelPicker(false); // Close menu after selection
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => setShowModelPicker(!showModelPicker)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-500 transition-all"
                            >
                                <Cpu className="w-3.5 h-3.5 text-primary-500" />
                                <span className="max-w-[100px] truncate">{settings.model}</span>
                                <ChevronUp className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Minimal Send Icon */}
                        <button
                            onClick={handleSend}
                            disabled={disabled || !input.trim()}
                            className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            <Send className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};