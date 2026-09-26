import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  Umbrella,
  Megaphone,
  X,
  Thermometer,
  MapPin,
  Send,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface WeatherInfo {
  location: string;
  condition: 'rainy' | 'sunny' | 'cloudy' | 'stormy';
  temp: number;
  humidity: number;
  customNote: string;
}

interface WeatherReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherInfo: WeatherInfo;
  onSaveWeather: (
    updated: WeatherInfo,
    sendNotification: boolean
  ) => void;
}

const DEFAULT_PRESETS: Record<
  WeatherInfo['condition'],
  { label: string; icon: React.ReactNode; note: string; temp: number; humidity: number }
> = {
  rainy: {
    label: 'Mưa rào / Mưa to',
    icon: <CloudRain className="h-5 w-5 text-amber-500" />,
    note: 'Dự báo hôm nay có mưa rào. Nhắc nhở nhân viên mang theo ÁO MƯA, che chắn cẩn thận & trang bị bọc chống nước cho thiết bị/máy tính!',
    temp: 28,
    humidity: 85,
  },
  sunny: {
    label: 'Trời nắng gắt',
    icon: <Sun className="h-5 w-5 text-orange-500" />,
    note: 'Thời tiết nắng gắt (UV cao). Nhắc nhở nhân viên ĐỘI NÓN/MŨ BẢO HIỂM, mang khẩu trang, kính mát và bình nước cá nhân!',
    temp: 34,
    humidity: 65,
  },
  stormy: {
    label: 'Cảnh báo mưa bão',
    icon: <CloudLightning className="h-5 w-5 text-purple-600" />,
    note: 'Cảnh báo mưa bão giật mạnh: Nhân viên chú ý an toàn giao thông, tránh khu vực ngập úng & chằng buộc thiết bị ngoài trời!',
    temp: 26,
    humidity: 92,
  },
  cloudy: {
    label: 'Nhiều mây / Râm mát',
    icon: <CloudSun className="h-5 w-5 text-blue-500" />,
    note: 'Thời tiết râm mát, có mây. Nhắc nhở nhân viên chuẩn bị sẵn áo mưa dự phòng trong cốp xe phòng thời tiết thay đổi đột ngột.',
    temp: 30,
    humidity: 75,
  },
};

export const WeatherReminderModal: React.FC<WeatherReminderModalProps> = ({
  isOpen,
  onClose,
  weatherInfo,
  onSaveWeather,
}) => {
  const [location, setLocation] = useState(weatherInfo.location);
  const [condition, setCondition] = useState<WeatherInfo['condition']>(
    weatherInfo.condition
  );
  const [temp, setTemp] = useState(weatherInfo.temp);
  const [humidity, setHumidity] = useState(weatherInfo.humidity);
  const [customNote, setCustomNote] = useState(weatherInfo.customNote);
  const [sendNotification, setSendNotification] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLocation(weatherInfo.location || 'Mũi Né, Phan Thiết');
      setCondition(weatherInfo.condition || 'rainy');
      setTemp(weatherInfo.temp || 28);
      setHumidity(weatherInfo.humidity || 85);
      setCustomNote(weatherInfo.customNote || DEFAULT_PRESETS.rainy.note);
    }
  }, [isOpen, weatherInfo]);

  if (!isOpen) return null;

  const handleSelectCondition = (cond: WeatherInfo['condition']) => {
    setCondition(cond);
    const preset = DEFAULT_PRESETS[cond];
    setTemp(preset.temp);
    setHumidity(preset.humidity);
    setCustomNote(preset.note);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWeather(
      {
        location,
        condition,
        temp: Number(temp),
        humidity: Number(humidity),
        customNote: customNote.trim(),
      },
      sendNotification
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 font-bold">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Cập nhật Thời tiết & Nhắc nhở Nhân viên
              </h2>
              <p className="text-xs text-blue-100">
                Thông báo thời tiết Mũi Né & nhắc mang áo mưa / đội nón
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location & Temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khu vực
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Mũi Né"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhiệt độ (°C)
              </label>
              <div className="relative">
                <Thermometer className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min={10}
                  max={50}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Độ ẩm (%)
              </label>
              <input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min={0}
                max={100}
                required
              />
            </div>
          </div>

          {/* Condition Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Chọn tình trạng thời tiết hiện tại:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                Object.keys(DEFAULT_PRESETS) as Array<
                  WeatherInfo['condition']
                >
              ).map((key) => {
                const item = DEFAULT_PRESETS[key];
                const isSelected = condition === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectCondition(key)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 font-semibold text-blue-950'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{item.label}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">
                        {item.temp}°C · {item.humidity}% độ ẩm
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Safety Note Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nội dung nhắc nhở nhân viên:
              </label>
              <span className="text-[10px] text-blue-600 font-medium">
                Sẽ hiển thị ở banner & gửi thông báo
              </span>
            </div>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 leading-relaxed"
              placeholder="Nhập nội dung nhắc nhở nhân viên (ví dụ: Mang áo mưa, đội nón...)"
              required
            />
          </div>

          {/* Realtime Broadcast Checkbox */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="sendNotifCheck"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="sendNotifCheck" className="text-xs text-amber-900 cursor-pointer">
              <strong className="block font-semibold">
                Gửi thông báo Realtime tới toàn bộ nhân viên
              </strong>
              Gửi một popup thông báo nhắc nhở tức thì đến tài khoản của tất cả nhân viên trong hệ thống.
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              Lưu & Phát thông báo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
