import React from 'react';
import {BellRing, Clock, MapPin, Settings} from 'lucide-react';
import type {AppTab} from '../types/app';

interface BottomNavProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  hasActiveWarning: boolean;
}

const TABS: {
  id: AppTab;
  label: string;
  Icon: React.ComponentType<{className?: string}>;
}[] = [
  {id: 'today', label: 'Vakitler', Icon: Clock},
  {id: 'provinces', label: 'İller', Icon: MapPin},
  {id: 'alerts', label: 'Uyarılar', Icon: BellRing},
  {id: 'settings', label: 'Ayarlar', Icon: Settings},
];

export const BottomNav: React.FC<BottomNavProps> = ({activeTab, onChangeTab, hasActiveWarning}) => {
  return (
    <nav
      aria-label="Mobil gezinme"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E4E7E3] dark:border-[#232E27] bg-white/95 dark:bg-[#0D120F]/95 backdrop-blur-md pb-safe"
    >
      <div className="grid grid-cols-4 h-[60px] items-center">
        {TABS.map(({id, label, Icon}) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] w-full transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0E6B4E] dark:text-[#2BB686]'
                  : 'text-[#525C54] dark:text-[#A0ABA3]'
              }`}
            >
              <div className="relative">
                <Icon className={`h-[22px] w-[22px] ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {id === 'alerts' && hasActiveWarning && (
                  <span
                    className="sr-only"
                  >
                    Aktif çıkış uyarısı
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
