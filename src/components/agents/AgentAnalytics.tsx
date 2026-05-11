import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentApiService } from '../../services/agentApi';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    AlertTriangle,
    Activity,
} from 'lucide-react';

interface AgentStats {
    total_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    completion_rate: number;
    avg_completion_time_minutes: number;
}

export const AgentAnalytics: React.FC = () => {
    const { id } = useParams();
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [id]);

    const loadStats = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await agentApiService.getAgentStats(parseInt(id));
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <p className="text-gray-600">Failed to load analytics</p>
            </div>
        );
    }

    const statusData = [
        { name: 'Completed', value: stats.completed_sessions, color: '#10b981' },
        { name: 'Abandoned', value: stats.abandoned_sessions, color: '#ef4444' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-8 h-8 text-purple-600" />
                Agent Analytics
            </h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm">Total Sessions</span>
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.total_sessions}
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm">Completed</span>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.completed_sessions}
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm">Completion Rate</span>
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.completion_rate.toFixed(1)}%
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm">Avg Time</span>
                        <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.avg_completion_time_minutes.toFixed(1)}
                        <span className="text-sm text-gray-500 ml-1">min</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Rate Pie Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Session Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }:any) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Performance Metrics */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Completion Rate</span>
                                <span className="font-semibold">
                                    {stats.completion_rate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${stats.completion_rate}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Average Speed</span>
                                <span className="font-semibold">
                                    {stats.avg_completion_time_minutes.toFixed(1)} min
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            (10 / stats.avg_completion_time_minutes) * 100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Abandonment Rate</span>
                                <span className="font-semibold">
                                    {(
                                        (stats.abandoned_sessions / stats.total_sessions) *
                                        100
                                    ).toFixed(1)}
                                    %
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${
                                            (stats.abandoned_sessions /
                                                stats.total_sessions) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
                <div className="space-y-3">
                    {stats.completion_rate < 50 && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900">
                                    Low Completion Rate
                                </p>
                                <p className="text-sm text-red-700">
                                    Consider simplifying your workflow or reducing the number
                                    of steps. High abandonment may indicate user friction.
                                </p>
                            </div>
                        </div>
                    )}

                    {stats.avg_completion_time_minutes > 15 && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-900">
                                    Long Average Time
                                </p>
                                <p className="text-sm text-yellow-700">
                                    Users are taking longer than expected. Consider breaking
                                    down complex steps or providing clearer instructions.
                                </p>
                            </div>
                        </div>
                    )}

                    {stats.completion_rate >= 70 && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-900">
                                    Great Performance!
                                </p>
                                <p className="text-sm text-green-700">
                                    Your agent is performing well with a {stats.completion_rate.toFixed(0)}%
                                    completion rate. Keep up the good work!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};