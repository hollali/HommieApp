'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSupportTickets } from '@/lib/data';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'support';
  timestamp: Date;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // Poll for new support tickets to simulate real-time notifications
  const { data: tickets } = useQuery({
    queryKey: ['support-tickets-notifications'],
    queryFn: getSupportTickets,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  useEffect(() => {
    if (!tickets) return;

    // Check for tickets created in the last 60 seconds (or status 'open' and fresh)
    const criticalTickets = tickets.filter(t => 
      t.status === 'open' && 
      t.priority === 'critical' &&
      new Date(t.created_at).getTime() > Date.now() - 60000
    );

    if (criticalTickets.length > 0) {
      const ticket = criticalTickets[0];
      const newNotif: Notification = {
        id: `support_${ticket.id}`,
        title: 'Critical Support Ticket',
        message: `${ticket.user?.full_name}: ${ticket.subject}`,
        type: 'support',
        timestamp: new Date(),
      };

      // Only show if it's new
      if (!notifications.find(n => n.id === newNotif.id)) {
        setNotifications(prev => [newNotif, ...prev]);
        setLatestNotification(newNotif);
        setShowToast(true);
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => setShowToast(false), 5000);
      }
    }
  }, [tickets, notifications]);

  const getIcon = (type: Notification['type']) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="text-orange-500" />;
      case 'success': return <CheckCircle className="text-green-500" />;
      case 'support': return <MessageSquare className="text-primary" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  return (
    <>
      {/* Real-time Toast */}
      {showToast && latestNotification && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right fade-in duration-300">
           <div className="bg-surface border-2 border-primary/20 shadow-2xl rounded-[2rem] p-6 w-[400px] flex gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="p-3 bg-primary/10 rounded-2xl h-fit">
                 {getIcon(latestNotification.type)}
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-text-primary tracking-tight">{latestNotification.title}</h4>
                    <button onClick={() => setShowToast(false)} className="text-text-muted hover:text-text-primary">
                       <X size={16} />
                    </button>
                 </div>
                 <p className="text-sm text-text-secondary font-medium leading-normal mb-3">
                    {latestNotification.message}
                 </p>
                 <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                    Take Action Now
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
