import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckSquare,
  AlertTriangle,
  FileSpreadsheet,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Key,
  LogIn,
  Lock,
  UserPlus,
  Wifi,
  Users,
  FileText,
  BarChart3,
  MapPin,
  Bell,
  History,
  ChevronDown,
  ChevronUp,
  Monitor,
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  Umbrella,
  Megaphone,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Employee,
  Task,
  TaskPriority,
  TaskStatus,
  UserAccount,
  UserRole,
  WeeklyReport,
  AppNotification,
  TaskActivityLog,
} from './types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_WEEKLY_REPORTS,
  WEEK_PERIODS,
} from './data/initialData';
import {
  exportWeeklySummaryCSV,
  formatViDate,
  formatVND,
  getNowTimestampVi,
  PRIORITY_META,
  REPORT_STATUS_META,
  STATUS_META,
} from './utils/formatters';
import { TaskDrawerModal } from './components/TaskDrawerModal';
import { WeeklyReportView } from './components/WeeklyReportView';
import { TeamProgressView } from './components/TeamProgressView';
import { LoginModal } from './components/LoginModal';
import { AccountManagementModal } from './components/AccountManagementModal';
import { NotificationPopover } from './components/NotificationPopover';
import { ActivityLogModal } from './components/ActivityLogModal';
import { ActivityLogView } from './components/ActivityLogView';
import { LoginPage } from './components/LoginPage';
import { WeatherReminderModal, WeatherInfo } from './components/WeatherReminderModal';
import {
  subscribeToTasks,
  subscribeToEmployees,
  subscribeToUserAccounts,
  subscribeToWeeklyReports,
  subscribeToNotifications,
  subscribeToActivityLogs,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveUserAccountToFirestore,
  deleteUserAccountFromFirestore,
  saveWeeklyReportToFirestore,
  saveNotificationToFirestore,
  saveActivityLogToFirestore,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  deleteNotificationFromFirestore,
  clearFirestoreCollections,
  ensureDefaultAdmin,
} from './firebase';

type ActiveTab = 'tasks' | 'progress' | 'reports' | 'overview' | 'history';
type TaskViewMode = 'table' | 'board';

const DEFAULT_ADMIN_ACCOUNT: UserAccount = {
  id: 'acc-admin',
  username: 'admin',
  password: '123',
  role: 'admin',
  name: 'Quản trị viên (Admin)',
  email: 'admin@company.com',
  createdAt: new Date().toISOString(),
};

const STORAGE_KEYS = {
  CURRENT_USER: 'taskflow_current_user_v4',
};

