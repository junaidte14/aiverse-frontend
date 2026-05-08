import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import { apiService } from '../services/api';
import type { Agent, AgentSession } from '../types/agent';

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    activeAgentSession: AgentSession | null;
    isLoading: boolean;

    // GLOBAL LOCKS
    isInitializingAgentSession: boolean;
    activeInitializingAgentId: number | null;

    // Actions
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

    // LOCK STATE
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
                        ? data.find(
                              a => a.id === currentSelected.id
                          ) || null
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
            activeAgentSession: null,
        }),

    setActiveAgentSession: (session: AgentSession | null) =>
        set({
            activeAgentSession: session,
        }),

    setInitializingAgentSession: (value: boolean) =>
        set({
            isInitializingAgentSession: value,
        }),

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

        // 🛑 ATOMIC GUARD (prevents race condition)
        const canStart = get().isInitializingAgentSession;

        if (
            canStart ||
            get().activeAgentSession ||
            get().activeInitializingAgentId === agent.id
        ) {
            return;
        }

        // 🔒 LOCK START (atomic update)
        set(state => {
            if (
                state.isInitializingAgentSession ||
                state.activeAgentSession
            ) {
                return state;
            }

            return {
                isInitializingAgentSession: true,
                activeInitializingAgentId: agent.id,
            };
        });

        try {
            if (!userId) {
                throw new Error("User not found");
            }

            // 🔁 STALE CHECK
            if (get().activeInitializingAgentId !== agent.id) return;

            // 1. Create conversation
            const conversation =
                await apiService.createNewConversation(
                    agent.name,
                    model || "default",
                    userId
                );

            if (get().activeInitializingAgentId !== agent.id) return;

            const conversationId = String(conversation.id);

            setActiveConversationId?.(conversationId);

            upsertConversation?.({
                id: conversationId,
                title: conversation.title,
                model_name: conversation.model_name,
                updated_at: conversation.updated_at,
            });

            // 2. Start agent session
            const session =
                await agentApiService.startAgentSession(
                    agent.id,
                    conversationId
                );

            if (get().activeInitializingAgentId !== agent.id) return;

            set({
                activeAgentSession: session,
            });

            // 3. Initial message
            const initialMessage =
                session.welcome_message && session.first_prompt
                    ? `${session.welcome_message}\n\n${session.first_prompt}`
                    : session.welcome_message || session.first_prompt;

            if (initialMessage) {
                addMessage?.({
                    role: "assistant",
                    content: initialMessage,
                    timestamp: new Date(),
                });
            }

        } catch (err) {
            console.error("initializeAgentSession failed:", err);

            setError?.("Failed to initialize agent workflow");

            set({
                activeAgentSession: null,
            });

        } finally {
            // 🔓 CLEAN UNLOCK (safe reset)
            set(state => {
                if (state.activeInitializingAgentId === agent.id) {
                    return {
                        isInitializingAgentSession: false,
                        activeInitializingAgentId: null,
                    };
                }
                return state;
            });
        }
    },
}));