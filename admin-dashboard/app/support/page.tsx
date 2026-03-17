'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupportTickets, addAdminLog } from '@/lib/data';
import { SupportTicket } from '@/lib/types';
import { Search, Filter, MessageSquare, Clock, CheckCircle2, AlertCircle, User, Mail, Send, MoreVertical, FilterX } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [filterStatus, setFilterStatus] = useState<SupportTicket['status'] | 'all'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: getSupportTickets,
  });

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);

  const filteredTickets = tickets?.filter(t => 
    filterStatus === 'all' ? true : t.status === filterStatus
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch(priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch(status) {
      case 'resolved': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in_progress': return <Clock size={16} className="text-blue-500" />;
      case 'open': return <AlertCircle size={16} className="text-orange-500" />;
      default: return <MessageSquare size={16} className="text-gray-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-4xl font-black text-text-primary tracking-tight">Support Center</h1>
            <p className="text-text-secondary text-lg">Central command for user inquiries and system issues.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-border shadow-sm">
             {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
               <button 
                 key={s}
                 onClick={() => setFilterStatus(s)}
                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all uppercase tracking-widest ${filterStatus === s ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:bg-background'}`}
               >
                 {s.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Ticket List */}
          <div className="w-1/3 bg-surface rounded-[2.5rem] border border-border flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-background/50">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tickets..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-semibold transition-all"
                  />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-hide">
              {isLoading ? (
                <div className="p-20 flex justify-center"><LoadingLogo label="Fetching tickets..." /></div>
              ) : filteredTickets?.length === 0 ? (
                <div className="p-20 text-center opacity-50">
                   <FilterX className="mx-auto mb-4" size={48} />
                   <p className="font-bold">No tickets found</p>
                </div>
              ) : (
                filteredTickets?.map(ticket => (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-6 cursor-pointer transition-all hover:bg-background relative ${selectedTicketId === ticket.id ? 'bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border ${getPriorityColor(ticket.priority)}`}>
                         {ticket.priority}
                       </span>
                       <span className="text-[10px] font-bold text-text-muted">
                         {new Date(ticket.created_at).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="font-bold text-text-primary mb-1 line-clamp-1">{ticket.subject}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3 leading-relaxed">{ticket.message}</p>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                            {ticket.user?.full_name?.[0]}
                         </div>
                         <span className="text-xs font-bold text-text-secondary">{ticket.user?.full_name}</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background border border-border">
                          {getStatusIcon(ticket.status)}
                          <span className="text-[10px] font-black uppercase text-text-primary">{ticket.status.replace('_', ' ')}</span>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail & Chat */}
          <div className="flex-1 bg-surface rounded-[2.5rem] border border-border flex flex-col overflow-hidden shadow-sm relative">
             {selectedTicket ? (
               <>
                 {/* Detail Header */}
                 <div className="p-8 border-b border-border flex justify-between items-start bg-background/30 backdrop-blur-md">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(selectedTicket.priority)}`}>
                            {selectedTicket.priority} Priority
                          </span>
                          <span className="text-text-muted text-sm font-semibold">ID: #{selectedTicket.id}</span>
                       </div>
                       <h2 className="text-2xl font-black text-text-primary tracking-tight">{selectedTicket.subject}</h2>
                    </div>
                    <button className="p-3 hover:bg-background rounded-2xl transition-all text-text-secondary">
                       <MoreVertical />
                    </button>
                 </div>

                 {/* Chat Area */}
                 <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-gradient-to-b from-transparent to-primary/5">
                    {/* Customer Message */}
                    <div className="flex gap-4 max-w-[85%]">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <User className="text-primary" />
                       </div>
                       <div className="space-y-2">
                          <div className="bg-white p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-border">
                             <p className="text-text-primary leading-relaxed font-medium">
                               {selectedTicket.message}
                             </p>
                          </div>
                          <span className="text-[10px] font-bold text-text-muted px-2">
                            Customer • {new Date(selectedTicket.created_at).toLocaleString()}
                          </span>
                       </div>
                    </div>

                    {/* Placeholder Admin Response if resolved */}
                    {selectedTicket.status === 'resolved' && (
                      <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse text-right">
                         <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0 border border-secondary/20">
                            <CheckCircle2 className="text-secondary" />
                         </div>
                         <div className="space-y-2">
                            <div className="bg-secondary text-white p-6 rounded-[2rem] rounded-tr-none shadow-xl">
                               <p className="leading-relaxed font-bold">
                                 We have successfully processed your request. The transaction is now verified in our system. Thank you for your patience.
                               </p>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted px-2">
                              Admin Support • {new Date(selectedTicket.updated_at).toLocaleString()}
                            </span>
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Input Area */}
                 <div className="p-8 bg-background border-t border-border">
                    <div className="relative group">
                       <textarea 
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         placeholder="Type your reply to the customer..."
                         className="w-full p-6 pb-20 bg-white border border-border rounded-[2rem] focus:ring-4 focus:ring-primary/10 outline-none font-semibold transition-all shadow-inner text-lg resize-none"
                         rows={4}
                       />
                       <div className="absolute bottom-4 right-4 flex items-center gap-3">
                          <button className="bg-text-primary text-white p-4 rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-bold shadow-xl">
                             <Send size={20} />
                             Send Response
                          </button>
                       </div>
                    </div>
                 </div>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-40">
                  <div className="w-32 h-32 bg-primary/5 rounded-[3rem] flex items-center justify-center mb-6">
                     <MessageSquare size={64} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary mb-2">Awaiting Selection</h2>
                  <p className="font-bold text-text-secondary max-w-xs">Select a ticket from the sidebar to begin assisting users.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
