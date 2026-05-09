import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import { apiService } from '../services/api';
import type { Agent, AgentSession } from '../types/agent';
import type { StartAgentSessionResponse } from '../types/agent';

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

        // prevent duplicate init
        if (
            get().isInitializingAgentSession ||
            get().activeAgentSession ||
            get().activeInitializingAgentId === agent.id
        ) {
            return;
        }

        set({
            isInitializingAgentSession: true,
            activeInitializingAgentId: agent.id,
        });

        try {
            if (!userId) throw new Error("User not found");

            // 1. Create conversation
            const conversation = await apiService.createNewConversation(
                agent.name,
                model || "default",
                userId
            );

            const conversationId = conversation.id;
            setActiveConversationId?.(conversationId);

            upsertConversation?.({
                id: conversationId,
                title: conversation.title,
                model_name: conversation.model_name,
                updated_at: conversation.updated_at,
            });

            // 2. Start agent session (API RESPONSE TYPE HERE ONLY)
            const response: StartAgentSessionResponse =
                await agentApiService.startAgentSession(
                    agent.id,
                    conversationId
                );

            const { session, initial_response } = response;

            set({
                activeAgentSession: session, // ✅ FIXED (was session.id WRONG in your version)
            });

            if (initial_response?.message) {
                addMessage?.({
                    role: "assistant",
                    content: initial_response.message,
                    timestamp: new Date(),
                    meta: { sessionId: session.id, step: initial_response.current_step }
                });
            }

        } catch (err) {
            console.error("initializeAgentSession failed:", err);

            setError?.("Failed to initialize agent workflow");

            set({
                activeAgentSession: null,
            });

        } finally {
            set({
                isInitializingAgentSession: false,
                activeInitializingAgentId: null,
            });
        }
    },
}));