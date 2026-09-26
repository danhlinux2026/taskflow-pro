import React, { useState } from 'react';
import { History, Search, PlusCircle, Edit3, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { TaskActivityLog } from '../types';

interface ActivityLogViewProps {
  logs: TaskActivityLog[];
  onSelectTask?: (taskId: string) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  onSelectTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

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
    <div className="border border-slate-200 bg-white rounded-lg p-4 sm:p-6 space-y-4 w-full shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Lịch sử hoạt động ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Nhật ký ghi nhận mọi thay đổi, cập nhật công việc và trạng thái trên hệ thống
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên, người thực hiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả hành động</option>
            <option value="create">Thêm mới</option>
            <option value="update">Cập nhật</option>
            <option value="status_change">Đổi trạng thái</option>
            <option value="progress_change">Đổi tiến độ</option>
            <option value="delete">Đã xóa</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          Không tìm thấy lịch sử hoạt động nào phù hợp.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const badge = getActionBadge(log.actionType);
            return (
              <div
                key={log.id}
                className="py-3 hover:bg-slate-50/70 rounded-md px-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 mt-0.5 ${badge.bg}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectTask && onSelectTask(log.taskId)}
                        className="font-mono-tabular font-bold text-blue-600 hover:underline shrink-0"
                      >
                        [{log.taskCode}]
                      </button>
                      <span className="font-semibold text-slate-900 truncate">
                        {log.taskTitle}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                      <span>Bởi: <strong className="text-slate-700">{log.performedBy}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono-tabular text-slate-400 shrink-0 self-start sm:self-center">
                  {formatLogTime(log.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
