/**
 * API service for communicating with FastAPI backend
 */

import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { Agent, AgentMessageResponse, AgentSession, AgentStatus, StartAgentSessionResponse } from '../types/agent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class AgentApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 300000,
        });

        // Add token to requests
        this.client.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle 401 errors
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.clearToken();
                }
                return Promise.reject(error);
            }
        );
    }

    // Token management
    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    setToken(token: string): void {
        localStorage.setItem('access_token', token);
    }

    clearToken(): void {
        localStorage.removeItem('access_token');
    }

    async listAgents(status?: AgentStatus): Promise<Agent[]> {
        const params = status ? { status } : {};
        const response = await this.client.get('/agents', { params });
        return response.data;
    }

    async getAgent(agentId: number): Promise<Agent> {
        const response = await this.client.get(`/agents/${agentId}`);
        return response.data;
    }

    // Agent Sessions
    async startAgentSession(agentId: number, conversationId?: string | null): Promise<StartAgentSessionResponse> {
        console.log(conversationId);
        const response = await this.client.post('/agents/sessions', {
            agent_id: agentId,
            conversation_id: conversationId
                ? String(conversationId)
                : undefined
        });
        return response.data;
    }

    async sendAgentMessage(sessionId: number, message: string): Promise<AgentMessageResponse> {
        const response = await this.client.post(`/agents/sessions/${sessionId}/message`, {
            session_id: sessionId,
            user_message: message,
        });
        return response.data;
    }

    async getAgentSession(sessionId: number): Promise<AgentSession> {
        const response = await this.client.get(`/agents/sessions/${sessionId}`);
        return response.data;
    }

}

export const agentApiService = new AgentApiService();