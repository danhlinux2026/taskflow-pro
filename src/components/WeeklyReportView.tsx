import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Check,
  Copy,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Employee, ReportStatus, Task, WeeklyReport, WeekPeriod } from '../types';
import {
  exportWeeklySummaryCSV,
  formatViDate,
  generateAutoReportDraft,
  getNowTimestampVi,
  REPORT_STATUS_META,
  STATUS_META,
} from '../utils/formatters';

interface WeeklyReportViewProps {
  activeWeek: WeekPeriod;
  employees: Employee[];
  tasks: Task[];
  reports: WeeklyReport[];
  onSaveReport: (report: WeeklyReport) => void;
  onOpenTaskModal: (task: Task | null, defaultAssigneeId?: string) => void;
  isEmployeeView?: boolean;
  currentEmployeeId?: string;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  activeWeek,
  employees,
  tasks,
  reports,
  onSaveReport,
  onOpenTaskModal,
  isEmployeeView = false,
  currentEmployeeId,
}) => {
  const [reportPeriodType, setReportPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    isEmployeeView && currentEmployeeId ? currentEmployeeId : employees[0]?.id || ''
  );

  useEffect(() => {
    if (isEmployeeView && currentEmployeeId) {
      setSelectedEmpId(currentEmployeeId);
    }
  }, [isEmployeeView, currentEmployeeId]);
  const [achievements, setAchievements] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Active form section tab to keep UI light & uncluttered
  const [activeFormTab, setActiveFormTab] = useState<'content' | 'feedback'>('content');
  const [showTaskTable, setShowTaskTable] = useState(false);

  const weekTasks = tasks.filter((t) => t.weekId === activeWeek.id);
  const weekReports = reports.filter((r) => r.weekId === activeWeek.id);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const empWeekTasks = selectedEmployee ? weekTasks.filter((t) => t.assigneeId === selectedEmployee.id) : [];
  const currentReport = selectedEmployee ? weekReports.find((r) => r.employeeId === selectedEmployee.id) : undefined;

  useEffect(() => {
    if (employees.length > 0 && (!selectedEmpId || !employees.some((e) => e.id === selectedEmpId))) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    setSavedNotice(null);
    if (!selectedEmployee) return;
    if (currentReport) {
      setAchievements(currentReport.achievements);
      setBlockers(currentReport.blockers);
      setNextWeekPlan(currentReport.nextWeekPlan);
      setManagerFeedback(currentReport.managerFeedback || '');
    } else {
      const auto = generateAutoReportDraft(selectedEmployee, empWeekTasks);
      setAchievements(auto.achievements);
      setBlockers(auto.blockers);
      setNextWeekPlan(auto.nextWeekPlan);
      setManagerFeedback('');
    }
  }, [selectedEmpId, activeWeek.id, currentReport?.id, selectedEmployee?.id]);

  const handleAutoFillFromTasks = () => {
    if (!selectedEmployee) return;
    const auto = generateAutoReportDraft(selectedEmployee, empWeekTasks);
    setAchievements(auto.achievements);
    setBlockers(auto.blockers);
    setNextWeekPlan(auto.nextWeekPlan);
    setSavedNotice('Đã tự động tổng hợp dữ liệu từ các đầu việc trong tuần.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveWithStatus = (newStatus: ReportStatus, message: string) => {
    if (!selectedEmployee) return;
    const updated: WeeklyReport = {
      id: currentReport ? currentReport.id : `rep-${activeWeek.id}-${selectedEmployee.id}`,
      weekId: activeWeek.id,
      employeeId: selectedEmployee.id,
      status: newStatus,
      submittedAt: getNowTimestampVi(),
      achievements: achievements.trim(),
      blockers: blockers.trim(),
      nextWeekPlan: nextWeekPlan.trim(),
      managerFeedback: managerFeedback.trim() || undefined,
    };
    onSaveReport(updated);
    setSavedNotice(message);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleCopyMarkdown = () => {
    if (!selectedEmployee) return;
    const completedCount = empWeekTasks.filter((t) => t.status === 'completed').length;
    const avgPct =
      empWeekTasks.length > 0
        ? Math.round(empWeekTasks.reduce((s, t) => s + t.progress, 0) / empWeekTasks.length)
        : 0;

    const text = [
      `BÁO CÁO CÔNG VIỆC HÀNG TUẦN — ${activeWeek.code.toUpperCase()} (${activeWeek.dateRange})`,
      `Nhân sự: ${selectedEmployee.name} (${selectedEmployee.code}) · ${selectedEmployee.role} · Bộ phận ${selectedEmployee.department}`,
      `Tiến độ tuần: Hoàn thành ${completedCount}/${empWeekTasks.length} đầu việc (Đạt trung bình ${avgPct}%)`,
      '',
      '1. KẾT QUẢ ĐẠT ĐƯỢC TRONG TUẦN:',
      achievements,
      '',
      '2. VƯỚNG MẮC & ĐỀ XUẤT HỖ TRỢ:',
      blockers,
      '',
      '3. KẾ HOẠCH TRỌNG TÂM TUẦN TỚI:',
      nextWeekPlan,
      managerFeedback ? `\n4. NHẬN XÉT CỦA QUẢN LÝ:\n${managerFeedback}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const totalSubmittedOrApproved = weekReports.filter(
    (r) => r.status === 'submitted' || r.status === 'approved' || r.status === 'needs_revision'
  ).length;
  const totalApproved = weekReports.filter((r) => r.status === 'approved').length;
  const totalWeekTasks = weekTasks.length;
  const completedWeekTasks = weekTasks.filter((t) => t.status === 'completed').length;

  if (employees.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg p-10 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Chưa có báo cáo tuần nào
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Vui lòng thêm nhân viên ở mục "Tiến độ nhân sự" và giao việc để hệ thống tự động tổng hợp báo cáo.
        </p>
      </div>
    );
  }

  const empCompletedCount = empWeekTasks.filter((t) => t.status === 'completed').length;
  const empAvgProgress =
    empWeekTasks.length > 0
      ? Math.round(empWeekTasks.reduce((s, t) => s + t.progress, 0) / empWeekTasks.length)
      : 0;

  return (
    <div className="space-y-4 w-full">
      {/* Period Type Filter */}
      <div className="flex flex-wrap items-center gap-3 border border-slate-200 bg-white rounded-lg p-3">
        <span className="text-xs font-semibold text-slate-700">Chu kỳ báo cáo:</span>
        <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setReportPeriodType('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              reportPeriodType === 'daily'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ngày
          </button>
          <button
            type="button"
            onClick={() => setReportPeriodType('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              reportPeriodType === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => setReportPeriodType('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              reportPeriodType === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tháng
          </button>
        </div>
        <span className="text-[11px] text-slate-500">
          {reportPeriodType === 'daily' && '(Báo cáo công việc hàng ngày)'}
          {reportPeriodType === 'weekly' && '(Báo cáo công việc hàng tuần)'}
          {reportPeriodType === 'monthly' && '(Báo cáo công việc hàng tháng)'}
        </span>
      </div>

      {/* Top Concise Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white rounded-lg p-3.5 px-5">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div>
            Tỷ lệ báo cáo: <span className="font-semibold text-slate-900 font-mono-tabular">{totalSubmittedOrApproved}/{employees.length}</span> (Duyệt {totalApproved})
          </div>
          <span aria-hidden="true" className="text-slate-300">|</span>
          <div>
            Hoàn thành việc tuần: <span className="font-semibold text-slate-900 font-mono-tabular">{completedWeekTasks}/{totalWeekTasks}</span> ({totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0}%)
          </div>
        </div>

        <button
          type="button"
          onClick={() => exportWeeklySummaryCSV(activeWeek.code, employees, weekTasks, weekReports)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
          <span>Xuất CSV tổng hợp</span>
        </button>
      </div>

      {/* Simplified Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 bg-white rounded-lg overflow-hidden">
        {/* Left Roster List - Only show for Admin */}
        {!isEmployeeView && (
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-800">
                Nhân viên ({employees.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 flex-1">
              {employees.map((emp) => {
                const rep = weekReports.find((r) => r.employeeId === emp.id);
                const empTasks = weekTasks.filter((t) => t.assigneeId === emp.id);
                const done = empTasks.filter((t) => t.status === 'completed').length;
                const isSelected = emp.id === selectedEmployee?.id;

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.department} · {done}/{empTasks.length} việc xong
                      </div>
                    </div>

                    <span className={`text-[11px] shrink-0 ${rep ? REPORT_STATUS_META[rep.status].textClass : 'text-slate-400'}`}>
                      {rep ? REPORT_STATUS_META[rep.status].label : 'Chưa nộp'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Simplified Form Area */}
        {selectedEmployee && (
          <div className={`${isEmployeeView ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col`}>
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Báo cáo {reportPeriodType === 'daily' ? 'ngày' : reportPeriodType === 'weekly' ? 'tuần' : 'tháng'} {activeWeek.code} — {selectedEmployee.name}
                </h2>
                <span className={`text-xs ${currentReport ? REPORT_STATUS_META[currentReport.status].textClass : 'text-slate-500'}`}>
                  {currentReport ? REPORT_STATUS_META[currentReport.status].label : 'Chưa nộp'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillFromTasks}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  title="Tổng hợp tự động từ danh sách việc"
                >
                  <RefreshCw className="h-3 w-3 text-slate-500" />
                  <span>Tổng hợp tự động</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {copiedNotice ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
                  <span>{copiedNotice ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {savedNotice && (
              <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-800 font-medium">
                {savedNotice}
              </div>
            )}

            {/* Collapsible Tasks Quick-Reference */}
            <div className="border-b border-slate-200 bg-slate-50/30 px-5 py-2">
              <button
                type="button"
                onClick={() => setShowTaskTable((prev) => !prev)}
                className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900"
              >
                <span>
                  Đầu việc trong tuần ({empCompletedCount}/{empWeekTasks.length} xong · {empAvgProgress}%)
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-semibold">
                  {showTaskTable ? 'Thu gọn' : 'Xem danh sách việc'}
                  {showTaskTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showTaskTable && empWeekTasks.length > 0 && (
                <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg bg-white mb-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                        <th className="py-1.5 px-3">Mã</th>
                        <th className="py-1.5 px-3">Đầu việc</th>
                        <th className="py-1.5 px-3">Trạng thái</th>
                        <th className="py-1.5 px-3 text-right">Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empWeekTasks.map((t) => (
                        <tr key={t.id} onClick={() => onOpenTaskModal(t)} className="hover:bg-slate-50 cursor-pointer">
                          <td className="py-1.5 px-3 font-mono-tabular text-slate-500">{t.code}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-900">{t.title}</td>
                          <td className={`py-1.5 px-3 ${STATUS_META[t.status].textClass}`}>{STATUS_META[t.status].label}</td>
                          <td className="py-1.5 px-3 text-right font-mono-tabular">{t.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Simplified Form Section: Tab Navigation for light UI */}
            <div className="flex items-center border-b border-slate-200 bg-white px-5">
              <button
                type="button"
                onClick={() => setActiveFormTab('content')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeFormTab === 'content'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Nội dung báo cáo (Kết quả & Kế hoạch)
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('feedback')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeFormTab === 'feedback'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Nhận xét & Đánh giá Quản lý
              </button>
            </div>

            {/* Reduced Form Inputs */}
            <div className="p-5 space-y-3.5 flex-1 bg-white">
              {activeFormTab === 'content' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Kết quả công việc đã đạt được trong {reportPeriodType === 'daily' ? 'ngày' : reportPeriodType === 'weekly' ? 'tuần' : 'tháng'}
                    </label>
                    <textarea
                      rows={3}
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      placeholder={`Các công việc đã hoàn tất trong ${reportPeriodType === 'daily' ? 'ngày' : reportPeriodType === 'weekly' ? 'tuần' : 'tháng'}...`}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Vướng mắc & Khó khăn
                      </label>
                      <textarea
                        rows={2}
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                        placeholder="Nguyên nhân chậm (nếu có)..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Kế hoạch {reportPeriodType === 'daily' ? 'ngày' : reportPeriodType === 'weekly' ? 'tuần' : 'tháng'} tiếp theo
                      </label>
                      <textarea
                        rows={2}
                        value={nextWeekPlan}
                        onChange={(e) => setNextWeekPlan(e.target.value)}
                        placeholder={`Đầu việc trọng tâm ${reportPeriodType === 'daily' ? 'ngày' : reportPeriodType === 'weekly' ? 'tuần' : 'tháng'} tới...`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Ý kiến nhận xét & Hướng dẫn của Quản lý
                  </label>
                  <textarea
                    rows={4}
                    disabled={isEmployeeView}
                    value={managerFeedback}
                    onChange={(e) => setManagerFeedback(e.target.value)}
                    placeholder={
                      isEmployeeView
                        ? 'Chưa có ý kiến phản hồi từ Quản lý...'
                        : 'Ghi nhận kết quả hoặc góp ý hướng xử lý cho nhân sự...'
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>
              )}
            </div>

            {/* Bottom Action Buttons */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveWithStatus('draft', 'Đã lưu bản nháp.')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Lưu nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveWithStatus('submitted', 'Đã gửi báo cáo.')}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi báo cáo</span>
                </button>
              </div>

              {!isEmployeeView && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveWithStatus('needs_revision', 'Yêu cầu sửa báo cáo.')}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    Yêu cầu bổ sung
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveWithStatus('approved', 'Đã duyệt báo cáo.')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Duyệt báo cáo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