export default function App() {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([DEFAULT_ADMIN_ACCOUNT]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<TaskActivityLog[]>([]);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isKpiExpanded, setIsKpiExpanded] = useState(false);

  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo>(() => {
    try {
      const saved = localStorage.getItem('TASKFLOW_WEATHER_INFO');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      location: 'Mũi Né, Phan Thiết',
      condition: 'rainy',
      temp: 28,
      humidity: 85,
      customNote: 'Dự báo hôm nay có mưa rào chiều. Nhắc nhở nhân viên đi làm / đi công tác mang theo ÁO MƯA & túi bọc máy tính cẩn thận!',
    };
  });
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  const handleSaveWeather = async (updated: WeatherInfo, sendNotif: boolean) => {
    setWeatherInfo(updated);
    try {
      localStorage.setItem('TASKFLOW_WEATHER_INFO', JSON.stringify(updated));
    } catch {}

    if (sendNotif) {
      const condLabel =
        updated.condition === 'rainy'
          ? '🌧️ Mưa rào'
          : updated.condition === 'sunny'
          ? '☀️ Nắng gắt'
          : updated.condition === 'stormy'
          ? '⛈️ Mưa bão'
          : '⛅ Nhiều mây';
      const notif: AppNotification = {
        id: 'notif-' + Date.now(),
        title: `Cập nhật thời tiết Mũi Né: ${condLabel}`,
        message: updated.customNote,
        taskId: '',
        taskCode: 'WEATHER',
        taskTitle: `Thời tiết Mũi Né (${updated.temp}°C)`,
        completedByEmployeeName: 'Ban Quản Lý',
        createdAt: new Date().toISOString(),
        read: false,
      };
      await saveNotificationToFirestore(notif);
      showToast('Đã phát thông báo nhắc nhở thời tiết tới toàn thể nhân viên!');
    } else {
      showToast('Đã cập nhật tình hình thời tiết.');
    }
  };

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null; // Show Login Screen on first launch
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {}
  }, [currentUser]);

  // REALTIME FIREBASE FIRESTORE SYNC
  useEffect(() => {
    ensureDefaultAdmin(DEFAULT_ADMIN_ACCOUNT);

    const unsubTasks = subscribeToTasks((data) => setTasks(data));
    const unsubEmp = subscribeToEmployees((data) => setEmployees(data));
    const unsubAcc = subscribeToUserAccounts((data) => {
      setUserAccounts(data.length > 0 ? data : [DEFAULT_ADMIN_ACCOUNT]);
    });
    const unsubRep = subscribeToWeeklyReports((data) => setReports(data));
    const unsubNotif = subscribeToNotifications((data) => setNotifications(data));
    const unsubLogs = subscribeToActivityLogs((data) => setActivityLogs(data));

    return () => {
      unsubTasks();
      unsubEmp();
      unsubAcc();
      unsubRep();
      unsubNotif();
      unsubLogs();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [activeWeekId, setActiveWeekId] = useState<string>('2026-W39');
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('table');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultModalAssignee, setDefaultModalAssignee] = useState<string | undefined>(undefined);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const isEmployeeRole = currentUser?.role === 'employee';
  const isAdminRole = currentUser?.role === 'admin' || !isEmployeeRole;

  const activeWeek = useMemo(
    () => WEEK_PERIODS.find((w) => w.id === activeWeekId) || WEEK_PERIODS[1],
    [activeWeekId]
  );

  const weekTasks = useMemo(
    () => tasks.filter((t) => t.weekId === activeWeekId),
    [tasks, activeWeekId]
  );

  // STRICT EMPLOYEE PERMISSION FILTER: Employees only see tasks assigned to them
  const visibleTasks = useMemo(() => {
    if (isEmployeeRole && currentUser?.employeeId) {
      return weekTasks.filter((t) => t.assigneeId === currentUser.employeeId);
    }
    return weekTasks;
  }, [weekTasks, isEmployeeRole, currentUser?.employeeId]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (assigneeFilter === 'unassigned') {
        if (t.assigneeId) return false;
      } else if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emp = employees.find((e) => e.id === t.assigneeId);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchProject = t.project.toLowerCase().includes(q);
        const matchEmp = emp ? emp.name.toLowerCase().includes(q) : false;
        return matchTitle || matchCode || matchProject || matchEmp;
      }
      return true;
    });
  }, [visibleTasks, statusFilter, assigneeFilter, priorityFilter, searchQuery, employees]);

  const kpis = useMemo(() => {
    const total = visibleTasks.length;
    const completed = visibleTasks.filter((t) => t.status === 'completed').length;
    const inProgress = visibleTasks.filter((t) => t.status === 'in_progress').length;
    const blocked = visibleTasks.filter((t) => t.status === 'blocked').length;
    const unassigned = visibleTasks.filter((t) => !t.assigneeId).length;
    const avgProgress =
      total > 0 ? Math.round(visibleTasks.reduce((acc, t) => acc + t.progress, 0) / total) : 0;

    const totalLogged = visibleTasks.reduce((acc, t) => acc + t.loggedHours, 0);
    const totalEst = visibleTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
    const totalPrice = visibleTasks.reduce((acc, t) => acc + (t.price || 0), 0);
    const completedPrice = visibleTasks
      .filter((t) => t.status === 'completed')
      .reduce((acc, t) => acc + (t.price || 0), 0);

    return {
      total,
      completed,
      inProgress,
      blocked,
      unassigned,
      avgProgress,
      totalLogged,
      totalEst,
      totalPrice,
      completedPrice,
    };
  }, [visibleTasks]);

  const handleOpenTaskModal = (task: Task | null, assigneeId?: string) => {
    if (isEmployeeRole && !task) {
      showToast('🔒 Chỉ Admin mới có quyền tạo và giao việc mới.');
      return;
    }
    setEditingTask(task);
    setDefaultModalAssignee(assigneeId);
    setIsTaskModalOpen(true);
  };

  const recordActivityLog = (
    actionType: TaskActivityLog['actionType'],
    task: { id: string; code: string; title: string },
    details: string
  ) => {
    const newLog: TaskActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actionType,
      taskId: task.id,
      taskCode: task.code,
      taskTitle: task.title,
      performedBy: currentUser?.name || (isEmployeeRole ? 'Nhân viên' : 'Admin'),
      details,
      createdAt: new Date().toISOString(),
    };
    saveActivityLogToFirestore(newLog);
  };

  const triggerCompletionNotification = (prevTask: Task | undefined, nextTask: Task) => {
    const isNowCompleted = nextTask.status === 'completed' || nextTask.progress === 100;
    const wasCompletedBefore = prevTask && (prevTask.status === 'completed' || prevTask.progress === 100);

    if (isNowCompleted && !wasCompletedBefore) {
      const emp = getEmployee(nextTask.assigneeId);
      const empName = emp ? emp.name : currentUser?.name || 'Nhân viên';
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `🎉 Công việc [${nextTask.code}] đã hoàn thành!`,
        message: `Nhân viên ${empName} vừa báo hoàn thành công việc "${nextTask.title}".`,
        taskId: nextTask.id,
        taskCode: nextTask.code,
        taskTitle: nextTask.title,
        completedByEmployeeName: empName,
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotificationToFirestore(newNotif);
    }
  };

  const handleSaveTask = (savedTask: Task, isNew: boolean) => {
    if (isEmployeeRole && isNew) {
      showToast('🔒 Bạn không có quyền tạo công việc mới.');
      return;
    }

    const prevTask = tasks.find((t) => t.id === savedTask.id);
    saveTaskToFirestore(savedTask);
    triggerCompletionNotification(prevTask, savedTask);

    if (isNew) {
      const emp = getEmployee(savedTask.assigneeId);
      const assigneeName = emp ? emp.name : 'Chưa giao';
      recordActivityLog(
        'create',
        savedTask,
        `Tạo công việc mới "${savedTask.title}" (${formatVND(savedTask.price)}). Người thực hiện: ${assigneeName}. Hạn làm: ${formatViDate(savedTask.dueDate)}.`
      );
      showToast(`Đã giao việc mới [${savedTask.code}] ${savedTask.title}`);
    } else {
      recordActivityLog(
        'update',
        savedTask,
        `Cập nhật công việc: Tiến độ ${savedTask.progress}%, Trạng thái "${STATUS_META[savedTask.status].label}".`
      );
      showToast(`Đã cập nhật tiến độ [${savedTask.code}] (${savedTask.progress}%)`);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (isEmployeeRole) {
      showToast('🔒 Chỉ Admin mới có quyền xóa công việc.');
      return;
    }
    const target = tasks.find((t) => t.id === taskId);
    deleteTaskFromFirestore(taskId);
    if (target) {
      recordActivityLog(
        'delete',
        target,
        `Đã xóa công việc [${target.code}] "${target.title}" khỏi hệ thống.`
      );
      showToast(`Đã xóa đầu việc [${target.code}]`);
    }
  };

  const handleQuickUpdateProgress = (taskId: string, nextProgress: number) => {
    const clamped = Math.max(0, Math.min(100, nextProgress));
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let nextStatus: TaskStatus = target.status;
    if (clamped === 100) {
      nextStatus = 'completed';
    } else if (clamped === 0) {
      nextStatus = 'todo';
    } else if (target.status === 'todo' || target.status === 'completed') {
      nextStatus = 'in_progress';
    }
    const updatedSubtasks =
      clamped === 100
        ? target.subtasks.map((s) => ({ ...s, completed: true }))
        : target.subtasks;

    const updatedTask: Task = {
      ...target,
      progress: clamped,
      status: nextStatus,
      subtasks: updatedSubtasks,
      updatedAt: getNowTimestampVi(),
    };

    saveTaskToFirestore(updatedTask);
    triggerCompletionNotification(target, updatedTask);
    recordActivityLog(
      'progress_change',
      updatedTask,
      `Cập nhật tiến độ từ ${target.progress}% ➔ ${clamped}% (Trạng thái: ${STATUS_META[nextStatus].label}).`
    );
    showToast(`Đã cập nhật mức hoàn thành: ${clamped}%`);
  };

  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const nextProgress =
      newStatus === 'completed'
        ? 100
        : newStatus === 'todo'
        ? 0
        : target.progress === 0 || target.progress === 100
        ? 50
        : target.progress;

    const updatedTask: Task = {
      ...target,
      status: newStatus,
      progress: nextProgress,
      updatedAt: getNowTimestampVi(),
    };

    saveTaskToFirestore(updatedTask);
    triggerCompletionNotification(target, updatedTask);
    recordActivityLog(
      'status_change',
      updatedTask,
      `Chuyển trạng thái từ "${STATUS_META[target.status].label}" ➔ "${STATUS_META[newStatus].label}" (${nextProgress}%).`
    );
    showToast(`Đã chuyển trạng thái sang "${STATUS_META[newStatus].label}"`);
  };

  const handleSaveReport = (report: WeeklyReport) => {
    saveWeeklyReportToFirestore(report);
    showToast('Đã lưu báo cáo tuần.');
  };

  const handleAddEmployeeAndAccount = (emp: Employee, acc: UserAccount) => {
    saveEmployeeToFirestore(emp);
    saveUserAccountToFirestore(acc);
    showToast(`Đã thêm nhân sự ${emp.name} và cấp tài khoản (Username: ${acc.username})`);
  };

  const handleAddEmployee = (emp: Employee) => {
    saveEmployeeToFirestore(emp);
    const baseUsername = emp.code.toLowerCase().replace('-', '');
    let finalUsername = baseUsername;
    let count = 1;
    while (userAccounts.some((a) => a.username.trim().toLowerCase() === finalUsername)) {
      count++;
      finalUsername = `${baseUsername}_${count}`;
    }
    const autoAcc: UserAccount = {
      id: `acc-${Date.now()}`,
      username: finalUsername,
      password: '123',
      role: 'employee',
      employeeId: emp.id,
      name: emp.name,
      email: emp.email,
      createdAt: new Date().toISOString(),
    };
    saveUserAccountToFirestore(autoAcc);
    showToast(`Đã thêm ${emp.name} và tự tạo tài khoản (Username: ${finalUsername}, Mật khẩu: 123)`);
  };

  const handleUpdateAccount = (acc: UserAccount) => {
    saveUserAccountToFirestore(acc);
    showToast(`Đã cập nhật tài khoản cho ${acc.name}`);
  };

  const handleUpdateEmployeeAndAccount = (emp: Employee, acc: UserAccount) => {
    saveEmployeeToFirestore(emp);
    saveUserAccountToFirestore(acc);
    if (currentUser && currentUser.id === acc.id) {
      setCurrentUser(acc);
    }
    showToast(`Đã cập nhật thông tin cho ${emp.name}`);
  };

  const handleDeleteAccount = (accId: string) => {
    deleteUserAccountFromFirestore(accId);
    showToast('Đã thu hồi tài khoản.');
  };

  const handleDeleteEmployee = (emp: Employee) => {
    const linkedAcc = userAccounts.find(
      (a) => a.employeeId === emp.id && a.role === 'employee'
    );
    if (linkedAcc) {
      deleteUserAccountFromFirestore(linkedAcc.id);
    }
    deleteEmployeeFromFirestore(emp.id);
    showToast(`Đã xóa nhân sự ${emp.name}${linkedAcc ? ' và tài khoản ' + linkedAcc.username : ''}.`);
  };

  const handleResetDemoData = async () => {
    await clearFirestoreCollections(DEFAULT_ADMIN_ACCOUNT);
    setCurrentUser(DEFAULT_ADMIN_ACCOUNT);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setSearchQuery('');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setPriorityFilter('all');
    showToast('Đã xóa sạch toàn bộ dữ liệu Firebase và cài lại tài khoản Admin mặc định.');
  };

  const getEmployee = (id: string) =>
    employees.find((e) => e.id === id) || {
      id: 'unknown',
      code: 'NV-00',
      name: 'Chưa phân công',
      role: 'Nhân viên',
      department: 'Chung',
      email: '',
      initials: 'NV',
      weeklyCapacityHours: 40,
    };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setPriorityFilter('all');
  };

  if (!currentUser) {
    return (
      <LoginPage
        accounts={userAccounts}
        employees={employees}
        onLogin={(acc) => {
          setCurrentUser(acc);
          showToast(`Đăng nhập thành công: ${acc.name} (${acc.role === 'admin' ? 'Admin' : 'Nhân viên'})`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* TOP BAR HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap leading-tight truncate">
              MÁY TÍNH MŨI NÉ
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium leading-tight">Hệ thống Điều hành & Quản lý Công việc</p>
          </div>
          <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 whitespace-nowrap ml-1">
            <Wifi className="h-3 w-3 text-emerald-600 animate-pulse" />
            <span className="hidden sm:inline">Firebase Realtime</span>
            <span className="sm:hidden">Realtime</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Bảng giao việc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'reports'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Báo cáo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'overview' || activeTab === 'history'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tổng quan & Lịch sử
          </button>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Task Button - Only for Admin */}
          {!isEmployeeRole && (
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setDefaultModalAssignee(undefined);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer min-h-[34px] sm:min-h-[38px]"
              title="Tạo công việc mới"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Thêm Việc</span>
            </button>
          )}

          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => setIsNotificationPopoverOpen((prev) => !prev)}
            className="relative inline-flex items-center justify-center h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors shrink-0"
            title="Thông báo hoàn thành công việc"
          >
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {notifications.filter((n) => !n.read).length > 9
                  ? '9+'
                  : notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          {/* Admin Account Management Button */}
          {!isEmployeeRole && (
            <button
              type="button"
              onClick={() => setIsAccountManagementOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[34px] sm:min-h-[38px] min-w-[34px] sm:min-w-[38px] justify-center"
              title="Cấp tài khoản đăng nhập cho nhân viên"
            >
              <Key className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden md:inline">Cấp tài khoản</span>
            </button>
          )}

          {/* User Role Pill Button */}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors min-h-[34px] sm:min-h-[38px]"
            title="Bấm để chuyển đổi tài khoản đăng nhập"
          >
            {currentUser.role === 'admin' ? (
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            ) : (
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="font-semibold text-slate-800 max-w-[60px] xs:max-w-[80px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
              {currentUser.name}
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
              showToast('Đã đăng xuất khỏi hệ thống');
            }}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors min-h-[34px] sm:min-h-[38px]"
            title="Đăng xuất về trang đăng nhập"
          >
            <LogIn className="h-3.5 w-3.5 rotate-180 text-red-500" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Contextual Workspace Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 py-2">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono-tabular text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs">
              {activeWeek.dateRange}
            </span>
          </div>

          {/* WEATHER & REMINDER WIDGET */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs w-full sm:w-auto">
            {/* Weather Badge */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-medium transition-all shadow-2xs text-[11px] sm:text-xs ${
                weatherInfo.condition === 'rainy'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : weatherInfo.condition === 'sunny'
                  ? 'bg-orange-50 border-orange-300 text-orange-900'
                  : weatherInfo.condition === 'stormy'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}
            >
              {weatherInfo.condition === 'rainy' && (
                <CloudRain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0 animate-bounce" />
              )}
              {weatherInfo.condition === 'sunny' && (
                <Sun
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0 animate-spin"
                  style={{ animationDuration: '10s' }}
                />
              )}
              {weatherInfo.condition === 'stormy' && (
                <CloudLightning className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0 animate-pulse" />
              )}
              {weatherInfo.condition === 'cloudy' && (
                <CloudSun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
              )}

              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-bold truncate max-w-[80px] sm:max-w-none">{weatherInfo.location}:</span>
                <span className="font-semibold">{weatherInfo.temp}°C</span>
                <span className="hidden sm:inline opacity-75">
                  · {weatherInfo.humidity}% độ ẩm
                </span>
              </div>
            </div>

            {/* Dynamic Reminder Alert Box */}
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs flex-1 sm:flex-initial sm:max-w-md md:max-w-lg font-medium ${
                weatherInfo.condition === 'rainy'
                  ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                  : weatherInfo.condition === 'sunny'
                  ? 'bg-orange-100/70 border-orange-300 text-orange-950'
                  : weatherInfo.condition === 'stormy'
                  ? 'bg-red-100/70 border-red-300 text-red-950'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              {weatherInfo.condition === 'rainy' && (
                <Umbrella className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 shrink-0" />
              )}
              {weatherInfo.condition === 'sunny' && (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
              )}
              {weatherInfo.condition === 'stormy' && (
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
              )}
              {weatherInfo.condition === 'cloudy' && (
                <CloudSun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 shrink-0" />
              )}

              <span className="truncate line-clamp-1" title={weatherInfo.customNote}>
                <strong className="hidden sm:inline">Nhắc nhở: </strong>{weatherInfo.customNote}
              </span>
            </div>

            {/* Admin Weather Update Button */}
            {isAdminRole && (
              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer text-[11px] sm:text-xs"
                title="Cập nhật thời tiết & gửi nhắc nhở nhân viên mang áo mưa / đội nón"
              >
                <Megaphone className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Cập nhật thời tiết / Nhắc nhở</span>
                <span className="md:hidden">Thời tiết</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
        {activeTab === 'tasks' && (
          <>
            <section className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsKpiExpanded((prev) => !prev)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Thống kê & Chỉ số tuần ({activeWeek.code})</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono-tabular">
                    ({kpis.total} công việc · {kpis.completed} đã xong)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-normal">
                  <span className="text-[11px]">{isKpiExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                  {isKpiExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              </button>

              {isKpiExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-200">
                  <div className="p-2 sm:p-2.5 space-y-0.5">
                    <div className="text-[11px] text-slate-500">Tổng đầu việc tuần</div>
                    <div className="text-base sm:text-lg font-bold font-mono-tabular text-slate-900">
                      {kpis.total}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono-tabular">
                      Tổng giá trị: <span className="font-semibold text-slate-800">{formatVND(kpis.totalPrice)}</span>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-0.5">
                    <div className="text-[11px] text-slate-500">Đã hoàn thành</div>
                    <div className="text-base sm:text-lg font-bold font-mono-tabular text-emerald-600">
                      {kpis.completed}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono-tabular font-medium">
                      Đã hoàn tất: {formatVND(kpis.completedPrice)}
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-0.5">
                    <div className="text-[11px] text-slate-500">Đang triển khai</div>
                    <div className="text-base sm:text-lg font-bold font-mono-tabular text-blue-600">
                      {kpis.inProgress}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono-tabular">
                      Tiến độ trung bình: {kpis.avgProgress}%
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-0.5">
                    <div className="text-[11px] text-slate-500">
                      {isEmployeeRole ? 'Đang gặp vướng mắc' : 'Chưa giao cho NV'}
                    </div>
                    <div className="text-base sm:text-lg font-bold font-mono-tabular text-amber-600">
                      {isEmployeeRole ? kpis.blocked : kpis.unassigned}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isEmployeeRole
                        ? (kpis.blocked > 0 ? '⚠️ Cần quản lý hỗ trợ' : 'Đang trôi chảy')
                        : (kpis.unassigned > 0 ? '⚠️ Bấm để giao cho NV mới' : 'Đã giao hết cho NV')}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              {/* Row 1: Search Box on top */}
              <div className="relative w-full">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm công việc, mã việc, giá cả, tên nhân viên..."
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Row 2: Status Filter and Employee Filter strictly on the same row */}
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                    className="flex-1 min-w-0 w-1/2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none truncate"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="todo">Chưa bắt đầu</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="blocked">Cần hỗ trợ</option>
                    <option value="completed">Hoàn thành</option>
                  </select>

                  {!isEmployeeRole && (
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="flex-1 min-w-0 w-1/2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none truncate"
                    >
                      <option value="all">Tất cả nhân viên ({employees.length})</option>
                      <option value="unassigned">⚠️ Chưa phân công ({kpis.unassigned})</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {(searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-blue-600 hover:underline px-1 whitespace-nowrap shrink-0"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>
            </section>

            {filteredTasks.length === 0 ? (
              <div className="border border-slate-200 bg-white rounded-lg p-12 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {visibleTasks.length === 0
                    ? isEmployeeRole
                      ? 'Bạn chưa có công việc nào được giao trong tuần này'
                      : 'Chưa có công việc nào trong tuần này'
                    : 'Không tìm thấy công việc phù hợp với bộ lọc'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {visibleTasks.length === 0
                    ? isEmployeeRole
                      ? 'Khi Admin phân công công việc cho bạn, danh sách công việc sẽ tự động hiển thị ở đây.'
                      : 'Bấm nút "Giao việc mới" ở trên để tạo công việc và phân công cho nhân viên.'
                    : 'Thử xóa từ khóa tìm kiếm hoặc thay đổi bộ lọc trạng thái.'}
                </p>
                {!isEmployeeRole && visibleTasks.length === 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenTaskModal(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Giao việc ngay</span>
                  </button>
                )}
              </div>
            ) : taskViewMode === 'table' ? (
              <div className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-2xs w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="py-2.5 px-4 w-20">Mã</th>
                        <th className="py-2.5 px-4 min-w-[200px]">Tên công việc</th>
                        <th className="py-2.5 px-4 min-w-[180px]">Ghi chú</th>
                        <th className="py-2.5 px-4 min-w-[140px]">Người thực hiện</th>
                        <th className="py-2.5 px-4 w-28">Giá dịch vụ</th>
                        <th className="py-2.5 px-4 w-28">Ngày nhận</th>
                        <th className="py-2.5 px-4 w-32">Trạng thái</th>
                        <th className="py-2.5 px-4 w-24 text-right">Tiến độ</th>
                        <th className="py-2.5 px-4 w-28 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.map((task) => {
                        const hasAssignee = Boolean(task.assigneeId);
                        const emp = hasAssignee ? getEmployee(task.assigneeId) : null;
                        const isCompleted = task.status === 'completed' || task.progress === 100;
                        return (
                          <tr
                            key={task.id}
                            onClick={() => handleOpenTaskModal(task)}
                            className={`cursor-pointer transition-colors ${
                              isCompleted
                                ? 'bg-emerald-50/70 border-l-4 border-l-emerald-700 hover:bg-emerald-100/80'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono-tabular">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  isCompleted
                                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs font-extrabold'
                                    : hasAssignee
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {task.code}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`font-semibold ${isCompleted ? 'text-emerald-950 font-bold' : 'text-slate-900'} hover:text-blue-600`}>
                                {task.title}
                              </div>
                              {task.address && (
                                <div className="text-[11px] text-blue-700 mt-0.5 flex items-center gap-1 font-medium">
                                  <MapPin className="h-3 w-3 shrink-0 text-blue-600" />
                                  <span className="truncate max-w-[280px]">{task.address}</span>
                                </div>
                              )}
                              {task.blockerNote && task.status === 'blocked' && (
                                <div className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>{task.blockerNote}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-[220px]">
                              <div className="line-clamp-2 text-[11px] leading-relaxed" title={task.description || task.blockerNote || ''}>
                                {task.description ? (
                                  <span className="text-slate-700 font-normal">{task.description}</span>
                                ) : task.blockerNote ? (
                                  <span className="text-amber-800 font-medium flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                                    {task.blockerNote}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {emp ? (
                                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-700 text-[10px] font-bold text-white font-mono-tabular shrink-0">
                                    {emp.initials}
                                  </div>
                                  <span className="font-semibold text-emerald-900 text-[11px]">{emp.name}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  ⚠️ Chưa phân công
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-800 whitespace-nowrap">
                              {formatVND(task.price)}
                            </td>
                            <td className="py-3 px-4 font-mono-tabular text-slate-600">
                              {formatViDate(task.receivedDate || task.dueDate)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-800 text-white shadow-2xs font-extrabold'
                                    : STATUS_META[task.status].textClass + ' bg-slate-100'
                                }`}
                              >
                                {STATUS_META[task.status].label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-bold text-emerald-800">
                              {task.progress}%
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTaskModal(task);
                                  }}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                                  title="Sửa công việc"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isEmployeeRole}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isEmployeeRole) {
                                      showToast('🔒 Chỉ Admin mới có quyền xóa công việc.');
                                      return;
                                    }
                                    if (confirm(`Xác nhận xóa công việc [${task.code}] "${task.title}"?`)) {
                                      handleDeleteTask(task.id);
                                    }
                                  }}
                                  className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
                                    isEmployeeRole
                                      ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                                      : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'
                                  }`}
                                  title={isEmployeeRole ? 'Chỉ Admin mới được xóa' : 'Xóa công việc'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* KANBAN BOARD VIEW */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(
                  [
                    { id: 'todo', label: 'Chưa bắt đầu', color: 'border-slate-300' },
                    { id: 'in_progress', label: 'Đang thực hiện', color: 'border-blue-500' },
                    { id: 'blocked', label: 'Vướng mắc', color: 'border-amber-500' },
                    { id: 'completed', label: 'Hoàn thành', color: 'border-emerald-500' },
                  ] as { id: TaskStatus; label: string; color: string }[]
                ).map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="border border-slate-200 bg-slate-50/50 rounded-lg p-3 space-y-3 flex flex-col min-h-[300px]"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-semibold text-slate-800">{col.label}</span>
                        <span className="text-xs font-mono-tabular font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        {colTasks.map((t) => {
                          const hasEmp = Boolean(t.assigneeId);
                          const emp = hasEmp ? getEmployee(t.assigneeId) : null;
                          const isCompleted = t.status === 'completed' || t.progress === 100;
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleOpenTaskModal(t)}
                              className={`p-3 ${
                                isCompleted
                                  ? 'bg-emerald-50/80 border-l-4 border-l-emerald-800 border-emerald-200 shadow-xs'
                                  : `bg-white border-l-3 ${col.color} border-slate-200 shadow-2xs`
                              } rounded-lg hover:shadow-xs transition-all cursor-pointer space-y-2`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono-tabular font-semibold">
                                <span
                                  className={
                                    isCompleted
                                      ? 'text-white bg-emerald-800 border border-emerald-900 px-1.5 py-0.5 rounded font-black shadow-2xs'
                                      : hasEmp
                                      ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-bold'
                                      : 'text-slate-500'
                                  }
                                >
                                  {t.code}
                                </span>
                                <span className="text-slate-800">{formatVND(t.price)}</span>
                              </div>
                              <div className="text-xs font-semibold text-slate-900 leading-snug">
                                {t.title}
                              </div>
                              {t.address && (
                                <div className="text-[11px] text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  <MapPin className="h-3 w-3 shrink-0 text-blue-600" />
                                  <span className="truncate">{t.address}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                                <span className="font-medium">
                                  {emp ? emp.name : <strong className="text-amber-700 font-normal">⚠️ Chưa giao</strong>}
                                </span>
                                <span className="font-mono-tabular">{formatViDate(t.dueDate)}</span>
                              </div>
                              <div className="flex items-center justify-end gap-1 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTaskModal(t);
                                  }}
                                  className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                  title="Sửa"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isEmployeeRole}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isEmployeeRole) {
                                      showToast('🔒 Chỉ Admin mới có quyền xóa công việc.');
                                      return;
                                    }
                                    if (confirm(`Xóa [${t.code}] "${t.title}"?`)) handleDeleteTask(t.id);
                                  }}
                                  className={`inline-flex items-center justify-center h-6 w-6 rounded-md border transition-colors ${isEmployeeRole ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                                  title={isEmployeeRole ? 'Chỉ Admin mới được xóa' : 'Xóa'}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'progress' && (
          <TeamProgressView
            activeWeek={activeWeek}
            employees={employees}
            tasks={tasks}
            onOpenTaskModal={handleOpenTaskModal}
            onQuickUpdateProgress={handleQuickUpdateProgress}
            onAddEmployee={handleAddEmployee}
            onNavigateToReport={() => setActiveTab('reports')}
            isEmployeeView={isEmployeeRole}
          />
        )}

        {activeTab === 'reports' && (
          <WeeklyReportView
            activeWeek={activeWeek}
            employees={employees}
            tasks={tasks}
            reports={reports}
            onSaveReport={handleSaveReport}
            onOpenTaskModal={handleOpenTaskModal}
            isEmployeeView={isEmployeeRole}
            currentEmployeeId={currentUser?.employeeId}
          />
        )}

        {(activeTab === 'overview' || activeTab === 'history') && (
          <div className="space-y-4 w-full">
            <div className="border border-slate-200 bg-white rounded-lg p-4 space-y-3 w-full shadow-2xs">
              <h2 className="text-sm font-semibold text-slate-900">
                Tổng quan giao ban {activeWeek.code}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-center">
                  <div className="text-[11px] font-medium text-slate-500">Tổng công việc</div>
                  <div className="text-sm sm:text-base font-bold font-mono-tabular text-slate-900 mt-0.5">
                    {kpis.total}
                  </div>
                </div>
                <div className="p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-center">
                  <div className="text-[11px] font-medium text-slate-500">Đã hoàn thành</div>
                  <div className="text-sm sm:text-base font-bold font-mono-tabular text-emerald-600 mt-0.5">
                    {kpis.completed} ({kpis.total > 0 ? Math.round((kpis.completed / kpis.total) * 100) : 0}%)
                  </div>
                </div>
                <div className="p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-center">
                  <div className="text-[11px] font-medium text-slate-500">Đang thực hiện / Vướng</div>
                  <div className="text-sm sm:text-base font-bold font-mono-tabular text-blue-600 mt-0.5">
                    {kpis.inProgress} đ.làm / {kpis.blocked} vướng
                  </div>
                </div>
              </div>
            </div>

            <ActivityLogView
              logs={isEmployeeRole && currentUser?.employeeId
                ? activityLogs.filter(log => {
                    const task = tasks.find(t => t.id === log.taskId);
                    return task && task.assigneeId === currentUser.employeeId;
                  })
                : activityLogs
              }
              onSelectTask={(taskId) => {
                const target = tasks.find((t) => t.id === taskId);
                if (target) {
                  handleOpenTaskModal(target);
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Task Edit/Creation Modal */}
      <TaskDrawerModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={editingTask}
        employees={employees}
        weeks={WEEK_PERIODS}
        activeWeekId={activeWeekId}
        defaultAssigneeId={defaultModalAssignee}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        nextTaskNumber={tasks.length + 1}
        isEmployeeView={isEmployeeRole}
      />

      {/* Login Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        accounts={userAccounts}
        employees={employees}
        currentUser={currentUser}
        onSelectAccount={(acc) => {
          setCurrentUser(acc);
          showToast(`Đã chuyển sang tài khoản: ${acc.name} (${acc.role === 'admin' ? 'Admin' : 'Nhân viên'})`);
        }}
        onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
      />

      {/* Admin Account Provisioning Modal */}
      <AccountManagementModal
        isOpen={isAccountManagementOpen}
        onClose={() => setIsAccountManagementOpen(false)}
        employees={employees}
        accounts={userAccounts}
        onAddEmployeeAndAccount={handleAddEmployeeAndAccount}
        onUpdateAccount={handleUpdateAccount}
        onUpdateEmployeeAndAccount={handleUpdateEmployeeAndAccount}
        onDeleteAccount={handleDeleteAccount}
        onDeleteEmployee={handleDeleteEmployee}
      />

      {/* Admin Completion Notification Popover */}
      <NotificationPopover
        isOpen={isNotificationPopoverOpen}
        onClose={() => setIsNotificationPopoverOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => markNotificationAsReadInFirestore(id)}
        onMarkAllAsRead={() => markAllNotificationsAsReadInFirestore(notifications)}
        onDeleteNotification={(id) => deleteNotificationFromFirestore(id)}
        onSelectTask={(taskId) => {
          const target = tasks.find((t) => t.id === taskId);
          if (target) {
            setActiveTab('tasks');
            handleOpenTaskModal(target);
          }
        }}
      />

      {/* Weather Update & Staff Reminder Modal */}
      <WeatherReminderModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weatherInfo={weatherInfo}
        onSaveWeather={handleSaveWeather}
      />

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        logs={activityLogs}
        onSelectTask={(taskId) => {
          const target = tasks.find((t) => t.id === taskId);
          if (target) {
            setActiveTab('tasks');
            handleOpenTaskModal(target);
          }
        }}
      />

      {/* MOBILE BOTTOM TAB BAR (Thumb Zone Optimized) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 flex items-center justify-around px-2 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center min-w-[60px] h-full transition-colors ${
            activeTab === 'tasks' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="h-5 w-5" />
          <span className="text-[10px] mt-1">Bảng việc</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center min-w-[60px] h-full transition-colors ${
            activeTab === 'reports' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] mt-1">Báo cáo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center min-w-[60px] h-full transition-colors ${
            activeTab === 'overview' || activeTab === 'history' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] mt-1">Tổng quan & Lịch sử</span>
        </button>
      </nav>
    </div>
  );
}
