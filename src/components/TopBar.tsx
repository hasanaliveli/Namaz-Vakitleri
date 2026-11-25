import React from 'react';
import {MapPin} from 'lucide-react';
import type {AppTab, Province} from '../types/app';
import {formatPlaka} from '../data/turkishProvinces';

interface TopBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  selectedProvince: Province;
  onOpenProvincePicker: () => void;
}

const NAV_ITEMS: {id: AppTab; label: string}[] = [
  {id: 'today', label: 'Vakitler'},
  {id: 'provinces', label: 'İller'},
  {id: 'alerts', label: 'Uyarılar'},
  {id: 'settings', label: 'Ayarlar'},
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onChangeTab,
  selectedProvince,
  onOpenProvincePicker,
}) => {
  return (
    <header className="sticky top-0 z-30 h-[54px] lg:h-16 border-b border-[#E4E7E3] dark:border-[#232E27] bg-white/90 dark:bg-[#0D120F]/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onChangeTab('today')}
          className="text-lg font-extrabold tracking-tight text-[#121914] dark:text-[#F1F5F2] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Vakit
        </button>

        {/* Zone 2: Desktop single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Ana menü">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`min-h-[44px] px-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-[#0E6B4E] text-[#0E6B4E] dark:border-[#2BB686] dark:text-[#2BB686]'
                    : 'border-transparent text-[#525C54] hover:text-[#121914] dark:text-[#A0ABA3] dark:hover:text-[#F1F5F2]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary contextual action */}
        <button
          type="button"
          onClick={onOpenProvincePicker}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFF2EE] hover:bg-[#E4E9E2] dark:bg-[#151C18] dark:hover:bg-[#1E2822] border border-[#E4E7E3] dark:border-[#232E27] text-xs sm:text-sm font-semibold text-[#121914] dark:text-[#F1F5F2] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <MapPin className="h-4 w-4 text-[#0E6B4E] dark:text-[#2BB686] shrink-0" />
          <span className="truncate max-w-[140px]">
            {formatPlaka(selectedProvince.plaka)} · {selectedProvince.name}
          </span>
        </button>
      </div>
    </header>
  );
};
