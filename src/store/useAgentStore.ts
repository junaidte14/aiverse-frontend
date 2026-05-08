import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import type { Agent, AgentSession } from '../types/agent';

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    activeAgentSession: AgentSession | null;
    isLoading: boolean;

    // Actions
    fetchAgents: () => Promise<void>;
    setSelectedAgent: (agent: Agent | null) => void;
    setActiveAgentSession: (session: AgentSession | null) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    selectedAgent: null,
    activeAgentSession: null,
    isLoading: false,

    fetchAgents: async () => {
        set({ isLoading: true });

        try {
            const data = await agentApiService.listAgents();

            const currentSelected = get().selectedAgent;

            set({
                agents: data,

                selectedAgent:
                    currentSelected &&
                    data.some(a => a.id === currentSelected.id)
                        ? data.find(a => a.id === currentSelected.id) || null
                        : null,
            });

        } catch (error) {
            console.error('Failed to load agents:', error);

        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedAgent: (agent: Agent | null) =>
        set({
            selectedAgent: agent,

            // IMPORTANT:
            // reset active workflow when changing agents
            activeAgentSession: null,
        }),

    setActiveAgentSession: (session: AgentSession | null) =>
        set({
            activeAgentSession: session,
        }),
}));