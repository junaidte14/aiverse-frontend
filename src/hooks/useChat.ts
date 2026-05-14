/**
 * Custom hook for managing chat state and API interactions
 * PRODUCTION-READY VERSION with race condition fixes
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { agentApiService } from '../services/agentApi';
import { useConversationStore } from '../store/useConversationStore';
import { useRagStore } from '../store/useRagStore';
import { useStore } from '../store/useStore';
import type { ChatSettings, Message } from '../types/chat';
import { useAgentStore } from '../store/useAgentStore';

export interface UseChatReturn {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    conversationId: string | null;
    sendMessage: (content: string) => Promise<void>;
    settings: ChatSettings;
    updateSettings: (settings: Partial<ChatSettings>) => void;
}

export const useChat = (): UseChatReturn => {
    const [error, setError] = useState<string | null>(null);
    const {
        settings,
        updateSettings,
        activeConversationId: conversationId,
        setActiveConversationId,
        messages,
        addMessage,
        updateMessage,
    } = useStore();
    
    // Get RAG state
    const { selectedCollection } = useRagStore();
    const isLoading = messages.some(m => m.isStreaming);
    const isMounted = useRef(true);
    
    const {
        initializeAgentSession,
        setActiveAgentSession,
    } = useAgentStore();

    const selectedAgent = useAgentStore((state) => state.selectedAgent);
    const activeAgentSession = useAgentStore((state) => state.activeAgentSession);
    const initializedAgentRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedAgent) return;
        if (initializedAgentRef.current === selectedAgent.id) {
            return; // already initialized
        }
        initializedAgentRef.current = selectedAgent.id;
        const user = useStore.getState().user;
        initializeAgentSession(selectedAgent, {
            userId: user?.id,
            model: useStore.getState().settings.model,
            setActiveConversationId,
            upsertConversation: useConversationStore.getState().upsertConversation,
            addMessage,
            setError,
        });
    }, [selectedAgent?.id, initializeAgentSession]);

    /**
     * RAG query handler (non-streaming)
     */
    const sendMessageRag = useCallback(
        async (content: string) => {
            const assistantMessage = addMessage({
                role: 'assistant',
                content: 'Searching knowledge base...',
                isStreaming: true,
            });

            try {
                const response = await apiService.ragQuery({
                    question: content,
                    collection_name: selectedCollection!,
                    conversation_id: conversationId ? conversationId : undefined,
                    provider: settings.provider,
                    model: settings.model,
                    temperature: settings.temperature,
                    max_tokens: settings.max_tokens,
                });

                updateMessage(assistantMessage.id, {
                    content: response.answer,
                    sources: response.sources,
                    isStreaming: false,
                });

                const { upsertConversation } = useConversationStore.getState();
                if (response.conversation_id) {
                    setActiveConversationId(response.conversation_id);
                    upsertConversation({
                        id: response.conversation_id,
                        title: content.slice(0, 40),
                        model_name: settings.model,
                        updated_at: new Date().toISOString(),
                    });
                }
            } catch (err: any) {
                console.error("RAG Error:", err);
                updateMessage(assistantMessage.id, {
                    content: `Error: ${err.response?.data?.detail || 'Failed to query collection'}`,
                    isStreaming: false,
                });
            }
        },
        [selectedCollection, settings, conversationId, addMessage, updateMessage, setActiveConversationId]
    );

    /**
     * Non-streaming chat handler
     */
    const sendMessageNonStream = useCallback(
        async (content: string, currentHistory: Message[]) => {
            const assistantMessage = addMessage({
                role: 'assistant',
                content: 'Thinking...',
                isStreaming: true,
            });
            
            try {
                const chatMessages = currentHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));

                const response = await apiService.multiProviderChat({
                    provider: settings.provider,
                    model: settings.model,
                    messages: chatMessages,
                    message: content,
                    conversation_id: conversationId || undefined,
                    temperature: settings.temperature,
                    max_tokens: settings.max_tokens,
                    stream: false,
                });

                updateMessage(assistantMessage.id, {
                    content: response.content,
                    isStreaming: false,
                });

                if (isMounted.current) {
                    const { upsertConversation } = useConversationStore.getState();
                    if (response.conversation_id) {
                        setActiveConversationId(response.conversation_id);
                        upsertConversation({
                            id: response.conversation_id,
                            title: content.slice(0, 40),
                            model_name: settings.model,
                            updated_at: new Date().toISOString(),
                        });
                    }
                }
            } catch (err: any) {
                console.error("Non-stream error:", err);
                updateMessage(assistantMessage.id, {
                    content: `Error: ${err.response?.data?.detail || 'Failed to send message'}`,
                    isStreaming: false,
                });
            }
        },
        [settings, conversationId, addMessage, updateMessage, setActiveConversationId]
    );

    /**
     * Streaming chat handler
     */
    const sendMessageStream = useCallback(
        async (content: string, currentHistory: Message[]) => {
            const assistantMessage = addMessage({
                role: 'assistant',
                content: '',
                isStreaming: true,
            });

            const storeUpdateMessage = useStore.getState().updateMessage;
            const storeSetActiveId = useStore.getState().setActiveConversationId;

            let fullContent = '';
            let hasSetId = false;
            let lastUpdateTime = 0;
            const THROTTLE_MS = 64;
            const isNewConversation = !conversationId;

            try {
                const stream = apiService.streamMultiProviderChat({
                    provider: settings.provider,
                    model: settings.model,
                    messages: currentHistory.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    message: content,
                    conversation_id: conversationId || undefined,
                    temperature: settings.temperature,
                    max_tokens: settings.max_tokens,
                    stream: true,
                });

                for await (const chunk of stream) {
                    if (chunk.conversation_id && !hasSetId) {
                        const newId = chunk.conversation_id.toString();
                        if (isNewConversation) {
                            storeSetActiveId(newId);
                            useConversationStore.getState().upsertConversation({
                                id: newId,
                                title: content.slice(0, 40),
                                model_name: settings.model,
                                updated_at: new Date().toISOString(),
                            });
                        }
                        hasSetId = true;
                    }

                    if (chunk.error) throw new Error(chunk.error);

                    if (chunk.content) {
                        fullContent += chunk.content;
                        const now = Date.now();
                        if (now - lastUpdateTime > THROTTLE_MS) {
                            storeUpdateMessage(assistantMessage.id, {
                                content: fullContent,
                                isStreaming: true
                            });
                            lastUpdateTime = now;
                        }
                    }
                }
            } catch (err) {
                console.error("Streaming error:", err);
                storeUpdateMessage(assistantMessage.id, {
                    content: fullContent || `Error: ${err instanceof Error ? err.message : 'Connection lost'}`,
                    isStreaming: false,
                });
            } finally {
                storeUpdateMessage(assistantMessage.id, {
                    content: fullContent,
                    isStreaming: false
                });
                // Refresh conversations to reflect new message timestamp
                useConversationStore.getState().fetchConversations();
            }
        },
        [settings, conversationId, addMessage]
    );

    /**
     * Agent message handler
     */
    const sendMessageAgent = useCallback(
        async (content: string) => {
            const currentSession = activeAgentSession;

            if (!currentSession) {
                setError("No active agent session");
                return;
            }

            const assistantMessage = addMessage({
                role: 'assistant',
                content: '...',
                isStreaming: true,
            });

            try {
                const response = await agentApiService.sendAgentMessage(
                    currentSession.id,
                    content
                );

                updateMessage(assistantMessage.id, {
                    content: response.message,
                    isStreaming: false,
                });

                if (response.current_step) {
                    useAgentStore.getState().setCurrentStep(response.current_step);
                }

                if (response.is_completed) {
                    setActiveAgentSession(null);
                    useAgentStore.getState().setSelectedAgent(null);
                    useAgentStore.getState().setCurrentStep(null);
                    
                    addMessage({
                        role: 'assistant',
                        content:
                            '✅ Workflow completed. You can now chat normally or select another agent.',
                        timestamp: new Date(),
                    });
                }
            } catch (err: any) {
                console.error("Agent error:", err);

                updateMessage(assistantMessage.id, {
                    content: `Error: ${
                        err.response?.data?.detail || 'Agent failed to respond'
                    }`,
                    isStreaming: false,
                });
            }
        },
        [activeAgentSession, addMessage, updateMessage, setError, setActiveAgentSession]
    );

    /**
     * FIXED: Main send message function with proper state management
     */
    const sendMessage = useCallback(
        async (content: string) => {
            const isCurrentlyStreaming = messages.some(m => m.isStreaming);
            if (!content.trim() || isCurrentlyStreaming) return;

            setError(null);

            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            };

            // Add user message to UI
            addMessage(userMsg);
            
            // Get current history AFTER adding the message
            // This ensures we have the most up-to-date state
            const getCurrentHistory = (): Message[] => {
                return useStore.getState().messages;
            };

            const currentSession = useAgentStore.getState().activeAgentSession;
            const currentAgent = useAgentStore.getState().selectedAgent;

            try {
                if (currentAgent && currentSession) {
                    await sendMessageAgent(content.trim());
                } else if (selectedCollection) {
                    // RAG mode
                    await sendMessageRag(content.trim());
                } else {
                    // Standard chat mode
                    const currentHistory = getCurrentHistory();
                    
                    if (settings.stream) {
                        await sendMessageStream(content.trim(), currentHistory);
                    } else {
                        await sendMessageNonStream(content.trim(), currentHistory);
                    }
                }
            } catch (err) {
                console.error("Chat Error:", err);
                setError("Failed to send message. Please try again.");
            }
        },
        [
            messages,
            settings,
            activeAgentSession,
            selectedAgent,
            selectedCollection,
            sendMessageAgent,
            sendMessageRag,
            sendMessageStream,
            sendMessageNonStream,
            addMessage,
            setError
        ]
    );

    return {
        messages,
        isLoading,
        error,
        conversationId,
        sendMessage,
        settings,
        updateSettings,
    };
};