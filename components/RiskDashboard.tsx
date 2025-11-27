
import React, { useState, useMemo } from 'react';
import { Project, RiskLog, AppUser } from '../types';
import { format } from 'date-fns';
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { Avatar } from './Avatar';

interface RiskDashboardProps {
  projects: Project[];
  riskLogs: RiskLog[];
  users: AppUser[];
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ projects, riskLogs, users }) => {
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return riskLogs.filter(log => {
      if (projectFilter === 'all') return true;
      return log.projectId === projectFilter;
    });
  }, [riskLogs, projectFilter]);

  const getProject = (id: string) => projects.find(p => p.id === id);
  const getUser = (id?: string) => users.find(u => u.id === id);

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Red': return 'bg-red-50 text-red-700 border-red-200';
      case 'Yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Green': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'Red': return <AlertCircle size={16} className="text-red-600" />;
      case 'Yellow': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'Green': return <CheckCircle2 size={16} className="text-emerald-600" />;
      default: return <History size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <History size={24} className="mr-2 text-indigo-600" />
            Risk History Log
          </h2>
          <p className="text-sm text-slate-500 mt-1">Historical timeline of all project risk updates.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none min-w-[200px]"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800">No Risk History Found</h3>
              <p className="text-slate-500 mt-1">Start updating project statuses to populate the log.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8">
              {filteredLogs.map((log) => {
                const project = getProject(log.projectId);
                const updater = getUser(log.updatedBy);
                
                return (
                  <div key={log.id} className="relative pl-8 md:pl-10 group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                      log.riskLevel === 'Red' ? 'bg-red-500' : 
                      log.riskLevel === 'Yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}></div>

                    {/* Card */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {format(new Date(log.date), 'MMM d, yyyy • h:mm a')}
                          </span>
                          <span className="text-slate-300">•</span>
                          {updater && (
                            <div className="flex items-center space-x-1.5" title={`Updated by ${updater.name}`}>
                              <Avatar name={updater.name} className="w-5 h-5 text-[8px]" />
                              <span className="text-xs text-slate-600">{updater.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskColor(log.riskLevel)}`}>
                          <span className="mr-1.5">{getRiskIcon(log.riskLevel)}</span>
                          {log.riskLevel === 'Green' ? 'On Track' : log.riskLevel}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center mb-1">
                           <div className={`w-2 h-2 rounded-full mr-2 ${project?.color.split(' ')[0]}`}></div>
                           <h3 className="text-base font-bold text-slate-800">{project?.name || 'Unknown Project'}</h3>
                        </div>
                      </div>

                      {log.riskDescription && (
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900 block mb-1">Status Update / Risk:</span>
                          {log.riskDescription}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;
