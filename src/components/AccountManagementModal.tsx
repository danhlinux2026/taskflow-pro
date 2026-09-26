import React, { useState } from 'react';
import { X, UserPlus, Key, ShieldCheck, Check, Trash2, Copy, RefreshCw, UserCheck, Pencil, Save, AlertTriangle } from 'lucide-react';
import { Employee, UserAccount } from '../types';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  accounts: UserAccount[];
  onAddEmployeeAndAccount: (emp: Employee, acc: UserAccount) => void;
  onUpdateAccount: (acc: UserAccount) => void;
  onUpdateEmployeeAndAccount?: (emp: Employee, acc: UserAccount) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  employees,
  accounts,
  onAddEmployeeAndAccount,
  onUpdateAccount,
  onUpdateEmployeeAndAccount,
  onDeleteAccount,
}) => {
  const [empName, setEmpName] = useState('');
  const [department, setDepartment] = useState('Kỹ thuật');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');

  const [copiedAccId, setCopiedAccId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // EDITING EMPLOYEE & ACCOUNT STATE
  const [deletingAccountTarget, setDeletingAccountTarget] = useState<UserAccount | null>(null);
  const [editingTarget, setEditingTarget] = useState<{
    emp: Employee;
    acc?: UserAccount;
  } | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('Kỹ thuật');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');

  if (!isOpen) return null;

  const isUsernameTaken = (uname: string) => {
    if (!uname.trim()) return false;
    return accounts.some(
      (a) => a.username.trim().toLowerCase() === uname.trim().toLowerCase()
    );
  };

  const isCurrentUsernameTaken = isUsernameTaken(username);

  const generateUniqueUsername = (basePrefix: string = 'nv0') => {
    let index = employees.length + 1;
    let candidate = `${basePrefix}${index}`.toLowerCase();
    while (
      accounts.some(
        (a) => a.username.trim().toLowerCase() === candidate
      )
    ) {
      index++;
      candidate = `${basePrefix}${index}`.toLowerCase();
    }
    return candidate;
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    if (!empName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên nhân viên.');
      return;
    }

    const inputUsername = username.trim().toLowerCase();
    let finalUsername = '';

    if (inputUsername) {
      if (isUsernameTaken(inputUsername)) {
        setErrorMsg(
          `Tên đăng nhập "${inputUsername}" đã tồn tại trên hệ thống. Vui lòng chọn tên đăng nhập khác!`
        );
        return;
      }
      finalUsername = inputUsername;
    } else {
      finalUsername = generateUniqueUsername('nv0');
    }

    const empId = `emp-${Date.now()}`;
    const words = empName.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
        : empName.trim().slice(0, 2).toUpperCase();

    const newEmp: Employee = {
      id: empId,
      code: `NV-0${employees.length + 1}`,
      name: empName.trim(),
      role: 'Chuyên viên',
      department,
      email: `${finalUsername}@company.com`,
      initials,
      weeklyCapacityHours: 40,
    };

    const newAcc: UserAccount = {
      id: `acc-${Date.now()}`,
      username: finalUsername,
      password: password.trim() || '123456',
      role: 'employee',
      employeeId: empId,
      name: empName.trim(),
      email: newEmp.email,
      createdAt: new Date().toISOString(),
    };

    onAddEmployeeAndAccount(newEmp, newAcc);

    setEmpName('');
    setUsername('');
    setPassword('123456');
    setErrorMsg('');
    setMsg(`Đã tạo tài khoản cho ${newEmp.name} (Tên đăng nhập: ${finalUsername})`);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleCreateForExistingEmp = (emp: Employee) => {
    setErrorMsg('');
    setMsg('');
    const baseUsername = emp.code.toLowerCase().replace('-', '');
    let finalUsername = baseUsername;
    let counter = 1;
    while (
      accounts.some(
        (a) => a.username.trim().toLowerCase() === finalUsername
      )
    ) {
      counter++;
      finalUsername = `${baseUsername}_${counter}`;
    }

    const defaultPass = '123456';

    const newAcc: UserAccount = {
      id: `acc-${Date.now()}`,
      username: finalUsername,
      password: defaultPass,
      role: 'employee',
      employeeId: emp.id,
      name: emp.name,
      email: emp.email,
      createdAt: new Date().toISOString(),
    };

    onUpdateAccount(newAcc);
    setMsg(`Đã cấp tài khoản cho ${emp.name} (Tên đăng nhập: ${finalUsername})`);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `Tài khoản Nhân viên:\nTên đăng nhập: ${acc.username}\nMật khẩu: ${acc.password}\nHọ tên: ${acc.name}`;
    navigator.clipboard.writeText(text);
    setCopiedAccId(acc.id);
    setTimeout(() => setCopiedAccId(null), 2500);
  };

  // EDITING EMPLOYEE & ACCOUNT HANDLERS
  const handleStartEdit = (emp: Employee, acc?: UserAccount) => {
    setEditingTarget({ emp, acc });
    setEditName(emp.name);
    setEditDepartment(emp.department || 'Kỹ thuật');
    setEditUsername(
      acc ? acc.username : emp.code.toLowerCase().replace('-', '')
    );
    setEditPassword(acc ? acc.password : '123456');
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editingTarget) return;

    if (!editName.trim()) {
      setEditError('Họ tên không được để trống.');
      return;
    }

    const trimmedUsername = editUsername.trim().toLowerCase();
    if (!trimmedUsername) {
      setEditError('Tên đăng nhập không được để trống.');
      return;
    }

    // Check duplicate username against other accounts
    const isDuplicate = accounts.some(
      (a) =>
        a.id !== editingTarget.acc?.id &&
        a.username.trim().toLowerCase() === trimmedUsername
    );
    if (isDuplicate) {
      setEditError(
        `Tên đăng nhập "${trimmedUsername}" đã tồn tại trên hệ thống. Vui lòng chọn tên đăng nhập khác!`
      );
      return;
    }

    const words = editName.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
        : editName.trim().slice(0, 2).toUpperCase();

    const updatedEmp: Employee = {
      ...editingTarget.emp,
      name: editName.trim(),
      department: editDepartment,
      initials,
      email: `${trimmedUsername}@company.com`,
    };

    const updatedAcc: UserAccount = {
      id: editingTarget.acc?.id || `acc-${Date.now()}`,
      username: trimmedUsername,
      password: editPassword.trim() || '123456',
      role: 'employee',
      employeeId: editingTarget.emp.id,
      name: editName.trim(),
      email: updatedEmp.email,
      createdAt: editingTarget.acc?.createdAt || new Date().toISOString(),
    };

    if (onUpdateEmployeeAndAccount) {
      onUpdateEmployeeAndAccount(updatedEmp, updatedAcc);
    } else {
      onUpdateAccount(updatedAcc);
    }

    setMsg(`Đã cập nhật họ tên & mật khẩu cho ${updatedEmp.name}`);
    setEditingTarget(null);
    setTimeout(() => setMsg(''), 5000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="relative flex w-full max-w-xl flex-col bg-white rounded-t-2xl sm:rounded-xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Mobile Drag Handle Bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Quản lý & Cấp tài khoản Nhân viên
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

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-800 font-medium">
              {errorMsg}
            </div>
          )}
          {msg && (
            <div className="border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 font-medium">
              {msg}
            </div>
          )}

          {/* Form to Add Employee + Account */}
          <form
            onSubmit={handleCreateNew}
            className="border border-slate-200 bg-slate-50/50 rounded-lg p-3.5 space-y-3"
          >
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
              <span>Tạo nhân sự mới & Cấp tài khoản ngay</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Họ tên nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Bộ phận
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Kỹ thuật">Kỹ thuật</option>
                  <option value="Sản phẩm">Sản phẩm</option>
                  <option value="Vận hành">Vận hành</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Tài chính">Tài chính</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Để trống sẽ tự tạo..."
                  className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs font-mono-tabular focus:outline-none ${
                    isCurrentUsernameTaken
                      ? 'border-red-500 text-red-600 focus:border-red-600 ring-1 ring-red-500/20'
                      : 'border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
                {isCurrentUsernameTaken && (
                  <p className="text-[10px] text-red-600 font-medium mt-1">
                    ⚠️ Tên đăng nhập này đã có người dùng!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono-tabular text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              + Tạo nhân sự & Cấp tài khoản
            </button>
          </form>

          {/* List of Employees and Accounts */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-800">
              Danh sách tài khoản đã cấp ({accounts.filter((a) => a.role === 'employee').length})
            </h3>

            <div className="divide-y divide-slate-200 border border-slate-200 bg-white rounded-lg overflow-hidden">
              {employees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Chưa có nhân sự nào. Sử dụng biểu mẫu ở trên để thêm nhân sự.
                </div>
              ) : (
                employees.map((emp) => {
                  const acc = accounts.find((a) => a.employeeId === emp.id);

                  return (
                    <div key={emp.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{emp.name}</span>
                          <span className="text-[11px] font-mono-tabular text-slate-400">({emp.code})</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {emp.department}
                          </span>
                        </div>

                        {acc ? (
                          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                            <span>
                              Tên đăng nhập: <strong className="text-slate-900 font-mono-tabular">{acc.username}</strong>
                            </span>
                            <span>
                              Mật khẩu: <strong className="text-slate-900 font-mono-tabular">{acc.password}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                            Chưa có tài khoản đăng nhập
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(emp, acc)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Sửa họ tên, bộ phận, tên đăng nhập & mật khẩu"
                        >
                          <Pencil className="h-3 w-3 text-blue-600" />
                          <span>Sửa</span>
                        </button>

                        {acc ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(acc)}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                              title="Sao chép thông tin tài khoản"
                            >
                              {copiedAccId === acc.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-500" />
                              )}
                              <span>{copiedAccId === acc.id ? 'Đã chép' : 'Sao chép'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingAccountTarget(acc)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Xóa / Thu hồi tài khoản"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateForExistingEmp(emp)}
                            className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                          >
                            + Cấp tài khoản
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

      {/* EDIT EMPLOYEE & ACCOUNT OVERLAY MODAL */}
      {editingTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold">Chỉnh sửa Nhân sự & Mật khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-3.5">
              {editError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Họ và tên nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="Nhập họ tên nhân viên..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bộ phận
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Kỹ thuật">Kỹ thuật</option>
                  <option value="Sản phẩm">Sản phẩm</option>
                  <option value="Vận hành">Vận hành</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Tài chính">Tài chính</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono-tabular text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono-tabular text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {deletingAccountTarget && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận xóa tài khoản?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản của{' '}
                <strong className="text-slate-900">{deletingAccountTarget.name}</strong> (Tên đăng nhập:{' '}
                <span className="font-mono text-blue-700 font-semibold">{deletingAccountTarget.username}</span>)? Hành động này sẽ thu hồi quyền truy cập và không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingAccountTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(deletingAccountTarget.id);
                  setMsg(`Đã xóa tài khoản của ${deletingAccountTarget.name}`);
                  setDeletingAccountTarget(null);
                  setTimeout(() => setMsg(''), 4000);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
