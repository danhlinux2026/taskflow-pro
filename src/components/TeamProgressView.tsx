import React, { useState } from 'react';
import { Plus, UserPlus, CheckSquare, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Employee, Task, WeekPeriod } from '../types';
import { formatViDate, PRIORITY_META, STATUS_META } from '../utils/formatters';

interface TeamProgressViewProps {
  activeWeek: WeekPeriod;
  employees: Employee[];
  tasks: Task[];
  onOpenTaskModal: (task: Task | null, defaultAssigneeId?: string) => void;
  onQuickUpdateProgress: (taskId: string, nextProgress: number) => void;
  onAddEmployee: (emp: Employee) => void;
  onNavigateToReport: () => void;
  isEmployeeView?: boolean;
}

export const TeamProgressView: React.FC<TeamProgressViewProps> = ({
  activeWeek,
  employees,
  tasks,
  onOpenTaskModal,
  onQuickUpdateProgress,
  onAddEmployee,
  onNavigateToReport,
  isEmployeeView = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Kỹ thuật');

  const weekTasks = tasks.filter((t) => t.weekId === activeWeek.id);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const words = name.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      code: `NV-0${employees.length + 1}`,
      name: name.trim(),
      role: 'Chuyên viên',
      department: department.trim() || 'Vận hành',
      email: `nhanvien${employees.length + 1}@nhipviec.vn`,
      initials,
      weeklyCapacityHours: 40,
    };

    onAddEmployee(newEmp);
    setName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar */}
      {!isEmployeeView && (
        <div className="flex items-center justify-end gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-600" />
            <span>{showAddForm ? 'Thu gọn' : '+ Thêm nhân sự'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTaskModal(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm Việc</span>
          </button>
        </div>
      )}

      {/* Streamlined Compact Add Employee Input Line */}
      {showAddForm && (
        <form
          onSubmit={handleCreateEmployee}
          className="border border-slate-200 bg-white rounded-lg p-3.5 flex flex-wrap items-center gap-2.5"
        >
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên nhân viên..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="w-36">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="Sản phẩm">Sản phẩm</option>
              <option value="Vận hành">Vận hành</option>
              <option value="Kinh doanh">Kinh doanh</option>
              <option value="Tài chính">Tài chính</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Lưu nhân sự
          </button>
        </form>
      )}

      {/* Employee List */}
      {employees.length === 0 ? (
        <div className="border border-slate-200 bg-white rounded-lg p-10 text-center space-y-2">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <UserPlus className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Chưa có nhân sự nào trong danh sách
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bấm "Thêm nhân sự" ở trên để bắt đầu giao việc và theo dõi tiến độ.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white rounded-lg overflow-hidden">
          {employees.map((emp) => {
            const empTasks = weekTasks.filter((t) => t.assigneeId === emp.id);
            const completedCount = empTasks.filter((t) => t.status === 'completed').length;
            const avgProgress =
              empTasks.length > 0
                ? Math.round(empTasks.reduce((acc, t) => acc + t.progress, 0) / empTasks.length)
                : 0;

            return (
              <div key={emp.id} className="p-4 space-y-3">
                {/* Employee Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 text-xs font-semibold text-white font-mono-tabular">
                      {emp.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{emp.name}</h3>
                        <span className="text-[11px] font-mono-tabular text-slate-400">{emp.code}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp.department} · {completedCount}/{empTasks.length} việc hoàn thành ({avgProgress}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenTaskModal(null, emp.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Giao việc</span>
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateToReport}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span>Báo cáo</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                {empTasks.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                          <th className="py-2 px-3 w-20">Mã</th>
                          <th className="py-2 px-3 min-w-[150px]">Công việc</th>
                          <th className="py-2 px-3 min-w-[150px]">Ghi chú</th>
                          <th className="py-2 px-3 w-28">Ngày nhận</th>
                          <th className="py-2 px-3 w-28">Trạng thái</th>
                          <th className="py-2 px-3 w-36 text-right">Cập nhật nhanh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {empTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-slate-50">
                            <td
                              onClick={() => onOpenTaskModal(task)}
                              className="py-2 px-3 font-mono-tabular text-slate-500 cursor-pointer"
                            >
                              {task.code}
                            </td>
                            <td
                              onClick={() => onOpenTaskModal(task)}
                              className="py-2 px-3 font-medium text-slate-900 cursor-pointer hover:text-blue-700"
                            >
                              {task.title}
                            </td>
                            <td
                              onClick={() => onOpenTaskModal(task)}
                              className="py-2 px-3 text-slate-600 max-w-[180px] cursor-pointer"
                            >
                              <div className="line-clamp-2 text-[11px]" title={task.description || task.blockerNote || ''}>
                                {task.description || task.blockerNote || null}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono-tabular text-slate-600">
                              {formatViDate(task.receivedDate || task.dueDate)}
                            </td>
                            <td className={`py-2 px-3 font-medium ${STATUS_META[task.status].textClass}`}>
                              {STATUS_META[task.status].label}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                {[0, 50, 100].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => onQuickUpdateProgress(task.id, pct)}
                                    className={`px-1.5 py-0.5 text-[11px] font-mono-tabular rounded ${
                                      task.progress === pct
                                        ? 'bg-slate-900 text-white font-semibold'
                                        : 'text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
