// frontend/src/components/agents/AgentSelector.tsx
import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore'; //
import { type Agent } from '../../types/agent';
import { Bot, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AgentSelectorProps {
    onSelect: (agent: Agent | null) => void;
    selectedAgent: Agent | null;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ onSelect, selectedAgent }) => {
    const { agents, fetchAgents } = useAgentStore(); //
    const [showDropdown, setShowDropdown] = useState(false);

    const handleSelect = (agent: Agent | null) => {
        setShowDropdown(false);

        // pass selection upward (existing system handles session)
        onSelect(agent);

        // show welcome message immediately in UI layer
        if (agent?.welcome_message) {
            // we inject a temporary assistant message via parent state (chat store)
            const addMessage = useStore.getState().addMessage;

            addMessage({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: agent.welcome_message,
                timestamp: new Date(),
            });
        }
    };

    useEffect(() => {
        if (agents.length === 0) fetchAgents(); //
    }, [agents.length, fetchAgents]);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                    selectedAgent 
                        ? 'bg-purple-50 border-purple-200 text-purple-700' 
                        : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400'
                }`}
            >
                <Bot className={`w-3.5 h-3.5 ${selectedAgent ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="max-w-[120px] truncate">
                    {selectedAgent ? selectedAgent.name : 'Select Agent'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 py-1 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Agents</span>
                        </div>
                        
                        <button
                            onClick={() => handleSelect(null)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center justify-between"
                        >
                            <span>Standard Chat</span>
                            {!selectedAgent && <Check className="w-3.5 h-3.5 text-purple-600" />}
                        </button>

                        <div className="max-h-60 overflow-y-auto">
                            {agents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleSelect(agent)}
                                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                                        selectedAgent?.id === agent.id ? 'bg-purple-50' : ''
                                    }`}
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">{agent.name}</span>
                                        <span className="text-[10px] text-gray-500 truncate">{agent.description}</span>
                                    </div>
                                    {selectedAgent?.id === agent.id && <Check className="w-3.5 h-3.5 text-purple-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};