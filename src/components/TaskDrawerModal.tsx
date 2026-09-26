import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Employee, Subtask, Task, TaskPriority, TaskStatus, WeekPeriod } from '../types';
import { getNowTimestampVi } from '../utils/formatters';
import { TaskLocationPicker } from './TaskLocationPicker';

interface TaskDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: Task | null;
  employees: Employee[];
  weeks: WeekPeriod[];
  activeWeekId: string;
  defaultAssigneeId?: string;
  onSaveTask: (task: Task, isNew: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  nextTaskNumber: number;
  isEmployeeView?: boolean;
}

export const TaskDrawerModal: React.FC<TaskDrawerModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  employees,
  weeks,
  activeWeekId,
  defaultAssigneeId,
  onSaveTask,
  onDeleteTask,
  nextTaskNumber,
  isEmployeeView = false,
}) => {
  const isNew = !taskToEdit;

  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(employees[0]?.id || '');
  const [receivedDate, setReceivedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [progress, setProgress] = useState(0);
  const [price, setPrice] = useState<number | ''>(0);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  // Advanced / Optional Fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('Công việc chung');
  const [weekId, setWeekId] = useState(activeWeekId);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [loggedHours, setLoggedHours] = useState(0);
  const [blockerNote, setBlockerNote] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDelete(false);
    setErrorMsg('');

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    const dateStr = defaultDate.toISOString().split('T')[0];

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setAssigneeId(taskToEdit.assigneeId || '');
      setProject(taskToEdit.project);
      setWeekId(taskToEdit.weekId);
      setReceivedDate(taskToEdit.receivedDate || todayStr);
      setDueDate(taskToEdit.dueDate);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setProgress(taskToEdit.progress);
      setEstimatedHours(taskToEdit.estimatedHours);
      setLoggedHours(taskToEdit.loggedHours);
      setPrice(taskToEdit.price || 0);
      setAddress(taskToEdit.address || '');
      setLat(taskToEdit.lat);
      setLng(taskToEdit.lng);
      setBlockerNote(taskToEdit.blockerNote || '');
      setSubtasks(taskToEdit.subtasks.map((s) => ({ ...s })));
      setShowAdvanced(
        Boolean(taskToEdit.description || taskToEdit.blockerNote || taskToEdit.subtasks.length > 0)
      );
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(defaultAssigneeId || employees[0]?.id || '');
      setProject('Công việc chung');
      setWeekId(activeWeekId);
      setReceivedDate(todayStr);
      setDueDate(dateStr);
      setStatus('todo');
      setPriority('medium');
      setProgress(0);
      setEstimatedHours(8);
      setLoggedHours(0);
      setPrice(0);
      setAddress('');
      setLat(undefined);
      setLng(undefined);
      setBlockerNote('');
      setSubtasks([]);
      setShowAdvanced(false);
    }
  }, [isOpen, taskToEdit, activeWeekId, defaultAssigneeId, employees]);

  if (!isOpen) return null;

  const handleStatusSelect = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgress(100);
    } else if (newStatus === 'todo') {
      setProgress(0);
    } else if (newStatus === 'in_progress' && (progress === 0 || progress === 100)) {
      setProgress(50);
    }
  };

  const handleProgressChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setProgress(clamped);
    if (clamped === 100) {
      setStatus('completed');
    } else if (clamped === 0 && status === 'completed') {
      setStatus('todo');
    } else if (clamped > 0 && status === 'todo') {
      setStatus('in_progress');
    }
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
    setSubtasks(updated);
    if (updated.length > 0) {
      const doneCount = updated.filter((s) => s.completed).length;
      handleProgressChange(Math.round((doneCount / updated.length) * 100));
    }
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const next = [...subtasks, { id: `st-${Date.now()}`, title: trimmed, completed: false }];
    setSubtasks(next);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên công việc.');
      return;
    }

    const savedTask: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      code: taskToEdit ? taskToEdit.code : `CV-${nextTaskNumber}`,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      project: project.trim() || 'Công việc chung',
      weekId,
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      status,
      priority,
      progress,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: Number(loggedHours) || 0,
      price: typeof price === 'number' ? price : 0,
      address: address.trim() || '',
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
      subtasks,
      blockerNote: blockerNote.trim() || '',
      updatedAt: getNowTimestampVi(),
    };

    onSaveTask(savedTask, isNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-[1px] transition-opacity">
      <div className="relative flex w-full max-w-md flex-col bg-white rounded-t-2xl sm:rounded-xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Mobile Drag Handle Bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Simple Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-5 py-3 bg-slate-50">
          <div>
            <span className="text-xs font-mono-tabular text-slate-500">
              {taskToEdit ? taskToEdit.code : `CV-${nextTaskNumber}`}
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              {isEmployeeView ? 'Cập nhật tiến độ công việc' : isNew ? 'Giao việc mới' : 'Cập nhật công việc'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Minimal Form - Very clean with only essentials by default */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="border-l-2 border-red-600 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {isEmployeeView && (
            <div className="border-l-2 border-blue-600 bg-blue-50 px-3 py-1.5 text-xs text-blue-800 font-medium">
              🔒 Tài khoản nhân viên: Bạn có thể cập nhật trạng thái, % tiến độ, checklist và ghi chú vướng mắc.
            </div>
          )}

          {/* 1. Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên công việc <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isEmployeeView}
              autoFocus={!isEmployeeView}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="VD: Kiểm tra báo cáo doanh thu..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>

          {/* 1b. Address & Map Picker */}
          <TaskLocationPicker
            address={address}
            lat={lat}
            lng={lng}
            disabled={isEmployeeView}
            onChangeLocation={(loc) => {
              setAddress(loc.address);
              setLat(loc.lat);
              setLng(loc.lng);
            }}
          />

          {/* 2. Assignee, Price & Received Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Người thực hiện
              </label>
              <select
                disabled={isEmployeeView}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              >
                <option value="">-- Chưa giao (Chưa có NV) --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giá / Chi phí (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                disabled={isEmployeeView}
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="VD: 500000"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono-tabular text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày nhận việc
              </label>
              <input
                type="date"
                disabled={isEmployeeView}
                value={receivedDate}
                onChange={(e) => {
                  setReceivedDate(e.target.value);
                  if (!dueDate) setDueDate(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono-tabular text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>
          </div>

          {/* 3. Status & Progress */}
          <div className="border border-slate-200 bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Trạng thái</span>
              <span className="text-blue-700 font-mono-tabular">{progress}%</span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'todo', label: 'Chưa làm' },
                  { id: 'in_progress', label: 'Đang làm' },
                  { id: 'blocked', label: 'Vướng mắc' },
                  { id: 'completed', label: 'Xong' },
                ] as { id: TaskStatus; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStatusSelect(st.id)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                    status === st.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Advanced Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showAdvanced ? 'Thu gọn' : '+ Thêm mô tả & checklist'}</span>
            </button>
          </div>

          {/* Collapsible Advanced Section */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Dự án / Nhóm
                  </label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="VD: Dự án A..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mức ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Ghi chú yêu cầu
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung chi tiết..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {status === 'blocked' && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-red-700 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Nội dung vướng mắc</span>
                  </label>
                  <input
                    type="text"
                    value={blockerNote}
                    onChange={(e) => setBlockerNote(e.target.value)}
                    placeholder="VD: Chờ duyệt tài khoản..."
                    className="w-full rounded-lg border border-red-300 bg-red-50/50 px-2.5 py-1 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Minimal Checklist */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Checklist các bước</span>
                  <span className="font-mono-tabular text-slate-400">
                    {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                  </span>
                </div>

                {subtasks.length > 0 && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white mb-2">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          {st.completed ? (
                            <CheckSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                            {st.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Thêm bước..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-2.5">
          <div>
            {!isEmployeeView && taskToEdit && onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  if (confirmDelete) {
                    onDeleteTask(taskToEdit.id);
                    onClose();
                  } else {
                    setConfirmDelete(true);
                  }
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                {confirmDelete ? 'Xác nhận xóa?' : 'Xóa việc'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {isNew ? 'Giao việc' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
