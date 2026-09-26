import React, { useState } from 'react';
import { History, Search, X, PlusCircle, Edit3, Trash2, CheckCircle2, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { TaskActivityLog } from '../types';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TaskActivityLog[];
  onSelectTask?: (taskId: string) => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onSelectTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.actionType === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (actionType: TaskActivityLog['actionType']) => {
    switch (actionType) {
      case 'create':
        return {
          label: 'Thêm mới',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />,
        };
      case 'update':
        return {
          label: 'Cập nhật',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Edit3 className="h-3.5 w-3.5 text-blue-600" />,
        };
      case 'delete':
        return {
          label: 'Đã xóa',
          bg: 'bg-red-100 text-red-800 border-red-300',
          icon: <Trash2 className="h-3.5 w-3.5 text-red-600" />,
        };
      case 'status_change':
        return {
          label: 'Trạng thái',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <RefreshCw className="h-3.5 w-3.5 text-amber-600" />,
        };
      case 'progress_change':
        return {
          label: 'Tiến độ',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />,
        };
      default:
        return {
          label: 'Hoạt động',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <History className="h-3.5 w-3.5 text-slate-600" />,
        };
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="relative flex w-full max-w-2xl flex-col bg-white rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Mobile Drag Handle Bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Lịch sử hoạt động công việc
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận chi tiết mọi thao tác tạo, cập nhật & xóa công việc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã công việc, tên công việc hoặc người thực hiện..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Tất cả hành động</option>
                <option value="create">🟢 Thêm mới</option>
                <option value="update">🔵 Cập nhật</option>
                <option value="delete">🔴 Xóa việc</option>
                <option value="status_change">🟡 Trạng thái</option>
                <option value="progress_change">🟣 Tiến độ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Logs Timeline List */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">Chưa tìm thấy lịch sử hoạt động phù hợp</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.actionType);
                return (
                  <div key={log.id} className="relative pl-5 group">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-600 transition-colors" />

                    <div className="bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl p-3 space-y-1.5 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (log.actionType !== 'delete' && onSelectTask) {
                                onSelectTask(log.taskId);
                                onClose();
                              }
                            }}
                            className={`font-mono-tabular font-bold px-1.5 py-0.5 rounded ${
                              log.actionType === 'delete'
                                ? 'bg-red-50 text-red-700 line-through'
                                : 'bg-slate-200 text-slate-800 hover:bg-blue-100 hover:text-blue-700'
                            }`}
                          >
                            {log.taskCode}
                          </button>
                        </div>

                        <span className="font-mono-tabular text-slate-400 text-[10px]">
                          🕒 {formatLogTime(log.createdAt)}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 leading-snug">
                        {log.taskTitle}
                      </div>

                      <div className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                        {log.details}
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                        👤 Thực hiện bởi: <strong className="text-slate-800">{log.performedBy}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <span className="text-xs text-slate-500 font-mono-tabular">
            Tổng cộng: <strong>{filteredLogs.length}</strong> nhật ký
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
