import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Key, LogIn, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { Employee, UserAccount } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  employees: Employee[];
  currentUser: UserAccount;
  onSelectAccount: (acc: UserAccount) => void;
  onOpenAccountManagement: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  accounts,
  employees,
  currentUser,
  onSelectAccount,
  onOpenAccountManagement,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const found = accounts.find(
      (a) =>
        a.username.toLowerCase() === usernameInput.trim().toLowerCase() &&
        a.password === passwordInput.trim()
    );

    if (found) {
      onSelectAccount(found);
      setUsernameInput('');
      setPasswordInput('');
      onClose();
    } else {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  const adminAccount = accounts.find((a) => a.role === 'admin') || {
    id: 'admin-default',
    username: 'admin',
    password: '123',
    role: 'admin',
    name: 'Quản trị viên (Admin)',
    email: 'admin@company.com',
    createdAt: new Date().toISOString(),
  };

  const employeeAccounts = accounts.filter((a) => a.role === 'employee');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="relative flex w-full max-w-lg flex-col bg-white rounded-t-2xl sm:rounded-xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Mobile Drag Handle Bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Đăng nhập / Chuyển đổi tài khoản
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

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active User Badge */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500">Đang đăng nhập: </span>
              <span className="font-semibold text-slate-900">{currentUser.name}</span>
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Admin (Quản lý)
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3 w-3" /> Nhân viên
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-3 border-b border-slate-200 pb-4">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Đăng nhập bằng tài khoản được cấp
            </h3>

            {errorMsg && (
              <div className="border-l-2 border-red-600 bg-red-50 p-2 text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin hoặc nv01..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Mật khẩu..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Đăng nhập hệ thống</span>
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Chuyển nhanh tài khoản (Thử nghiệm)
              </h3>

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAccountManagement();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Cấp tài khoản mới</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => {
                  onSelectAccount(adminAccount);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                  currentUser.role === 'admin'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Tài khoản Quản lý (Admin)</span>
                      <span className="text-[10px] font-mono-tabular bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        {adminAccount.username} / {adminAccount.password}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Toàn quyền giao việc, quản lý nhân sự & xem tất cả tiến độ
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-blue-600 shrink-0">
                  {currentUser.role === 'admin' ? 'Đang chọn' : 'Chuyển sang →'}
                </div>
              </button>

              {/* Employee Accounts */}
              {employeeAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-500 space-y-1">
                  <p>Chưa có tài khoản nhân viên nào được Admin cấp.</p>
                  {currentUser.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAccountManagement();
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      + Bấm vào đây để tạo tài khoản nhân viên
                    </button>
                  ) : (
                    <p className="text-[11px]">Vui lòng nhờ Admin cấp tài khoản cho bạn.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Tài khoản Nhân viên ({employeeAccounts.length}):
                  </div>
                  {employeeAccounts.map((acc) => {
                    const emp = employees.find((e) => e.id === acc.employeeId);
                    const isCurrentAcc = currentUser.id === acc.id;

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          onSelectAccount(acc);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                          isCurrentAcc
                            ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20 font-semibold'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-200 text-xs font-semibold text-slate-700 font-mono-tabular shrink-0">
                            {emp?.initials || 'NV'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-900 truncate flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              <span className="text-[10px] font-mono-tabular text-slate-400">
                                ({acc.username})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              Mật khẩu: <span className="font-mono-tabular">{acc.password}</span> · {emp?.department || 'Nhân sự'}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-blue-600 font-medium shrink-0 ml-2">
                          {isCurrentAcc ? 'Đang chọn' : 'Đăng nhập →'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
          <span>Quyền hạn sẽ tự động cập nhật theo tài khoản được chọn.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
