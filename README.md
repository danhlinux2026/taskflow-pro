# 🖥️ MÁY TÍNH MŨI NÉ — TaskFlow Pro

Hệ thống Điều hành & Quản lý Công việc (PWA) cho đội ngũ Máy Tính Mũi Né — giao việc, theo dõi tiến độ, chấm công, báo cáo tuần và nhắc nhở thời tiết, đồng bộ realtime qua Firebase Firestore.

---

## ✨ Chức năng chính

| Chức năng | Mô tả |
|---|---|
| 📋 **Quản lý công việc** | Tạo / sửa / xóa task: mã, hạn chót, mức ưu tiên, giá (VND), địa chỉ thực hiện kèm **bản đồ Leaflet**, subtasks, ghi chú blocker. Xem dạng **Bảng** hoặc **Kanban Board**. |
| 👥 **Giao việc & Trạng thái** | Giao task cho nhân viên, cập nhật trạng thái (`todo → in_progress → blocked → completed`), % tiến độ, giờ đã làm. Tự động tạo thông báo khi task hoàn thành. |
| 📊 **Tiến độ đội** | Tab *Tiến độ*: tổng quan tải công việc theo nhân viên (so với công suất giờ/tuần), filter theo tuần (W38–W40, 2026). |
| 📝 **Báo cáo tuần** | Nhân viên nộp báo cáo (kết quả / vướng mắc / kế hoạch tuần sau), Admin duyệt hoặc yêu cầu chỉnh sửa, kèm phản hồi. |
| 🔔 **Thông báo & Nhật ký** | Thông báo realtime (hoàn thành task, thời tiết) + log toàn bộ hành động (tạo / sửa / xóa / đổi trạng thái / tiến độ) theo từng task. |
| 🌦️ **Nhắc thời tiết** | Admin cập nhật thời tiết Mũi Né, gửi nhắc nhở nhân viên mang áo mưa / đội nón (modal nhắc trong app). |
| 👤 **Tài khoản & Quyền** | 2 vai trò: **Admin** (toàn quyền, tạo/xóa tài khoản) và **Nhân viên** (chỉ làm việc task được giao). Login qua username/password, hoặc Firebase Auth. |
| 📱 **PWA** | Cài lên màn hình chính (Home Screen), hoạt động offline (service worker), icon 192/512. |
| ☁️ **Realtime (Firestore)** | Mọi thay đổi đồng bộ tức thời giữa các thiết bị; 6 collection: `tasks`, `employees`, `userAccounts`, `weeklyReports`, `notifications`, `activityLogs`. |
| ⬇️ **Xuất CSV** | Xuất tổng kết tuần (weekly summary CSV) để làm báo cáo. |

## 🧭 Hướng dẫn sử dụng

### 1. Đăng nhập & Chọn tuần
1. Mở app → nhập username/password → **Đăng nhập**.
2. Trên thanh điều hướng (tabs): **Nhiệm vụ · Tiến độ · Báo cáo · Tổng quan · Lịch sử**.
3. Chọn tuần (W38 / W39 / W40) — tuần hiện tại được đánh dấu.

### 2. Tab *Nhiệm vụ* (Admin + Nhân viên)
- **Tạo công việc** (nút + góc trái): nhập tiêu đề, người thực hiện, hạn chót, giá, địa chỉ (có thể chọn vị trí trên bản đồ), subtasks.
- **Xem bảng / Kanban**: chuyển qua lại bằng nút *Bảng / Board*.
- **Tìm kiếm & Lọc**: ô tìm (theo mã / tiêu đề / nhân viên), lọc theo trạng thái, ưu tiên, người thực hiện, tuần.
- **Chi tiết task** (bấm vào task): drawer hiển thị đầy đủ thông tin, tiến độ, giờ đã làm, subtasks; ở đó có:
  - *Cập nhật tiến độ / trạng thái* (nhân viên làm),
  - *Sửa / Xóa* (chỉ Admin xóa),
  - *Nhật ký thao tác* của task.
- **Hoàn thành task** → hệ thống tự tạo thông báo + ghi log + (tùy thiết lập) báo cho admin khi có task kế tiếp.

### 3. Tab *Tiến độ* (Admin)
- Theo dõi % hoàn thành, số giờ đã làm vs công suất tuần của từng nhân viên.
- Nhận diện người quá tải / nhàn việc để điều giao.

### 4. Tab *Báo cáo* (Admin & Nhân viên)
- **Nhân viên**: mở báo cáo tuần hiện tại → ghi *Kết quả / Vướng mắc / Kế hoạch tuần sau* → **Gửi báo cáo**.
- **Admin**: xem danh sách báo cáo (`draft / submitted / approved / needs_revision`) → *Duyệt* hoặc *Yêu cầu chỉnh sửa*, kèm phản hồi.

