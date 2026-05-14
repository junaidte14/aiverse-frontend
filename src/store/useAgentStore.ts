import { create } from 'zustand';
import { agentApiService } from '../services/agentApi';
import type { Agent, AgentSession } from '../types/agent';
import type { StartAgentSessionResponse } from '../types/agent';

interface AgentState {
    agents: Agent[];
    selectedAgent: Agent | null;
    activeAgentSession: AgentSession | null;
    currentStep: any | null;
    setCurrentStep: (step: any | null) => void;
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
    currentStep: null,
    setCurrentStep: (step) => set({ currentStep: step }),
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
            currentStep: null,
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
            currentStep: null,
            isInitializingAgentSession: false,
            activeInitializingAgentId: null,
        }),

    initializeAgentSession: async (agent, options) => {
        const {
            setActiveConversationId,
            upsertConversation,
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


            // 3. Start/Fetch Agent Session
            const response: StartAgentSessionResponse = await agentApiService.startAgentSession(
                agent.id,
                undefined
            );

            const { welcome_message, conversation_id, current_step } = response;

            // 4. PERSISTENCE: Explicitly update the Sidebar
            const newConversation = {
                id: conversation_id,
                title: `Order: ${agent.name}`,
                model_name: model || "default",
                last_message: welcome_message,
                updated_at: new Date().toISOString(),
            };

            upsertConversation?.(newConversation);

            // IMPORTANT:
            // activate newly created conversation immediately
            setActiveConversationId?.(String(conversation_id));

            // inject welcome message directly into active chat
            options?.addMessage?.({
                id: crypto.randomUUID(),
                role: "assistant",
                content: welcome_message,
                timestamp: new Date(),
                conversation_id,
            });

            set({
                activeAgentSession: response as unknown as AgentSession,
                currentStep: current_step || null,
            });

        } catch (err) {
            console.error("initializeAgentSession failed:", err);
            setError?.("Failed to initialize agent workflow");
            set({ activeAgentSession: null });
        } finally {
            set({ isInitializingAgentSession: false, activeInitializingAgentId: null });
        }
    },
}));