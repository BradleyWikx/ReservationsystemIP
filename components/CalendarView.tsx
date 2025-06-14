
import React, { useState, useMemo } from 'react';
import { ShowSlot, ShowType } from '../types';
import { SHOW_TYPE_COLORS } from '../constants'; 

interface CalendarViewProps {
  showSlots: ShowSlot[];
  selectedDate: string | null; 
  onDateSelect: (dateString: string) => void;
  datesWithBookings?: Set<string>; 
  showTypeColors?: Record<ShowType, string>; 
  className?: string; 
}

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  showSlots, 
  selectedDate, 
  onDateSelect, 
  datesWithBookings,
  showTypeColors = SHOW_TYPE_COLORS, 
  className = "bg-white p-4 rounded-xl shadow-lg border border-slate-200" 
}) => {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(selectedDate ? new Date(selectedDate + 'T00:00:00Z') : new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDisplayMonth.getUTCFullYear();
    const month = currentDisplayMonth.getUTCMonth();
    const date = new Date(Date.UTC(year, month, 1));
    const days = [];
    while (date.getUTCMonth() === month) {
      days.push(new Date(date));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return days;
  }, [currentDisplayMonth]);

  const firstDayOfMonth = useMemo(() => {
    // Standard getUTCDay(): 0 (Sun) to 6 (Sat)
    // We want: 0 (Mon) to 6 (Sun)
    const day = new Date(Date.UTC(currentDisplayMonth.getUTCFullYear(), currentDisplayMonth.getUTCMonth(), 1)).getUTCDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }, [currentDisplayMonth]);
  
  const daysOfWeek = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']; // Monday first

  const toYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDayClass = (dayDateObj: Date): string => {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    
    const dayString = toYYYYMMDD(dayDateObj);
    let dayDateForCompare = new Date(Date.UTC(dayDateObj.getUTCFullYear(), dayDateObj.getUTCMonth(), dayDateObj.getUTCDate()));

    let baseClass = 'relative text-center py-2 px-1 border border-slate-200 rounded-lg cursor-pointer transition-all duration-150 text-sm min-h-[60px] flex flex-col items-center justify-between font-medium transform hover:scale-105 ';
    let dayNumberClass = 'block mb-1';
    
    if (dayDateForCompare.getUTCMonth() !== currentDisplayMonth.getUTCMonth()) {
      baseClass += 'bg-slate-50 cursor-not-allowed opacity-50 '; 
      dayNumberClass += ' text-slate-300';
    } else if (dayDateForCompare < today) {
      baseClass += 'bg-slate-100 cursor-not-allowed opacity-70 '; 
      dayNumberClass += ' text-slate-400 line-through';
    } else {
      const slotsOnThisDay = showSlots.filter(slot => slot.date === dayString);
      const openSlotsOnThisDay = slotsOnThisDay.filter(slot => !slot.isManuallyClosed && slot.bookedCount < slot.capacity);
      const allSlotsUnavailable = slotsOnThisDay.length > 0 && openSlotsOnThisDay.length === 0;

      if (allSlotsUnavailable) {
        baseClass += 'bg-red-200 text-red-700 hover:bg-red-300 ';
        dayNumberClass += ' text-red-700 line-through';
      } else if (openSlotsOnThisDay.length > 0) {
         const firstOpenShowType = openSlotsOnThisDay[0].showType || ShowType.REGULAR;
         const color = showTypeColors[firstOpenShowType] || showTypeColors[ShowType.REGULAR];
         baseClass += `bg-[${color}] bg-opacity-20 border-[${color}] hover:bg-opacity-30 `;
         dayNumberClass += `text-[${color}]`;
      } else if (slotsOnThisDay.length > 0) { 
          baseClass += 'bg-red-200 text-red-700 hover:bg-red-300 ';
          dayNumberClass += ' text-red-700 line-through';
      } else if (datesWithBookings?.has(dayString)) { 
        baseClass += 'bg-sky-100 text-sky-700 hover:bg-sky-200 ring-1 ring-sky-300 ';
        dayNumberClass += ' text-sky-700';
      } else {
         baseClass += 'bg-slate-200 text-slate-500 hover:bg-slate-300 ';
         dayNumberClass += ' text-slate-500';
      }
    }

    if (dayString === toYYYYMMDD(today) && !selectedDate && !baseClass.includes('bg-red-') && !baseClass.includes('bg-opacity-20')) { 
       baseClass += ' bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 '; 
       dayNumberClass += ' text-indigo-700';
    }
    if (selectedDate && dayString === selectedDate) {
      baseClass += ' ring-2 ring-indigo-600 ring-offset-2 shadow-lg scale-105 z-10 ';
    }
    return baseClass + dayNumberClass;
  };

  const changeMonth = (offset: number) => {
    setCurrentDisplayMonth(prev => {
      const newDate = new Date(prev);
      newDate.setUTCMonth(newDate.getUTCMonth() + offset);
      newDate.setUTCDate(1); 
      return newDate;
    });
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-5">
        <button 
          onClick={() => changeMonth(-1)} 
          className="p-2 rounded-full hover:bg-slate-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          aria-label="Vorige maand"
        >
          <ChevronLeftIcon />
        </button>
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
          {currentDisplayMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        </h3>
        <button 
          onClick={() => changeMonth(1)} 
          className="p-2 rounded-full hover:bg-slate-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          aria-label="Volgende maand"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-sm">
        {daysOfWeek.map(dayName => (
          <div key={dayName} className="text-center font-semibold text-xs text-slate-500 py-2">{dayName}</div>
        ))}
        {Array(firstDayOfMonth).fill(null).map((_, index) => ( // firstDayOfMonth is now 0 for Mon, 6 for Sun
          <div key={`empty-start-${index}`} className="border border-transparent rounded-md p-1 min-h-[60px]"></div>
        ))}
        {daysInMonth.map(dayDateObj => {
          const dayString = toYYYYMMDD(dayDateObj);
          const dayDateForCompare = new Date(Date.UTC(dayDateObj.getUTCFullYear(), dayDateObj.getUTCMonth(), dayDateObj.getUTCDate()));
          const isClickable = dayDateForCompare.getUTCMonth() === currentDisplayMonth.getUTCMonth();
          const slotsOnThisDay = showSlots.filter(slot => slot.date === dayString);
          
          return (
            <div
              key={dayString}
              className={getDayClass(dayDateObj)}
              onClick={() => {
                  if (isClickable) { 
                       onDateSelect(dayString);
                  }
              }}
              role="button"
              tabIndex={isClickable ? 0 : -1}
              onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                     onDateSelect(dayString);
                  }
              }}
              aria-label={`Datum ${dayDateObj.toLocaleDateString('nl-NL', { timeZone: 'UTC' })}`}
              aria-disabled={!isClickable}
            >
              <span className="block">{dayDateObj.getUTCDate()}</span>
              {slotsOnThisDay.length > 0 && dayDateForCompare.getUTCMonth() === currentDisplayMonth.getUTCMonth() && (
                <div className="flex justify-center items-end space-x-0.5 mt-0.5 h-2">
                  {slotsOnThisDay.slice(0, 4).map(slot => ( 
                    <span
                      key={slot.id}
                      className="block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: (slot.isManuallyClosed || slot.bookedCount >= slot.capacity) ? '#f87171' /* red-400 */ : (showTypeColors[slot.showType || ShowType.REGULAR] || showTypeColors[ShowType.REGULAR]) }}
                      title={`${slot.time} - ${slot.showType || 'REGULAR'} ${(slot.isManuallyClosed || slot.bookedCount >= slot.capacity) ? '(Vol/Gesloten)' : `(${slot.bookedCount}/${slot.capacity})`}`}
                    ></span>
                  ))}
                  {slotsOnThisDay.length > 4 && <span className="text-[8px] leading-none text-slate-500 -mb-0.5">+{slotsOnThisDay.length - 4}</span>}
                </div>
              )}
               {datesWithBookings?.has(dayString) && slotsOnThisDay.length === 0 && ( 
                <span className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full shadow" title="Heeft boekingen (oud systeem?)"></span>
              )}
            </div>
          );
        })}
         {Array(Math.max(0, 42 - (daysInMonth.length + firstDayOfMonth))).fill(null).map((_, index) => ( // Adjusted for new firstDayOfMonth
            <div key={`empty-end-${index}`} className="border border-transparent rounded-md p-1 min-h-[60px]"></div>
        ))}
      </div>
    </div>
  );
};
