export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';

export type TaskPriority = 'high' | 'medium' | 'low';

export type UserRole = 'admin' | 'employee';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  employeeId?: string; // Linked employee ID if role === 'employee'
  name: string;
  email: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  role: string;
  department: string;
  email: string;
  initials: string;
  weeklyCapacityHours: number;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  assigneeId: string;
  project: string;
  weekId: string;
  receivedDate?: string; // YYYY-MM-DD (Ngày nhận việc)
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0 to 100
  estimatedHours: number;
  loggedHours: number;
  price?: number; // Giá công việc / dịch vụ (VNĐ)
  address?: string; // Địa chỉ thực hiện công việc (tùy chọn)
  lat?: number; // Vĩ độ trên bản đồ
  lng?: number; // Kinh độ trên bản đồ
  subtasks: Subtask[];
  blockerNote?: string;
  updatedAt: string;
}

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision';

export interface WeeklyReport {
  id: string;
  weekId: string;
  employeeId: string;
  status: ReportStatus;
  submittedAt: string;
  achievements: string;
  blockers: string;
  nextWeekPlan: string;
  managerFeedback?: string;
}

export interface WeekPeriod {
  id: string;
  code: string;
  label: string;
  dateRange: string;
  isCurrent?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  taskId: string;
  taskCode: string;
  taskTitle: string;
  completedByEmployeeName: string;
  createdAt: string;
  read: boolean;
}

export interface TaskActivityLog {
  id: string;
  actionType: 'create' | 'update' | 'delete' | 'status_change' | 'progress_change';
  taskId: string;
  taskCode: string;
  taskTitle: string;
  performedBy: string;
  details: string;
  createdAt: string;
}
