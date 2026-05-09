import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import { apiService } from '../services/api';
import type { Agent, AgentSession } from '../types/agent';
import type { StartAgentSessionResponse } from '../types/agent';
import { useStore } from './useStore';

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    activeAgentSession: AgentSession | null;
    isLoading: boolean;

    isInitializingAgentSession: boolean;
    activeInitializingAgentId: number | null;

    fetchAgents: () => Promise<void>;
    setSelectedAgent: (agent: Agent | null) => void;
    setActiveAgentSession: (session: AgentSession | null) => void;

    setInitializingAgentSession: (value: boolean) => void;
    resetAgentState: () => void;

    initializeAgentSession: (
        agent: Agent,
        options?: {
            userId?: number;
            model?: string;
            setActiveConversationId?: (id: string) => void;
            upsertConversation?: (c: any) => void;
            addMessage?: (m: any) => void;
            setError?: (msg: string | null) => void;
        }
    ) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    selectedAgent: null,
    activeAgentSession: null,
    isLoading: false,

    isInitializingAgentSession: false,
    activeInitializingAgentId: null,

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

    setSelectedAgent: (agent) =>
        set({
            selectedAgent: agent,
            activeAgentSession: null,
        }),

    setActiveAgentSession: (session) =>
        set({
            activeAgentSession: session,
        }),

    setInitializingAgentSession: (value) =>
        set({ isInitializingAgentSession: value }),

    resetAgentState: () =>
        set({
            selectedAgent: null,
            activeAgentSession: null,
            isInitializingAgentSession: false,
            activeInitializingAgentId: null,
        }),

    initializeAgentSession: async (agent, options) => {
        const {
            setActiveConversationId,
            upsertConversation,
            addMessage,
            setError,
            model,
            userId,
        } = options || {};

        // 1. IMPROVED GUARD: Check if this specific agent session is already active
        const currentSession = get().activeAgentSession;
        if (currentSession && currentSession.agent_id === agent.id) {
            return; 
        }

        set({ isInitializingAgentSession: true, activeInitializingAgentId: agent.id });

        try {
            if (!userId) throw new Error("User not found");

            // 2. CONTEXT CHECK: Should we reuse the current conversation?
            // We get the current active ID from the store
            let conversationId = useStore.getState().activeConversationId;
            let isNewConversation = false;

            // If no conversation exists, OR if the current conversation isn't the one we want, create it
            if (!conversationId) {
                const conversation = await apiService.createNewConversation(
                    `Order for ${agent.name}`,
                    model || "default",
                    userId
                );
                console.log(conversation);
                conversationId = conversation.id;
                isNewConversation = true;
            }

            // 3. Start/Fetch Agent Session
            const response: StartAgentSessionResponse = await agentApiService.startAgentSession(
                agent.id,
                conversationId ?? undefined
            );

            const { welcome_message } = response;

            // 4. PERSISTENCE: Explicitly update the Sidebar
            // We call upsertConversation with the latest data to ensure the sidebar reflects it
            upsertConversation?.({
                id: conversationId,
                title: `Order: ${agent.name}`,
                model_name: model || "default",
                last_message: welcome_message, // Preview for sidebar
                updated_at: new Date().toISOString(), // Forces the sort to the top
            });

            console.log(conversationId);
            // Set state
            if(conversationId){
                setActiveConversationId?.(conversationId);
            }
            set({ activeAgentSession: response as unknown as AgentSession });

            // 5. Only add messages if it's a fresh initialization for this conversation
            if (welcome_message) {
                addMessage?.({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: welcome_message,
                    timestamp: new Date(),
                });
            }

        } catch (err) {
            console.error("initializeAgentSession failed:", err);
            setError?.("Failed to initialize agent workflow");
            set({ activeAgentSession: null });
        } finally {
            set({ isInitializingAgentSession: false, activeInitializingAgentId: null });
        }
    },
}));