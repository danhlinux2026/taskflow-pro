import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, X, Check, ExternalLink } from 'lucide-react';

// Custom red marker icon for Leaflet to avoid missing marker asset issues
const createCustomMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: #2563EB;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
        border: 2px solid white;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Preset locations for Mũi Né / Phan Thiết
const PRESET_LOCATIONS = [
  { name: 'Trung tâm Mũi Né', address: 'Đường Huỳnh Thúc Kháng, Mũi Né, Phan Thiết', lat: 10.9500, lng: 108.2833 },
  { name: 'Khu du lịch Hàm Tiến', address: 'Đường Nguyễn Đình Chiểu, Hàm Tiến, Mũi Né', lat: 10.9400, lng: 108.2100 },
  { name: 'Chợ Mũi Né', address: 'Chợ Mũi Né, Phường Mũi Né, Phan Thiết', lat: 10.9412, lng: 108.2890 },
  { name: 'Đồi Cát Mũi Né', address: 'Vòng xoay Đồi Cát Bay, Mũi Né, Phan Thiết', lat: 10.9580, lng: 108.3030 },
  { name: 'TP. Phan Thiết', address: 'Trung tâm TP. Phan Thiết, Bình Thuận', lat: 10.9272, lng: 108.1022 },
];

interface TaskLocationPickerProps {
  address: string;
  lat?: number;
  lng?: number;
  onChangeLocation: (location: { address: string; lat?: number; lng?: number }) => void;
  disabled?: boolean;
}

export const TaskLocationPicker: React.FC<TaskLocationPickerProps> = ({
  address,
  lat,
  lng,
  onChangeLocation,
  disabled = false,
}) => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [currentLat, setCurrentLat] = useState<number>(lat || 10.9500);
  const [currentLng, setCurrentLng] = useState<number>(lng || 108.2833);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Sync state when props change
  useEffect(() => {
    setCurrentAddress(address);
    if (lat && lng) {
      setCurrentLat(lat);
      setCurrentLng(lng);
    }
  }, [address, lat, lng]);

  // Initialize leaflet map when modal opens
  useEffect(() => {
    if (!isMapModalOpen || !mapContainerRef.current) return;

    // Small delay to ensure container is fully rendered in DOM
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = currentLat || 10.9500;
      const initialLng = currentLng || 108.2833;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        draggable: !disabled,
        icon: createCustomMarkerIcon(),
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (disabled) return;
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        marker.setLatLng([newLat, newLng]);

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        reverseGeocode(newLat, newLng);
      });

      // Handle marker drag
      marker.on('dragend', () => {
        if (disabled) return;
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);

        reverseGeocode(newLat, newLng);
      });

      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapModalOpen]);

  // Reverse geocoding helper
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setGeocodingError('');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi,en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const formatted = data.display_name.split(',').slice(0, 4).join(', ');
          setCurrentAddress(formatted);
        }
      }
    } catch {
      // Fallback silently if offline or blocked
    }
  };

  // Search address geocoding
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeocodingError('');
    try {
      const queryWithRegion = searchQuery.includes('Mũi Né') || searchQuery.includes('Phan Thiết')
        ? searchQuery
        : `${searchQuery}, Mũi Né, Phan Thiết, Bình Thuận`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithRegion)}&limit=1`,
        { headers: { 'Accept-Language': 'vi,en' } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          setCurrentLat(newLat);
          setCurrentLng(newLng);
          setCurrentAddress(data[0].display_name.split(',').slice(0, 4).join(', '));

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newLat, newLng], 15);
          }
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          }
        } else {
          setGeocodingError('Không tìm thấy địa điểm trên bản đồ. Bạn có thể chọn trực tiếp bằng cách bấm vào bản đồ.');
        }
      }
    } catch {
      setGeocodingError('Lỗi kết nối tra cứu bản đồ.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select preset
  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setCurrentAddress(preset.address);
    setCurrentLat(preset.lat);
    setCurrentLng(preset.lng);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([preset.lat, preset.lng], 15);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }
  };

  // Save selected location back to form
  const handleConfirmLocation = () => {
    onChangeLocation({
      address: currentAddress.trim(),
      lat: currentLat,
      lng: currentLng,
    });
    setIsMapModalOpen(false);
  };

  // Clear address
  const handleClearLocation = () => {
    setCurrentAddress('');
    onChangeLocation({ address: '', lat: undefined, lng: undefined });
  };

  const googleMapsUrl = currentLat && currentLng
    ? `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span>Địa chỉ / Vị trí thi công</span>
          <span className="text-slate-400 font-normal">(Admin có thể thêm hoặc bỏ qua)</span>
        </label>
        {address && (
          <button
            type="button"
            onClick={handleClearLocation}
            disabled={disabled}
            className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors"
          >
            Xóa địa chỉ
          </button>
        )}
      </div>

      {/* Address Input & Map Picker Trigger */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            disabled={disabled}
            value={address}
            onChange={(e) => onChangeLocation({ address: e.target.value, lat, lng })}
            placeholder="VD: 123 Nguyễn Đình Chiểu, Mũi Né (Hoặc bỏ qua)"
            className="w-full rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
          />
          <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={() => setIsMapModalOpen(true)}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>Chọn bản đồ</span>
        </button>
      </div>

      {/* Direct Google Maps Link Preview if Location Exists */}
      {address && (
        <div className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11px]">
          <span className="text-slate-600 truncate max-w-[240px]">
            📍 {address} {lat && lng ? `(${lat}, ${lng})` : ''}
          </span>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline shrink-0"
            >
              <span>Mở Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* MAP MODAL */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="relative flex w-full max-w-2xl flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Chọn địa điểm trên bản đồ</h3>
                  <p className="text-[11px] text-slate-500">Chạm hoặc di chuyển ghim để chọn vị trí chính xác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-3 space-y-3 overflow-y-auto max-h-[78vh]">
              {/* Preset buttons */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  📍 Gợi ý nhanh khu vực Mũi Né / Phan Thiết:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LOCATIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 text-xs rounded-full border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input inside modal */}
              <form onSubmit={handleSearchAddress} className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm địa chỉ (VD: Resort Pandanus, Chợ Mũi Né...)"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
              </form>

              {geocodingError && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {geocodingError}
                </div>
              )}

              {/* Map Canvas */}
              <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full z-0" />
              </div>

              {/* Selected Address Display & Manual Edit */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tên / Địa chỉ hiển thị:
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Nhập địa chỉ cụ thể..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-tabular">
                  <span>Vĩ độ (Lat): {currentLat.toFixed(6)}</span>
                  <span>Kinh độ (Lng): {currentLng.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Xác nhận vị trí này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
