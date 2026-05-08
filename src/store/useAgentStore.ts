import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import type { Agent } from '../types/agent';

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    isLoading: boolean;

    // Actions
    fetchAgents: () => Promise<void>;
    setSelectedAgent: (agent: Agent | null) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    selectedAgent: null,
    isLoading: false,

    fetchAgents: async () => {
        set({ isLoading: true });
        try {
            const data = await agentApiService.listAgents();
            //console.log(data);
            const currentSelected = get().selectedAgent;
            set({
                agents: data,
                selectedAgent: (currentSelected && data.includes(currentSelected)) 
                    ? currentSelected 
                    : (data.length > 0 ? data[0] : null)
            });
        } catch (error) {
            console.error('Failed to load collections:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedAgent: (agent: Agent | null) => set({ selectedAgent: agent }),
}));