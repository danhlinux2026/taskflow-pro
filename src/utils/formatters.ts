import { Employee, ReportStatus, Task, TaskPriority, TaskStatus, WeeklyReport } from '../types';

export const STATUS_META: Record<
  TaskStatus,
  { label: string; textClass: string; barClass: string; shortLabel: string }
> = {
  todo: {
    label: 'Chưa bắt đầu',
    shortLabel: 'Chờ làm',
    textClass: 'text-slate-600',
    barClass: 'bg-slate-400',
  },
  in_progress: {
    label: 'Đang thực hiện',
    shortLabel: 'Đang làm',
    textClass: 'text-blue-700',
    barClass: 'bg-blue-600',
  },
  blocked: {
    label: 'Cần hỗ trợ',
    shortLabel: 'Vướng mắc',
    textClass: 'text-red-700',
    barClass: 'bg-red-600',
  },
  completed: {
    label: 'Hoàn thành',
    shortLabel: 'Xong',
    textClass: 'text-emerald-700',
    barClass: 'bg-emerald-600',
  },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; textClass: string }> = {
  high: {
    label: 'Ưu tiên cao',
    textClass: 'text-amber-700 font-semibold',
  },
  medium: {
    label: 'Trung bình',
    textClass: 'text-slate-700',
  },
  low: {
    label: 'Ưu tiên thấp',
    textClass: 'text-slate-500',
  },
};

export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; textClass: string }
> = {
  draft: {
    label: 'Bản nháp',
    textClass: 'text-slate-600',
  },
  submitted: {
    label: 'Chờ quản lý duyệt',
    textClass: 'text-blue-700 font-medium',
  },
  approved: {
    label: 'Đã duyệt báo cáo',
    textClass: 'text-emerald-700 font-semibold',
  },
  needs_revision: {
    label: 'Cần bổ sung',
    textClass: 'text-amber-700 font-semibold',
  },
};

export function formatViDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatVND(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return '0 đ';
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function getNowTimestampVi(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function generateAutoReportDraft(
  employee: Employee,
  weekTasks: Task[]
): { achievements: string; blockers: string; nextWeekPlan: string } {
  const completedTasks = weekTasks.filter((t) => t.status === 'completed' || t.progress === 100);
  const inProgressTasks = weekTasks.filter(
    (t) => (t.status === 'in_progress' || t.status === 'todo') && t.progress < 100
  );
  const blockedTasks = weekTasks.filter((t) => t.status === 'blocked');

  const achievementsLines: string[] = [];
  completedTasks.forEach((t) => {
    achievementsLines.push(`• Hoàn thành 100% [${t.code}] ${t.title} (${t.loggedHours}h thực tế).`);
  });
  inProgressTasks.forEach((t) => {
    if (t.progress > 0) {
      achievementsLines.push(`• Đang triển khai [${t.code}] ${t.title} — đạt tiến độ ${t.progress}%.`);
    }
  });
  if (achievementsLines.length === 0) {
    achievementsLines.push(`• Đã tiếp nhận ${weekTasks.length} đầu việc được giao trong tuần và lập kế hoạch thực hiện.`);
  }

  const blockerLines: string[] = [];
  blockedTasks.forEach((t) => {
    blockerLines.push(
      `• [${t.code}] ${t.title}: ${t.blockerNote || 'Cần hỗ trợ tháo gỡ vướng mắc để kịp hạn ' + formatViDate(t.dueDate)}.`
    );
  });
  if (blockerLines.length === 0) {
    blockerLines.push('• Không phát sinh vướng mắc ảnh hưởng đến tiến độ chung của nhóm.');
  }

  const nextPlanLines: string[] = [];
  inProgressTasks.forEach((t) => {
    nextPlanLines.push(`• Hoàn tất 100% [${t.code}] ${t.title} (hiện đạt ${t.progress}%).`);
  });
  blockedTasks.forEach((t) => {
    nextPlanLines.push(`• Xử lý dứt điểm vướng mắc và nghiệm thu [${t.code}] ${t.title}.`);
  });
  if (nextPlanLines.length === 0) {
    nextPlanLines.push(`• Tiếp nhận kế hoạch công việc tuần mới của bộ phận ${employee.department}.`);
  }

  return {
    achievements: achievementsLines.join('\n'),
    blockers: blockerLines.join('\n'),
    nextWeekPlan: nextPlanLines.join('\n'),
  };
}

export function exportWeeklySummaryCSV(
  weekLabel: string,
  employees: Employee[],
  tasks: Task[],
  reports: WeeklyReport[]
): void {
  const headers = [
    'Mã NV',
    'Họ và tên',
    'Bộ phận',
    'Số việc trong tuần',
    'Hoàn thành',
    'Tiến độ TB (%)',
    'Giờ thực tế / Kế hoạch',
    'Trạng thái báo cáo tuần',
    'Kết quả chính trong tuần',
    'Vướng mắc tồn đọng',
  ];

  const rows = employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assigneeId === emp.id);
    const completedCount = empTasks.filter((t) => t.status === 'completed').length;
    const avgProgress =
      empTasks.length > 0
        ? Math.round(empTasks.reduce((acc, t) => acc + t.progress, 0) / empTasks.length)
        : 0;
    const logged = empTasks.reduce((acc, t) => acc + t.loggedHours, 0);
    const est = empTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
    const rep = reports.find((r) => r.employeeId === emp.id);
    const repStatus = rep ? REPORT_STATUS_META[rep.status].label : 'Chưa nộp';

    return [
      emp.code,
      emp.name,
      emp.department,
      String(empTasks.length),
      `${completedCount}/${empTasks.length}`,
      `${avgProgress}%`,
      `${logged}h / ${est}h`,
      repStatus,
      (rep?.achievements || '').replace(/\n/g, ' ; '),
      (rep?.blockers || '').replace(/\n/g, ' ; '),
    ];
  });

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bao-cao-tuan-${weekLabel.replace(/[^a-zA-Z0-9_-]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
