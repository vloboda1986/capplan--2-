import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addWeeks, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval, eachWeekOfInterval } from 'date-fns';
import { Developer, DeveloperPlan, Team, Project, AbsenceType } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Users, Briefcase, BarChart2, TrendingUp } from 'lucide-react';
import { Avatar } from './Avatar';
import { WORK_HOURS_TARGET, DAYS_OF_WEEK } from '../constants';

interface UtilizationStatsProps {
    developers: Developer[];
    plans: DeveloperPlan[];
    teams: Team[];
    projects: Project[];
    onBack: () => void;
}

type ViewMode = 'weekly' | 'monthly';
type ChartMode = 'monthly' | 'weekly';
type TeamType = 'internal' | 'freelancer';

const UtilizationStats: React.FC<UtilizationStatsProps> = ({
    developers,
    plans,
    teams,
    projects,
    onBack
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('weekly');
    const [chartMode, setChartMode] = useState<ChartMode>('monthly');
    const [chartTeamType, setChartTeamType] = useState<TeamType>('internal');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Date Range Logic for Table
    const dateRange = useMemo(() => {
        if (viewMode === 'weekly') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const days = Array.from({ length: 5 }).map((_, i) => addDays(start, i));
            return { start, end: days[4], days, label: `${format(start, 'MMM d')} - ${format(days[4], 'MMM d, yyyy')}` };
        } else {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const days = eachDayOfInterval({ start, end }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
            return { start, end, days, label: format(currentDate, 'MMMM yyyy') };
        }
    }, [viewMode, currentDate]);

    // Chart Data Calculation
    const chartData = useMemo(() => {
        const targetDevs = developers.filter(d =>
            chartTeamType === 'internal' ? d.type !== 'Freelancer' : d.type === 'Freelancer'
        );

        if (chartMode === 'monthly') {
            // Show last 12 months
            const yearStart = startOfYear(currentDate);
            const yearEnd = endOfYear(currentDate);
            const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

            return months.map(monthStart => {
                const monthEnd = endOfMonth(monthStart);
                const workdays = eachDayOfInterval({ start: monthStart, end: monthEnd })
                    .filter(d => d.getDay() !== 0 && d.getDay() !== 6);

                let totalCapacity = 0;
                let totalBooked = 0;

                targetDevs.forEach(dev => {
                    const plan = plans.find(p => p.developerId === dev.id);
                    const dailyCap = dev.capacity || WORK_HOURS_TARGET;

                    workdays.forEach(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const absence = plan?.absences[dateStr];

                        if (!absence || absence === AbsenceType.None) {
                            totalCapacity += dailyCap;
                            const booked = plan?.projects.reduce((sum, proj) => sum + (proj.allocations[dateStr] || 0), 0) || 0;
                            totalBooked += booked;
                        }
                    });
                });

                return {
                    label: format(monthStart, 'MMM'),
                    fullLabel: format(monthStart, 'MMMM yyyy'),
                    capacity: totalCapacity,
                    booked: totalBooked,
                    utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
                };
            });
        } else {
            // Show all weeks in current month
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

            return weeks.map((weekStart, index) => {
                const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i))
                    .filter(d => d >= monthStart && d <= monthEnd);

                let totalCapacity = 0;
                let totalBooked = 0;

                targetDevs.forEach(dev => {
                    const plan = plans.find(p => p.developerId === dev.id);
                    const dailyCap = dev.capacity || WORK_HOURS_TARGET;

                    weekDays.forEach(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const absence = plan?.absences[dateStr];

                        if (!absence || absence === AbsenceType.None) {
                            totalCapacity += dailyCap;
                            const booked = plan?.projects.reduce((sum, proj) => sum + (proj.allocations[dateStr] || 0), 0) || 0;
                            totalBooked += booked;
                        }
                    });
                });

                return {
                    label: `W${index + 1}`,
                    fullLabel: `Week ${index + 1} (${format(weekStart, 'MMM d')})`,
                    capacity: totalCapacity,
                    booked: totalBooked,
                    utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
                };
            });
        }
    }, [chartMode, chartTeamType, currentDate, developers, plans]);

    const handlePrev = () => {
        setCurrentDate(prev => viewMode === 'weekly' ? addWeeks(prev, -1) : addWeeks(prev, -4));
    };

    const handleNext = () => {
        setCurrentDate(prev => viewMode === 'weekly' ? addWeeks(prev, 1) : addWeeks(prev, 4));
    };

    // Stats Calculation for Tables
    const calculateStats = (devs: Developer[]) => {
        return devs.map(dev => {
            const plan = plans.find(p => p.developerId === dev.id);
            const dailyCap = dev.capacity || WORK_HOURS_TARGET;

            let totalCapacity = 0;
            let totalBooked = 0;
            let absenceHours = 0;

            dateRange.days.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');

                const absence = plan?.absences[dateStr];
                if (absence && absence !== AbsenceType.None) {
                    absenceHours += dailyCap;
                } else {
                    totalCapacity += dailyCap;
                    const booked = plan?.projects.reduce((sum, proj) => sum + (proj.allocations[dateStr] || 0), 0) || 0;
                    totalBooked += booked;
                }
            });

            const utilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

            return {
                dev,
                totalCapacity,
                totalBooked,
                absenceHours,
                utilization
            };
        }).sort((a, b) => b.utilization - a.utilization);
    };

    const internalDevs = developers.filter(d => d.type !== 'Freelancer');
    const freelancers = developers.filter(d => d.type === 'Freelancer');

    const internalStats = useMemo(() => calculateStats(internalDevs), [internalDevs, plans, dateRange]);
    const freelancerStats = useMemo(() => calculateStats(freelancers), [freelancers, plans, dateRange]);

    const renderTable = (stats: ReturnType<typeof calculateStats>, title: string, icon: React.ReactNode, colorClass: string) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className={`px-6 py-4 border-b border-slate-100 ${colorClass} flex justify-between items-center`}>
                <h3 className="font-bold text-slate-800 flex items-center text-lg">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h3>
                <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full text-slate-700">
                    {stats.length} People
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4 text-center">Capacity</th>
                            <th className="px-6 py-4 text-center">Booked</th>
                            <th className="px-6 py-4 text-center">Utilization</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No data available for this group.
                                </td>
                            </tr>
                        ) : (
                            stats.map(item => {
                                const team = teams.find(t => t.id === item.dev.teamId);
                                let statusColor = 'bg-slate-100 text-slate-600';
                                let statusText = 'Optimal';

                                if (item.utilization > 100) {
                                    statusColor = 'bg-red-100 text-red-700';
                                    statusText = 'Overloaded';
                                } else if (item.utilization < 70 && item.totalCapacity > 0) {
                                    statusColor = 'bg-yellow-100 text-yellow-700';
                                    statusText = 'Underutilized';
                                } else if (item.totalCapacity === 0) {
                                    statusColor = 'bg-purple-100 text-purple-700';
                                    statusText = 'On Leave';
                                } else {
                                    statusColor = 'bg-green-100 text-green-700';
                                    statusText = 'Optimal';
                                }

                                return (
                                    <tr key={item.dev.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <Avatar name={item.dev.name} className="w-9 h-9 text-xs" />
                                                <div>
                                                    <div className="font-medium text-slate-900">{item.dev.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center space-x-1">
                                                        {team && (
                                                            <span className={`px-1.5 rounded-sm ${team.color.split(' ')[0]} bg-opacity-30`}>
                                                                {team.name}
                                                            </span>
                                                        )}
                                                        <span>• {item.dev.role}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                                            {item.totalCapacity}h
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-800">
                                            {item.totalBooked}h
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <div className="w-24 bg-slate-200 rounded-full h-2.5 mr-2 overflow-hidden">
                                                    <div
                                                        className={`h-2.5 rounded-full ${item.utilization > 100 ? 'bg-red-500' : item.utilization < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{item.utilization}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const maxCapacity = Math.max(...chartData.map(d => d.capacity), 1);

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Utilization Statistics</h2>
                        <p className="text-sm text-slate-500">Detailed workload analysis</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* View Toggle */}
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('weekly')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                    </div>

                    {/* Date Nav */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-50 rounded text-slate-500">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-4 font-medium text-slate-700 min-w-[180px] text-center flex items-center justify-center">
                            <Calendar size={14} className="mr-2 text-slate-400" />
                            {dateRange.label}
                        </div>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 rounded text-slate-500">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Visual Infographics Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Utilization Overview</h3>
                                <p className="text-xs text-slate-500">Visual capacity analysis</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Chart Mode Toggle */}
                            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                                <button
                                    onClick={() => setChartMode('monthly')}
                                    className={`px-3 py-1.5 rounded-md transition-all ${chartMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setChartMode('weekly')}
                                    className={`px-3 py-1.5 rounded-md transition-all ${chartMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Weekly
                                </button>
                            </div>

                            {/* Team Type Toggle */}
                            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                                <button
                                    onClick={() => setChartTeamType('internal')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${chartTeamType === 'internal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Users size={12} />
                                    <span>Internal</span>
                                </button>
                                <button
                                    onClick={() => setChartTeamType('freelancer')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${chartTeamType === 'freelancer' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Briefcase size={12} />
                                    <span>Freelancers</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="space-y-4">
                        <div className="flex items-end justify-between space-x-2 h-64 border-b border-slate-200 pb-4">
                            {chartData.map((item, index) => {
                                const maxHeight = 230;
                                const barHeight = maxCapacity > 0 ? (item.capacity / maxCapacity) * maxHeight : 0;
                                const filledHeight = item.capacity > 0 ? (item.booked / item.capacity) * barHeight : 0;

                                let barColor = 'bg-green-500';
                                if (item.utilization > 100) barColor = 'bg-red-500';
                                else if (item.utilization < 70) barColor = 'bg-yellow-500';

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        {/* Bar */}
                                        <div
                                            className="w-full bg-slate-100 rounded-t-lg relative border border-slate-200"
                                            style={{ height: `${barHeight}px`, minHeight: '20px' }}
                                            title={item.fullLabel}
                                        >
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 ${barColor} transition-all rounded-t-lg`}
                                                style={{ height: `${Math.min(filledHeight, barHeight)}px` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Labels Row */}
                        <div className="flex items-start justify-between space-x-2">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex-1 text-center">
                                    <div className="text-xs font-bold text-slate-700 mb-1">{item.label}</div>
                                    <div className="text-[10px] text-slate-500">
                                        <div>{item.capacity}h cap</div>
                                        <div className="font-semibold text-slate-700">{item.booked}h used</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tables */}
                {renderTable(internalStats, "Internal Team", <Users size={20} className="text-indigo-600" />, "bg-indigo-50/50")}
                {renderTable(freelancerStats, "Freelancers", <Briefcase size={20} className="text-amber-600" />, "bg-amber-50/50")}
            </div>
        </div>
    );
};

export default UtilizationStats;
