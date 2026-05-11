import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agentApiService } from '../../services/agentApi';
import type { Agent, AgentStep, ActionConfig, AgentTemplate } from '../../types/agent';
import {
    Plus,
    Trash2,
    Save,
    ArrowRight,
    Settings,
    Zap,
    AlertCircle,
} from 'lucide-react';

export const AgentBuilder: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [agent, setAgent] = useState<Partial<Agent>>({
        name: '',
        agent_type: 'custom' as any,
        description: '',
        welcome_message: 'Hello! How can I help you today?',
        completion_message: 'Thank you! We have received your information.',
        error_message: "I'm sorry, I didn't understand. Could you try again?",
        max_retries: 3,
        config: {
            steps: [],
            actions: [],
        },
    });

    const [activeTab, setActiveTab] = useState<'steps' | 'actions' | 'settings'>('steps');
    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [showTemplates, setShowTemplates] = useState(!isEdit);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTemplates();
        if (isEdit) {
            loadAgent();
        }
    }, [id]);

    const loadTemplates = async () => {
        try {
            const data = await agentApiService.listAgentTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const loadAgent = async () => {
        if (!id) return;
        try {
            const data = await agentApiService.getAgent(parseInt(id));
            setAgent(data);
        } catch (error) {
            console.error('Failed to load agent:', error);
        }
    };

    const handleTemplateSelect = (template: AgentTemplate) => {
        setAgent({
            ...agent,
            ...template.template,
        });
        setShowTemplates(false);
    };

    const addStep = () => {
        const newStep: AgentStep = {
            id: `step_${Date.now()}`,
            name: 'new_step',
            prompt: 'Enter your prompt here',
            field: 'field_name',
            field_type: 'text',
            required: true,
            ai_extract: true,
            next_step: null,
        };

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                steps: [...(agent.config?.steps || []), newStep],
            },
        });
    };

    const updateStep = (index: number, updates: Partial<AgentStep>) => {
        const steps = [...(agent.config?.steps || [])];
        steps[index] = { ...steps[index], ...updates };

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                steps,
            },
        });
    };

    const deleteStep = (index: number) => {
        const steps = [...(agent.config?.steps || [])];
        steps.splice(index, 1);

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                steps,
            },
        });
    };

    const addAction = () => {
        const newAction: ActionConfig = {
            trigger: 'on_completion',
            type: 'send_email',
            enabled: true,
            config: {},
        };

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                actions: [...(agent.config?.actions || []), newAction],
            },
        });
    };

    const updateAction = (index: number, updates: Partial<ActionConfig>) => {
        const actions = [...(agent.config?.actions || [])];
        actions[index] = { ...actions[index], ...updates };

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                actions,
            },
        });
    };

    const deleteAction = (index: number) => {
        const actions = [...(agent.config?.actions || [])];
        actions.splice(index, 1);

        setAgent({
            ...agent,
            config: {
                ...agent.config!,
                actions,
            },
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isEdit) {
                await agentApiService.updateAgent(parseInt(id!), agent);
            } else {
                await agentApiService.createAgent(agent);
            }
            navigate('/agents');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save agent');
        } finally {
            setSaving(false);
        }
    };

    if (showTemplates) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Choose a Template</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                {template.description}
                            </p>
                            <button className="btn btn-primary w-full">
                                Use This Template
                            </button>
                        </div>
                    ))}
                    <div
                        onClick={() => setShowTemplates(false)}
                        className="card p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed"
                    >
                        <h3 className="font-bold text-lg mb-2">Start from Scratch</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Build a completely custom agent
                        </p>
                        <button className="btn bg-gray-200 hover:bg-gray-300 w-full">
                            Create Custom Agent
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? 'Edit Agent' : 'Create New Agent'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Configure your conversational agent step by step
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/agents')}
                        className="btn bg-gray-200 hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Agent'}
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Agent Name *</label>
                        <input
                            type="text"
                            value={agent.name}
                            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                            className="input"
                            placeholder="My Order Taking Agent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={agent.agent_type}
                            onChange={(e) =>
                                setAgent({ ...agent, agent_type: e.target.value as any })
                            }
                            className="input"
                        >
                            <option value="order_taking">Order Taking</option>
                            <option value="appointment_booking">Appointment Booking</option>
                            <option value="support_ticket">Support Ticket</option>
                            <option value="lead_qualification">Lead Qualification</option>
                            <option value="survey">Survey</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={agent.description}
                            onChange={(e) =>
                                setAgent({ ...agent, description: e.target.value })
                            }
                            className="input"
                            rows={2}
                            placeholder="What does this agent do?"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('steps')}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        activeTab === 'steps'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    <ArrowRight className="w-4 h-4" />
                    Steps ({agent.config?.steps?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        activeTab === 'actions'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    <Zap className="w-4 h-4" />
                    Actions ({agent.config?.actions?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        activeTab === 'settings'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
            </div>

            {/* Steps Tab */}
            {activeTab === 'steps' && (
                <div className="space-y-4">
                    {agent.config?.steps?.map((step, index) => (
                        <div key={step.id} className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold">Step {index + 1}</h3>
                                <button
                                    onClick={() => deleteStep(index)}
                                    className="p-2 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Step ID
                                    </label>
                                    <input
                                        type="text"
                                        value={step.id}
                                        onChange={(e) =>
                                            updateStep(index, { id: e.target.value })
                                        }
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Field Name
                                    </label>
                                    <input
                                        type="text"
                                        value={step.field}
                                        onChange={(e) =>
                                            updateStep(index, { field: e.target.value })
                                        }
                                        className="input"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Prompt *
                                    </label>
                                    <textarea
                                        value={step.prompt}
                                        onChange={(e) =>
                                            updateStep(index, { prompt: e.target.value })
                                        }
                                        className="input"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Field Type
                                    </label>
                                    <select
                                        value={step.field_type}
                                        onChange={(e) =>
                                            updateStep(index, {
                                                field_type: e.target.value,
                                            })
                                        }
                                        className="input"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="number">Number</option>
                                        <option value="select">Select</option>
                                        <option value="date">Date</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Next Step
                                    </label>
                                    <select
                                        value={step.next_step || ''}
                                        onChange={(e) =>
                                            updateStep(index, {
                                                next_step: e.target.value || null,
                                            })
                                        }
                                        className="input"
                                    >
                                        <option value="">-- None (Last Step) --</option>
                                        {agent.config?.steps
                                            ?.filter((s) => s.id !== step.id)
                                            .map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.id}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="col-span-2 flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={step.required}
                                            onChange={(e) =>
                                                updateStep(index, {
                                                    required: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Required</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={step.ai_extract}
                                            onChange={(e) =>
                                                updateStep(index, {
                                                    ai_extract: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">AI Extract</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button onClick={addStep} className="btn btn-primary w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Step
                    </button>
                </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
                <div className="space-y-4">
                    {agent.config?.actions?.map((action, index) => (
                        <div key={index} className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold">Action {index + 1}</h3>
                                <button
                                    onClick={() => deleteAction(index)}
                                    className="p-2 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Action Type
                                    </label>
                                    <select
                                        value={action.type}
                                        onChange={(e) =>
                                            updateAction(index, { type: e.target.value })
                                        }
                                        className="input"
                                    >
                                        <option value="send_email">Send Email</option>
                                        <option value="send_whatsapp">Send WhatsApp</option>
                                        <option value="save_to_db">Save to Database</option>
                                        <option value="save_to_sheets">
                                            Save to Google Sheets
                                        </option>
                                        <option value="webhook">Webhook</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Trigger
                                    </label>
                                    <select
                                        value={action.trigger}
                                        onChange={(e) =>
                                            updateAction(index, { trigger: e.target.value })
                                        }
                                        className="input"
                                    >
                                        <option value="on_completion">On Completion</option>
                                        <option value="on_step">On Specific Step</option>
                                        <option value="on_error">On Error</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Configuration (JSON)
                                    </label>
                                    <textarea
                                        value={JSON.stringify(action.config, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const config = JSON.parse(e.target.value);
                                                updateAction(index, { config });
                                            } catch (error) {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                        className="input font-mono text-sm"
                                        rows={6}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={action.enabled}
                                            onChange={(e) =>
                                                updateAction(index, {
                                                    enabled: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Enabled</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button onClick={addAction} className="btn btn-primary w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Action
                    </button>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="card p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Welcome Message
                        </label>
                        <textarea
                            value={agent.welcome_message}
                            onChange={(e) =>
                                setAgent({ ...agent, welcome_message: e.target.value })
                            }
                            className="input"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Completion Message
                        </label>
                        <textarea
                            value={agent.completion_message}
                            onChange={(e) =>
                                setAgent({ ...agent, completion_message: e.target.value })
                            }
                            className="input"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Error Message
                        </label>
                        <textarea
                            value={agent.error_message}
                            onChange={(e) =>
                                setAgent({ ...agent, error_message: e.target.value })
                            }
                            className="input"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Max Retries
                            </label>
                            <input
                                type="number"
                                value={agent.max_retries}
                                onChange={(e) =>
                                    setAgent({
                                        ...agent,
                                        max_retries: parseInt(e.target.value),
                                    })
                                }
                                className="input"
                                min="1"
                                max="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                value={agent.timeout_minutes}
                                onChange={(e) =>
                                    setAgent({
                                        ...agent,
                                        timeout_minutes: parseInt(e.target.value),
                                    })
                                }
                                className="input"
                                min="5"
                                max="120"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Pro Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Use AI Extract to automatically parse user responses</li>
                        <li>Connect steps sequentially using the "Next Step" dropdown</li>
                        <li>Configure actions to trigger when workflow completes</li>
                        <li>Use template variables like {'{'}
                            {'{'}customer_name{'}'} in messages</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};