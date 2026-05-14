export enum AgentType {
    ORDER_TAKING = 'order_taking',
    APPOINTMENT_BOOKING = 'appointment_booking',
    SUPPORT_TICKET = 'support_ticket',
    LEAD_QUALIFICATION = 'lead_qualification',
    SURVEY = 'survey',
    CUSTOM = 'custom',
}

export enum AgentStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DRAFT = 'draft',
}

export enum SessionStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    FAILED = 'failed',
}

export interface StepValidation {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
    options?: string[];
    custom?: Record<string, any>;
}

export interface AgentStep {
    id: string;
    name: string;
    prompt: string;
    field: string;
    field_type: string;
    required: boolean;
    validation?: StepValidation;
    next_step?: string | null;
    conditional_next?: Record<string, string>;
    ai_extract: boolean;
}

export interface ActionConfig {
    trigger: string;
    trigger_step?: string;
    type: string;
    config: Record<string, any>;
    enabled: boolean;
}

export interface AgentConfig {
    steps: AgentStep[];
    actions: ActionConfig[];
    settings?: Record<string, any>;
}

export interface Agent {
    id: number;
    name: string;
    agent_type: AgentType;
    description?: string;
    status: AgentStatus;
    config: AgentConfig;
    welcome_message?: string;
    completion_message: string;
    error_message: string;
    max_retries: number;
    timeout_minutes: number;
    enable_fallback_human: boolean;
    user_id: number;
    created_at: string;
    updated_at: string;
    total_sessions: number;
    completed_sessions: number;
    completion_rate: number;
}

export interface AgentSession {
    id: number;
    agent_id: number;
    conversation_id?: string | null;
    status: SessionStatus;
    current_step?: string;
    collected_data: Record<string, any>;
    retry_count: number;
    started_at: string;
    completed_at?: string;
    welcome_message?: string;
    first_prompt?: string;
}

export interface AgentMessageRequest {
    session_id: number;
    user_message: string;
    agent_id?: number;
}

export interface AgentMessageResponse {
    message: string;
    current_step?: AgentStep;
    step_prompt?: string | null;
    is_completed: boolean;
    collected_data?: Record<string, any> | null;
    next_action?: 'continue' | 'completed' | 'failed' | null;
    retry?: boolean;
    failed?: boolean;
    progress?: {
        total_steps: number;
        completed_steps: number;
        progress_percentage: number;
    } | null;
}

export interface StartSessionResponse {
    session: AgentSession;
    welcome_message?: string;
    first_prompt?: string;
    current_step?: string;
    progress?: any;
    is_completed: boolean;
}

export interface StartAgentSessionResponse {
    id: number;
    session: AgentSession;
    conversation_id?: number;
    welcome_message?: string;
    first_prompt?: string;
    current_step?: AgentStep;
    progress?: any;
    is_completed: boolean;
}

export interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    template: Partial<Agent>;
}