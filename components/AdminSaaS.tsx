
import React, { useState, useMemo } from 'react';
import { PlanId, PlanConfig } from '../types';

interface AdminSaaSProps {
  userRole: 'user' | 'admin';
  onClose: () => void;
  currentPlan: PlanId;
  onPlanChange: (plan: PlanId) => void;
  tokens: number;
  onTokensChange: (tokens: number) => void;
  availablePlans: Record<PlanId, PlanConfig>;
  setAvailablePlans: React.Dispatch<React.SetStateAction<Record<PlanId, PlanConfig>>>;
}

interface TokenPlan {
  id: string;
  name: string;
  tokens: number;
  price: number;
  isActive: boolean;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  tokens: number;
  status: 'active' | 'suspended';
}

export const AdminSaaS: React.FC<AdminSaaSProps> = ({ 
  userRole, 
  onClose, 
  currentPlan, 
  onPlanChange, 
  tokens, 
  onTokensChange,
  availablePlans,
  setAvailablePlans
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'plans' | 'payments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [managingUser, setManagingUser] = useState<UserRecord | null>(null);

  // Simulation of other users in registry
  const userRegistry = [
    { id: 'self', name: 'Admin User (You)', email: 'admin@catalogai.com', plan: currentPlan, tokens: tokens, status: 'active' as const },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah@brand.co', plan: 'pro' as PlanId, tokens: 45, status: 'active' as const },
    { id: '3', name: 'Arjun Mehta', email: 'arjun@studio.in', plan: 'free' as PlanId, tokens: 2, status: 'suspended' as const },
  ];

  const filteredUsers = useMemo(() => {
    return userRegistry.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [userRegistry, searchTerm, tokens, currentPlan]);

  const handleUpdateSubPlanField = (id: PlanId, updates: Partial<PlanConfig>) => {
    setAvailablePlans(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleSaveSubPlan = (id: PlanId) => {
    alert(`Success: "${availablePlans[id].name}" settings persisted globally.`);
  };

  const adjustTokens = (amount: number) => {
    if (managingUser?.id === 'self') {
      onTokensChange(Math.max(0, tokens + amount));
    } else {
      alert("Demo: Token adjustment applied to remote registry.");
    }
  };

  const handlePlanOverride = (planId: PlanId) => {
    if (managingUser?.id === 'self') {
      onPlanChange(planId);
    }
    setManagingUser(prev => prev ? { ...prev, plan: planId } : null);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-50/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-700">
      <header className="bg-white border-b border-slate-200 h-24 flex shrink-0 items-center justify-between px-12 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl text-white"><span className="font-black text-lg">C</span></div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900">Admin Console</h1>
          </div>
          <nav className="flex gap-2">
            {['overview', 'users', 'plans', 'payments'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <button onClick={onClose} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest underline underline-offset-8 transition-all hover:text-indigo-800">Return to Studio</button>
      </header>

      <main className="flex-grow overflow-y-auto p-12 text-slate-900">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {[
                { label: 'Live Subscriptions', value: '142', icon: '💎' },
                { label: 'Active Renders', value: '12', icon: '⚙️' },
                { label: 'Total Revenue', value: '₹14,200', icon: '💰' },
                { label: 'System Load', value: 'Low', icon: '☁️' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <span className="text-3xl mb-4 block">{stat.icon}</span>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="relative max-w-sm">
                <input 
                  type="text" 
                  placeholder="Search accounts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600" 
                />
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 font-black uppercase text-slate-400">User</th>
                      <th className="px-6 py-5 font-black uppercase text-slate-400">Plan</th>
                      <th className="px-6 py-5 font-black uppercase text-slate-400">Tokens</th>
                      <th className="px-8 py-5 font-black uppercase text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                        </td>
                        <td className="px-6 py-5"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase text-[10px]">{user.plan}</span></td>
                        <td className="px-6 py-5 font-bold">{user.id === 'self' ? tokens : user.tokens}</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => setManagingUser(user as UserRecord)} className="font-black text-indigo-600 uppercase">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
              {(Object.entries(availablePlans) as [PlanId, PlanConfig][]).map(([id, plan]) => (
                <div key={id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 space-y-6 flex-grow">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">{plan.name} Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Price (₹)</label>
                        <input type="number" value={plan.price} onChange={(e) => handleUpdateSubPlanField(id, { price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-50 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Tokens</label>
                        <input type="number" value={plan.tokens} onChange={(e) => handleUpdateSubPlanField(id, { tokens: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-50 rounded-xl font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/20">
                    <button onClick={() => handleSaveSubPlan(id)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Sync Plan Globally</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {managingUser && (
        <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <div><h3 className="text-xl font-black text-slate-900">{managingUser.name}</h3><p className="text-[10px] font-black text-indigo-600 uppercase">Registry Control</p></div>
              <button onClick={() => setManagingUser(null)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>
            <div className="p-10 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Override Subscription</label>
                <div className="flex flex-col gap-2">
                  {Object.keys(availablePlans).map(planId => (
                    <button key={planId} onClick={() => handlePlanOverride(planId as PlanId)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase text-left transition-all ${managingUser.plan === planId ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>{planId} Plan</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Token Allocation</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => adjustTokens(-10)} className="py-3 bg-slate-50 rounded-xl font-black text-rose-500">-10 Tokens</button>
                  <button onClick={() => adjustTokens(10)} className="py-3 bg-slate-50 rounded-xl font-black text-emerald-600">+10 Tokens</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
