
import React from 'react';
import { ShowType } from '../types';

interface ShowFilterControlsProps {
  availableMonths: string[]; // YYYY-MM format
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableShowTypes: ShowType[];
  selectedShowType: ShowType | '';
  onShowTypeChange: (showType: ShowType | '') => void;
  onResetFilters: () => void;
}

const ShowFilterControls: React.FC<ShowFilterControlsProps> = ({
  availableMonths,
  selectedMonth,
  onMonthChange,
  availableShowTypes,
  selectedShowType,
  onShowTypeChange,
  onResetFilters,
}) => {
  const formatMonthForDisplay = (yyyyMM: string) => {
    const [year, month] = yyyyMM.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('nl-NL', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getShowTypeFilterDisplayName = (showType: ShowType): string => {
    switch (showType) {
      case ShowType.REGULAR: return "Reguliere Shows";
      case ShowType.MATINEE: return "Matinee Voorstellingen";
      case ShowType.ZORGZAME_HELDEN: return "Zorgzame Helden Shows";
      case ShowType.SPECIAL_EVENT: return "Speciale Evenementen";
      default: return showType;
    }
  };

  const commonSelectClass = "w-full p-2.5 border border-slate-600 bg-slate-700 text-white rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow";

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800 bg-opacity-50 backdrop-blur-md p-4 md:p-6 rounded-xl shadow-2xl border border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        {/* Month Filter */}
        <div className="flex-1 w-full">
          <label htmlFor="month-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Filter op Maand
          </label>
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className={commonSelectClass}
            aria-label="Filter op maand"
          >
            <option value="">Alle Maanden</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthForDisplay(month)}
              </option>
            ))}
          </select>
        </div>

        {/* ShowType Filter */}
        <div className="flex-1 w-full">
          <label htmlFor="showtype-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Filter op Soort Show
          </label>
          <select
            id="showtype-filter"
            value={selectedShowType}
            onChange={(e) => onShowTypeChange(e.target.value as ShowType | '')}
            className={commonSelectClass}
            aria-label="Filter op soort show"
          >
            <option value="">Alle Soorten Shows</option>
            {availableShowTypes.map((type) => (
              <option key={type} value={type}>
                {getShowTypeFilterDisplayName(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="w-full lg:w-auto">
            <button
                onClick={onResetFilters}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2.5 px-5 rounded-md transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                aria-label="Reset alle filters"
            >
                Reset Filters
            </button>
        </div>
      </div>
    </div>
  );
};

export { ShowFilterControls };