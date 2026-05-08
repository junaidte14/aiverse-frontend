import React, { useEffect, useState } from 'react';
import { agentApiService } from '../../services/agentApi';
import {type Agent, AgentStatus, AgentType } from '../../types/agent';
import {
    Bot,
    Plus,
    Edit,
    Trash2,
    Play,
    Pause,
    TrendingUp,
    Users,
    CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AgentList: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<AgentStatus | 'all'>('all');
    const navigate = useNavigate();

    useEffect(() => {
        loadAgents();
    }, [filter]);

    const loadAgents = async () => {
        setLoading(true);
        try {
            const data = await agentApiService.listAgents(
                filter !== 'all' ? filter : undefined
            );
            setAgents(data);
        } catch (error) {
            console.error('Failed to load agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (agentId: number) => {
        if (!confirm('Delete this agent? All sessions will be lost.')) return;

        try {
            await agentApiService.deleteAgent(agentId);
            loadAgents();
        } catch (error) {
            console.error('Failed to delete agent:', error);
        }
    };

    const handleStatusToggle = async (agent: Agent) => {
        try {
            const newStatus =
                agent.status === AgentStatus.ACTIVE
                    ? AgentStatus.INACTIVE
                    : AgentStatus.ACTIVE;

            await agentApiService.updateAgent(agent.id, { status: newStatus });
            loadAgents();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const getAgentTypeLabel = (type: AgentType) => {
        const labels = {
            [AgentType.ORDER_TAKING]: 'Order Taking',
            [AgentType.APPOINTMENT_BOOKING]: 'Appointments',
            [AgentType.SUPPORT_TICKET]: 'Support',
            [AgentType.LEAD_QUALIFICATION]: 'Lead Qual',
            [AgentType.SURVEY]: 'Survey',
            [AgentType.CUSTOM]: 'Custom',
        };
        return labels[type] || type;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bot className="w-8 h-8 text-purple-600" />
                        Conversational Agents
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Create AI agents that handle conversations step by step
                    </p>
                </div>
                <button
                    onClick={() => navigate('/agents/create')}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Agent
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', AgentStatus.ACTIVE, AgentStatus.INACTIVE, AgentStatus.DRAFT].map(
                    (status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === status
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'all' ? 'All Agents' : status.replace('_', ' ')}
                        </button>
                    )
                )}
            </div>

            {/* Agents Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No agents yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Create your first conversational agent to automate workflows
                    </p>
                    <button
                        onClick={() => navigate('/agents/create')}
                        className="btn btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Your First Agent
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="card p-6 hover:shadow-lg transition-shadow"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-3 rounded-lg ${
                                            agent.status === AgentStatus.ACTIVE
                                                ? 'bg-green-100'
                                                : 'bg-gray-100'
                                        }`}
                                    >
                                        <Bot
                                            className={`w-6 h-6 ${
                                                agent.status === AgentStatus.ACTIVE
                                                    ? 'text-green-600'
                                                    : 'text-gray-600'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {agent.name}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {getAgentTypeLabel(agent.agent_type)}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                        agent.status === AgentStatus.ACTIVE
                                            ? 'bg-green-100 text-green-800'
                                            : agent.status === AgentStatus.INACTIVE
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {agent.status}
                                </span>
                            </div>

                            {/* Description */}
                            {agent.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {agent.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                                        <Users className="w-3 h-3" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {agent.total_sessions}
                                    </div>
                                    <div className="text-xs text-gray-500">Sessions</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                                        <CheckCircle className="w-3 h-3" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {agent.completed_sessions}
                                    </div>
                                    <div className="text-xs text-gray-500">Completed</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {agent.completion_rate.toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500">Rate</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleStatusToggle(agent)}
                                    className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center justify-center gap-1"
                                    title={
                                        agent.status === AgentStatus.ACTIVE
                                            ? 'Deactivate'
                                            : 'Activate'
                                    }
                                >
                                    {agent.status === AgentStatus.ACTIVE ? (
                                        <>
                                            <Pause className="w-4 h-4" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            Activate
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => navigate(`/agents/${agent.id}/edit`)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(agent.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};