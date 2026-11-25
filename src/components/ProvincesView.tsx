import React, {useMemo, useState} from 'react';
import {Check, LocateFixed, Search, Star} from 'lucide-react';
import type {Province, TurkishRegion} from '../types/app';
import {
  TURKISH_PROVINCES,
  TURKISH_REGIONS,
  formatPlaka,
  normalizeTurkishText,
} from '../data/turkishProvinces';
import {PRAYER_LABELS, formatTimeTR, getActivePrayerState, getDailyPrayerSchedule} from '../utils/prayerTimes';

interface ProvincesViewProps {
  now: Date;
  selectedPlaka: number;
  favoritePlakas: number[];
  onSelectProvince: (plaka: number) => void;
  onToggleFavorite: (plaka: number) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  locationMessage: string | null;
}

export const ProvincesView: React.FC<ProvincesViewProps> = ({
  now,
  selectedPlaka,
  favoritePlakas,
  onSelectProvince,
  onToggleFavorite,
  onDetectLocation,
  isDetectingLocation,
  locationMessage,
}) => {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'Tümü' | TurkishRegion>('Tümü');

  const filteredProvinces = useMemo(() => {
    const normQuery = normalizeTurkishText(query);
    return TURKISH_PROVINCES.filter((p) => {
      if (regionFilter !== 'Tümü' && p.region !== regionFilter) return false;
      if (!normQuery) return true;
      const matchName = normalizeTurkishText(p.name).includes(normQuery);
      const matchPlaka = formatPlaka(p.plaka).includes(normQuery) || String(p.plaka) === normQuery;
      return matchName || matchPlaka;
    });
  }, [query, regionFilter]);

  const favoriteProvinces = useMemo(
    () => TURKISH_PROVINCES.filter((p) => favoritePlakas.includes(p.plaka)),
    [favoritePlakas],
  );

  // Precompute schedules for currently visible provinces for fast rendering
  const visibleSummaries = useMemo(() => {
    const map = new Map<number, {fajr: string; dhuhr: string; maghrib: string; activeLabel: string; exitTime: string}>();
    const listToCompute = new Set<Province>([...filteredProvinces, ...favoriteProvinces]);
    listToCompute.forEach((p) => {
      const sched = getDailyPrayerSchedule(p.lat, p.lng, now);
      const active = getActivePrayerState(p.lat, p.lng, now, 5);
      map.set(p.plaka, {
        fajr: formatTimeTR(sched.times.fajr),
        dhuhr: formatTimeTR(sched.times.dhuhr),
        maghrib: formatTimeTR(sched.times.maghrib),
        activeLabel: active.activePrayer ? PRAYER_LABELS[active.activePrayer].name.split(' ')[0] : 'Kuşluk',
        exitTime: formatTimeTR(active.activeExitTime ?? active.nextEnterTime),
      });
    });
    return map;
  }, [filteredProvinces, favoriteProvinces, now]);

  const renderProvinceCard = (province: Province) => {
    const isSelected = province.plaka === selectedPlaka;
    const isFav = favoritePlakas.includes(province.plaka);
    const summary = visibleSummaries.get(province.plaka);

    return (
      <div
        key={province.plaka}
        className={`group rounded-2xl border p-4 transition-colors ${
          isSelected
            ? 'border-[#0E6B4E] bg-[#0E6B4E]/8 dark:border-[#2BB686] dark:bg-[#2BB686]/12'
            : 'border-[#E4E7E3] bg-white hover:border-[#C5CEC3] dark:border-[#232E27] dark:bg-[#151C18] dark:hover:border-[#34433A]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectProvince(province.plaka)}
            className="flex-1 text-left min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-xs font-semibold text-[#525C54] dark:text-[#A0ABA3]">
                {formatPlaka(province.plaka)}
              </span>
              <span className="text-base font-bold text-[#121914] dark:text-[#F1F5F2] truncate">
                {province.name}
              </span>
              {isSelected && (
                <Check className="h-4 w-4 text-[#0E6B4E] dark:text-[#2BB686] shrink-0" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#525C54] dark:text-[#A0ABA3]">
              {province.region} · {summary?.activeLabel} (Çıkış {summary?.exitTime})
            </p>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(province.plaka)}
            aria-label={isFav ? `${province.name} favorilerden çıkar` : `${province.name} favorilere ekle`}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#525C54] hover:bg-[#EFF2EE] dark:text-[#A0ABA3] dark:hover:bg-[#1E2822] cursor-pointer shrink-0"
          >
            <Star
              className={`h-4 w-4 ${
                isFav
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-[#838D85] dark:text-[#66736A]'
              }`}
            />
          </button>
        </div>

        {summary && (
          <button
            type="button"
            onClick={() => onSelectProvince(province.plaka)}
            className="mt-3 w-full pt-3 border-t border-[#EFF2EE] dark:border-[#232E27] grid grid-cols-3 gap-2 text-left cursor-pointer"
          >
            <div>
              <span className="block text-[11px] text-[#525C54] dark:text-[#A0ABA3]">İmsak</span>
              <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                {summary.fajr}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#525C54] dark:text-[#A0ABA3]">Öğle</span>
              <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                {summary.dhuhr}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#525C54] dark:text-[#A0ABA3]">Akşam</span>
              <span className="font-mono-tabular text-xs sm:text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                {summary.maghrib}
              </span>
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search + GPS Header */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#121914] dark:text-[#F1F5F2]">
              81 İl Namaz Vakitleri
            </h1>
            <p className="mt-1 text-sm text-[#525C54] dark:text-[#A0ABA3]">
              İl adı veya plaka kodu ile arayın, favorilerinize ekleyin ya da konumunuzla otomatik seçin.
            </p>
          </div>
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isDetectingLocation}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E6B4E] hover:bg-[#0B573F] dark:bg-[#2BB686] dark:hover:bg-[#249E74] text-white dark:text-[#081C15] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <LocateFixed className={`h-4 w-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Konum Alınıyor...' : 'Konumumla Şehri Bul'}</span>
          </button>
        </div>

        {locationMessage && (
          <p className="mt-3 text-xs sm:text-sm font-medium text-[#0E6B4E] dark:text-[#2BB686]">
            {locationMessage}
          </p>
        )}

        {/* Search input */}
        <div className="mt-4 relative">
          <Search className="h-4 w-4 text-[#525C54] dark:text-[#A0ABA3] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İl ara (ör. İstanbul, Ankara, 06, Şanlıurfa)..."
            aria-label="İl veya plaka ara"
            className="w-full min-h-[46px] pl-11 pr-4 rounded-xl border border-[#E4E7E3] dark:border-[#232E27] bg-[#F6F7F5] dark:bg-[#0D120F] text-sm text-[#121914] dark:text-[#F1F5F2] placeholder:text-[#78827A] focus:outline-none focus:ring-2 focus:ring-[#0E6B4E] dark:focus:ring-[#2BB686]"
          />
        </div>

        {/* Region filter segmented tabs */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['Tümü', ...TURKISH_REGIONS] as const).map((region) => {
            const active = regionFilter === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => setRegionFilter(region)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#121914] text-white dark:bg-[#F1F5F2] dark:text-[#121914]'
                    : 'bg-[#EFF2EE] text-[#525C54] hover:text-[#121914] dark:bg-[#0D120F] dark:text-[#A0ABA3] dark:hover:text-[#F1F5F2]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </section>

      {/* Favorites section */}
      {favoriteProvinces.length > 0 && !query && regionFilter === 'Tümü' && (
        <section aria-label="Favori iller">
          <h2 className="text-sm font-bold text-[#525C54] dark:text-[#A0ABA3] mb-3">
            Favori İller ({favoriteProvinces.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favoriteProvinces.map(renderProvinceCard)}
          </div>
        </section>
      )}

      {/* All filtered provinces */}
      <section aria-label="Tüm iller">
        <h2 className="text-sm font-bold text-[#525C54] dark:text-[#A0ABA3] mb-3">
          {regionFilter === 'Tümü' ? 'Tüm İller' : regionFilter} ({filteredProvinces.length})
        </h2>

        {filteredProvinces.length === 0 ? (
          <div className="rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-8 text-center">
            <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
              Aramanızla eşleşen il bulunamadı.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRegionFilter('Tümü');
              }}
              className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#EFF2EE] dark:bg-[#1E2822] text-xs font-semibold text-[#121914] dark:text-[#F1F5F2] cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProvinces.map(renderProvinceCard)}
          </div>
        )}
      </section>
    </div>
  );
};