### 5. Tab *Tổng quan* (Admin)
- Thống kê nhanh: tổng task theo trạng thái, % hoàn thành, giờ đã làm, giá trị công việc (VND), nhân viên có task tới hạn.

### 6. Tab *Lịch sử* (Admin)
- Nhật ký toàn bộ hành động theo task (ai, thao tác gì, nội dung, thời gian) — tra soát / audit.

### 7. Thanh công cụ (Header)
| Nút | Quyền | Chức năng |
|---|---|---|
| 🔍 Tìm kiếm | Cả hai | Tìm nhanh task |
| 🔔 Thông báo | Cả hai | Xem thông báo (task hoàn thành, thời tiết) |
| 📞 Cấp tài khoản (UserPlus) | Admin | Tạo username/password cho nhân viên |
| 📊 Tiến độ / Báo cáo | Admin | Mở các tab tương ứng |
| 🗺️ / ⚠️ Thời tiết | Admin | Cập nhật tình hình thời tiết Mũi Né + nhắc nhân viên mang áo mưa/đội nón (modal tự hiển thị theo điều kiện) |
| 🔄 Đổi tài khoản / Đăng xuất | Cả hai | Đổi vai trò / thoát |

### 8. Cài PWA lên điện thoại
- **Android (Chrome)**: Menu ⋮ → *Thêm vào màn hình chính / Cài đặt ứng dụng* (hoặc bấm nút **Cài đặt PWA** trong app).
- **iOS (Safari)**: Chia sẻ → *Thêm vào màn hình chủ*.
- App chạy offline (shell đã cache), online lại thì đồng bộ Firestore.

### 9. Nhân viên
- Chỉ thấy task được giao cho mình + các tab *Nhiệm vụ / Báo cáo / Lịch sử* (theo cấu hình quyền).
- Cập nhật % tiến độ, ghi chú blocker, báo cáo tuần.

---

## 🏗️ Cấu trúc mã nguồn

```
src/
├── App.tsx                    # UI chính (~1.400 dòng): tabs, lọc, drawer, logics hành động
├── types.ts                   # Loại Task / Employee / User / Report / Notification / Log
├── firebase.ts                # Khởi tạo Firebase, subscribe + CRUD 6 collection
├── main.tsx / index.css       # Entry + Tailwind CSS 4
├── data/initialData.ts        # Dữ liệu mẫu: 3 tuần (W38–W40/2026), list trống (dùng Firestore)
├── utils/formatters.ts        # Định dạng ngày VN, tiền VND, xuất CSV, metadata trạng thái
└── components/
    ├── TaskDrawerModal.tsx    # Drawer chi tiết task (sửa, tiến độ, subtasks, log)
    ├── TaskLocationPicker.tsx # Chọn toạ độ trên bản đồ Leaflet
    ├── WeeklyReportView.tsx   # Form & danh sách báo cáo tuần
    ├── TeamProgressView.tsx   # Tiến độ đội
    ├── ActivityLogModal/View  # Nhật ký thao tác
    ├── NotificationPopover.tsx# Chuông thông báo
    ├── WeatherReminderModal.tsx# Nhắc thời tiết Mũi Né
    ├── LoginPage/LoginModal.tsx# Đăng nhập
    ├── AccountManagementModal.tsx# Admin tạo/sửa/xóa tài khoản
    └── InstallPWAButton.tsx   # Nút "Thêm vào màn hình"
public/
├── manifest.json, sw.js       # PWA: manifest + service worker (cache taskflow-pro-v2)
└── icon-192.png / icon-512.png
```

**Stack:** Vite 8 · React 19 · TypeScript 7 · Tailwind CSS 4 · Firebase 12 (Auth + Firestore) · Leaflet 1.9 · lucide-react · motion.

**Deploy:** Railway (build tĩnh, `vite preview`), PWA. Cấu hình `.npmrc` (legacy-peer-deps cho esbuild) và `.env.production` đã xử lý các lỗi deploy trước đó.

---

## 📝 Ghi chú
- Tuần dữ liệu mẫu: **W38 (14–20/09/2026) · W39 (21–27/09, hiện tại) · W40 (28/09–04/10/2026)**.
- Giá & ngày giờ hiển thị theo định dạng **Việt Nam** (VD: `1.250.000₫`).
- Mọi thao tác đều có *audit log* — xem ở tab **Lịch sử**.
