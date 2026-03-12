'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReports, updateReport } from '@/lib/data';
import { Report, ReportStatus, ReportReason } from '@/lib/types';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Flag } from 'lucide-react';
import { useState } from 'react';

async function fetchReports(status?: ReportStatus | 'all'): Promise<Report[]> {
  let reports = await getReports();

  // Filter by status
  if (status && status !== 'all') {
    reports = reports.filter((r) => r.status === status);
  }

  // Sort by created_at descending
  return reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function ReportsPage() {
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('pending');
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['reports', selectedStatus],
    queryFn: () => fetchReports(selectedStatus),
  });

  const resolveReport = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      await updateReport(id, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        resolved_by: 'admin_1', // Current admin ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const dismissReport = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      await updateReport(id, {
        status: 'dismissed',
        resolved_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        resolved_by: 'admin_1', // Current admin ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const getReasonBadge = (reason: ReportReason) => {
    const badges = {
      scam: 'bg-red-100 text-red-700',
      incorrect_info: 'bg-yellow-100 text-yellow-700',
      inappropriate_content: 'bg-orange-100 text-orange-700',
      spam: 'bg-gray-100 text-gray-700',
      other: 'bg-blue-100 text-blue-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[reason]}`}>
        {reason.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Reports & Complaints</h1>
          <p className="text-text-secondary">Review and resolve user reports</p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | 'all')}
              className="px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-border">
              <LoadingLogo label="Loading reports..." />
            </div>
          ) : reports && reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-surface rounded-2xl p-6 shadow-sm border border-border"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Flag className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {report.target_type === 'property'
                            ? `Reported Property: ${report.target_property?.title || 'Unknown'}`
                            : `Reported User: ${report.target_user?.full_name || 'Unknown'}`}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Reported by: {report.reporter?.full_name || 'Anonymous'} ({report.reporter?.email || 'No email'})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {getReasonBadge(report.reason)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-text-secondary mb-3 bg-background p-3 rounded-xl">
                        {report.description}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">
                      Reported: {new Date(report.created_at).toLocaleString()}
                      {report.resolved_at && (
                        <span className="ml-4">
                          Resolved: {new Date(report.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </p>
                    {report.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-800">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const notes = prompt('Add admin notes (optional):');
                          resolveReport.mutate({ id: report.id, adminNotes: notes || undefined });
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add admin notes (optional):');
                          dismissReport.mutate({ id: report.id, adminNotes: notes || undefined });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-border">
              <Flag size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary">No reports found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
