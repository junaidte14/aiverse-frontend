/**
 * Custom hook for managing chat state and API interactions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { agentApiService } from '../services/agentApi';
import { useConversationStore } from '../store/useConversationStore';
import { useRagStore } from '../store/useRagStore';
import { useStore } from '../store/useStore';
import type { ChatSettings, Message } from '../types/chat';
import type { AgentSession } from '../types/agent';
import { useAgentStore } from '../store/useAgentStore';

export interface UseChatReturn {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    conversationId: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearMessages: () => void;
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
        setMessages,
        addMessage,
        updateMessage,
    } = useStore();
    // Get RAG state
    const { selectedCollection } = useRagStore();
    const isLoading = messages.some(m => m.isStreaming);
    const isMounted = useRef(true);
    const { selectedAgent } = useAgentStore();
    const [agentSession, setAgentSession] = useState<AgentSession | null>(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, [setMessages]);

    /**
     * NEW: Specialized handler for RAG queries
     * This follows the non-streaming pattern established in your RAGChat.tsx
     */
    const sendMessageRag = useCallback(
        async (content: string) => {
            const assistantMessage = addMessage({
                role: 'assistant',
                content: 'Searching knowledge base...',
                isStreaming: true, // Show loading state
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
                    sources: response.sources, // Ensure your types support this
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
        [selectedCollection, settings, conversationId, addMessage, updateMessage]
    );

    const sendMessageNonStream = useCallback(
        async (content: string, currentHistory: Message[]) => {
            const assistantMessage = addMessage({
                role: 'assistant',
                content: 'Loading...',
                isStreaming: true, // Show loading state
            });
            try {
                // Prepare messages for the backend (role and content only)
                const chatMessages = currentHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    isStreaming: true,
                }));

                const response = await apiService.multiProviderChat({
                    provider: settings.provider,
                    model: settings.model,
                    messages: chatMessages, // Required List[ChatMessage]
                    message: content, // Included for backward compatibility
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
                    addMessage({
                        role: 'assistant',
                        content: response.content
                    });
                }
            } catch (err) {
                throw err;
            }
        },
        [settings, conversationId, addMessage, setActiveConversationId]
    );

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
            const isNewConversation = !conversationId; // capture before stream starts

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

    const startAgentSession = useCallback(async () => {
        if (!selectedAgent || !conversationId) return;

        try {
            const session = await agentApiService.startAgentSession(
                selectedAgent.id,
                conversationId ?? undefined
            );
            console.log(session);
            setAgentSession(session);

            if (selectedAgent.welcome_message) {
                addMessage({
                    role: 'assistant',
                    content: selectedAgent.welcome_message,
                    timestamp: new Date(),
                });
            }
        } catch (error) {
            console.error('Failed to start agent session:', error);
            setError('Could not initialize agent session.');
        }
    }, [selectedAgent, conversationId, addMessage]);

    useEffect(() => {
        if (selectedAgent && !agentSession) {
            startAgentSession();
        }
        
        // Cleanup session if agent is deselected
        if (!selectedAgent && agentSession) {
            setAgentSession(null);
        }
    }, [selectedAgent, agentSession, startAgentSession]);

    const sendMessageAgent = useCallback(async (content: string, overrideSession?: AgentSession) => {
        // Use the override if provided, otherwise fallback to state
        const currentSession = overrideSession || agentSession;
        if (!currentSession) return;

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

            if (response.is_completed) {
                setAgentSession(null);
                // Optionally clear selected agent here if you want to return to regular chat
                // setSelectedAgent(null); 
                addMessage({
                    role: 'assistant',
                    content: '✅ Workflow completed.',
                    timestamp: new Date(),
                });
            }
        } catch (err: any) {
            updateMessage(assistantMessage.id, {
                content: `Error: ${err.response?.data?.detail || 'Agent failed to respond'}`,
                isStreaming: false,
            });
        }
    }, [agentSession, addMessage, updateMessage]);

    const sendMessage = useCallback(
        async (content: string) => {
            const isStreaming = messages.some(m => m.isStreaming);
            if (!content.trim() || isStreaming) return;

            setError(null);

            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            };

            // 1. Update UI first
            addMessage(userMsg);
            const updatedHistory = [...messages, userMsg];

            // 2. Trigger API call OUTSIDE of setMessages
            try {
                if (selectedAgent) {
                    let activeSession = agentSession;
                    // Emergency check: if state hasn't caught up, try to start it inline
                    if (!activeSession) {
                        try {
                            activeSession = await agentApiService.startAgentSession(
                                selectedAgent.id,
                                conversationId ?? undefined
                            );
                            setAgentSession(activeSession);
                        } catch (sessionErr) {
                            throw new Error("Failed to initialize Agent workflow.");
                        }
                    }
                    // Explicitly call agent logic
                    await sendMessageAgent(content.trim(), activeSession);
                } else if (selectedCollection) {
                    await sendMessageRag(content.trim());
                } else if (settings.stream) {
                    await sendMessageNonStream(content.trim(), updatedHistory);
                } else {
                    await sendMessageNonStream(content.trim(), updatedHistory);
                }
            } catch (err) {
                console.error("Chat Error:", err);
                setError("Failed to send message");
            } finally {
            }
        },
        [messages, settings, agentSession, 
        selectedAgent, sendMessageAgent, sendMessageRag, sendMessageStream, sendMessageNonStream, isLoading]
    );

    return {
        messages,
        isLoading,
        error,
        conversationId,
        sendMessage,
        clearMessages,
        settings,
        updateSettings,
    };
};