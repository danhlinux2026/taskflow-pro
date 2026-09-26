import React from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink, PartyPopper } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationPopoverProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onSelectTask: (taskId: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px]" onClick={onClose} />

      {/* Popover Card */}
      <div className="fixed top-14 right-2 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-semibold">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Thông báo hoàn thành</h3>
              <p className="text-[11px] text-slate-500">Cập nhật tiến độ việc từ Nhân viên</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Đánh dấu tất cả là đã đọc"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đọc tất cả</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <PartyPopper className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-600">Chưa có thông báo mới nào</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Khi Nhân viên báo hoàn thành công việc (100%), thông báo sẽ lập tức xuất hiện ở đây.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group relative p-3.5 transition-colors ${
                  !n.read ? 'bg-blue-50/60 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => {
                      if (!n.read) onMarkAsRead(n.id);
                      onSelectTask(n.taskId);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-tabular font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        🎉 HOÀN THÀNH
                      </span>
                      <span className="text-[11px] font-mono-tabular font-semibold text-slate-500">
                        {n.taskCode}
                      </span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />}
                    </div>

                    <div className="text-xs font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      <span>{n.taskTitle}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <p className="text-[11px] text-slate-600">
                      👤 <strong className="font-semibold text-slate-800">{n.completedByEmployeeName}</strong> vừa hoàn thành công việc này.
                    </p>

                    <span className="block text-[10px] font-mono-tabular text-slate-400 pt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(n.id)}
                        title="Đánh dấu đã đọc"
                        className="rounded p-1 text-slate-400 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteNotification(n.id)}
                      title="Xóa thông báo"
                      className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500">
            Tự động cập nhật thời gian thực khi nhân viên hoàn thành công việc
          </div>
        )}
      </div>
    </>
  );
};
