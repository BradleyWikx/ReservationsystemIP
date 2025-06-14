
import React, { useState, useEffect, useMemo } from 'react';
import { PackageOption, ShowSlot } from '../../types';

interface BulkShowAddProps {
  onAddShowSlot: (newSlotData: Omit<ShowSlot, 'id' | 'bookedCount' | 'isManuallyClosed'>) => void;
  allPackages: PackageOption[];
  existingShowSlots: ShowSlot[];
}

const DEFAULT_CAPACITY = 250;

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const BulkShowAdd: React.FC<BulkShowAddProps> = ({ onAddShowSlot, allPackages, existingShowSlots }) => {
  const [bulkMode, setBulkMode] = useState<'range' | 'calendarClick'>('range');
  
  // States for Range Mode
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]); // Stores 0 (Mon) to 6 (Sun)
  
  // States for Calendar Click Mode
  // Initialize with the first day of the current month in UTC
  const initialCurrentMonthUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [currentDisplayMonthForClickMode, setCurrentDisplayMonthForClickMode] = useState(initialCurrentMonthUTC);
  const [selectedClickDates, setSelectedClickDates] = useState<string[]>([]);

  // Common states
  const [time, setTime] = useState('18:30'); 
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [previewSlots, setPreviewSlots] = useState<Omit<ShowSlot, 'id' | 'bookedCount' | 'isManuallyClosed'>[]>([]);
  const [timeSuggestion, setTimeSuggestion] = useState<string>('');

  const dayNamesShort = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']; // Monday first

  // Effect for time suggestion in Range Mode
  useEffect(() => {
    if (bulkMode === 'range') {
      if (daysOfWeek.length === 0) {
          setTimeSuggestion('');
          return;
      }
      const hasSunday = daysOfWeek.includes(6); 
      const hasMonToThu = daysOfWeek.some(d => d >= 0 && d <= 3); 
      const hasFriToSat = daysOfWeek.some(d => d >= 4 && d <= 5); 

      let suggested = '';
      if (hasMonToThu && !hasFriToSat && !hasSunday) suggested = '18:30';
      else if (hasFriToSat && !hasMonToThu && !hasSunday) suggested = '19:00';
      else if (hasSunday && !hasMonToThu && !hasFriToSat) suggested = '18:00 (Avond) / 14:00 (Matinee)';
      else if (daysOfWeek.length > 0) suggested = 'Controleer tijden per dagtype';
      
      setTimeSuggestion(suggested);
      if (suggested && !suggested.includes('/') && !suggested.includes('Controleer')) {
          setTime(suggested); 
      }
    } else {
      setTimeSuggestion('Tijd wordt toegepast per dagtype (Ma-Do 18:30, Vr-Za 19:00, Zo avond/matinee o.b.v. invoer).');
    }
  }, [daysOfWeek, bulkMode]);

  // Calendar logic for Calendar Click Mode (UTC based)
  const daysInClickModeMonth = useMemo(() => {
    if (bulkMode !== 'calendarClick') return [];
    const year = currentDisplayMonthForClickMode.getUTCFullYear();
    const month = currentDisplayMonthForClickMode.getUTCMonth();
    const date = new Date(Date.UTC(year, month, 1));
    const days = [];
    while (date.getUTCMonth() === month) {
      days.push(new Date(date));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return days;
  }, [currentDisplayMonthForClickMode, bulkMode]);

  const firstDayOfClickModeMonth = useMemo(() => {
    if (bulkMode !== 'calendarClick') return 0;
    const day = new Date(Date.UTC(currentDisplayMonthForClickMode.getUTCFullYear(), currentDisplayMonthForClickMode.getUTCMonth(), 1)).getUTCDay();
    return day === 0 ? 6 : day - 1; 
  }, [currentDisplayMonthForClickMode, bulkMode]);
  
  const toYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];

  const handleCalendarDateClick = (dateString: string) => {
    setSelectedClickDates(prev => 
      prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString].sort()
    );
  };

  const changeClickModeMonth = (offset: number) => {
    setCurrentDisplayMonthForClickMode(prev => {
        const newDate = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + offset, 1));
        return newDate;
    });
  };
  
  const getClickModeDayClass = (dayDateObj: Date): string => { // dayDateObj is UTC
    const todayObj = new Date();
    const todayUTCStart = new Date(Date.UTC(todayObj.getUTCFullYear(), todayObj.getUTCMonth(), todayObj.getUTCDate()));
    
    const dayString = toYYYYMMDD(dayDateObj);
    let baseClass = 'text-center py-2.5 px-1 border border-gray-200 rounded-md cursor-pointer transition-colors text-sm ';
    
    if (dayDateObj < todayUTCStart) {
      baseClass += 'text-gray-400 bg-gray-100 cursor-not-allowed line-through';
    } else {
      baseClass += 'hover:bg-blue-100 ';
      if (selectedClickDates.includes(dayString)) {
        baseClass += 'bg-blue-500 text-white ring-2 ring-blue-300';
      } else {
        baseClass += 'bg-white';
      }
    }
    return baseClass;
  };


  const handleDayToggleRangeMode = (dayIndex: number) => { // dayIndex is 0 (Mon) to 6 (Sun)
    setDaysOfWeek(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort((a,b) => a-b)
    );
  };
  
  const handlePackageToggle = (packageId: string) => {
    setSelectedPackageIds(prev =>
      prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
    );
  };

  const generatePreview = () => {
    setMessage(null);
    setPreviewSlots([]);
    
    if (!time || capacity <= 0) {
      setMessage({type: 'error', text: 'Vul tijd en capaciteit (>0) in.'});
      return;
    }

    let datesToProcess: string[] = [];
    if (bulkMode === 'range') {
      if (!startDate || !endDate || daysOfWeek.length === 0) {
        setMessage({type: 'error', text: 'Vul startdatum, einddatum en selecteer dagen van de week.'});
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
          setMessage({type: 'error', text: 'Startdatum kan niet na einddatum liggen.'});
          return;
      }
      let currentDate = new Date(startDate + 'T00:00:00Z'); // Use Z for UTC context with date strings
      const finalEndDate = new Date(endDate + 'T00:00:00Z');
      while (currentDate <= finalEndDate) {
        const dayOfWeekForCheck = currentDate.getUTCDay() === 0 ? 6 : currentDate.getUTCDay() - 1;
        if (daysOfWeek.includes(dayOfWeekForCheck)) {
          datesToProcess.push(toYYYYMMDD(currentDate));
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    } else { // calendarClick mode
      if (selectedClickDates.length === 0) {
        setMessage({type: 'error', text: 'Selecteer minstens één datum op de kalender.'});
        return;
      }
      datesToProcess = [...selectedClickDates];
    }

    const slotsToPreview: Omit<ShowSlot, 'id' | 'bookedCount' | 'isManuallyClosed'>[] = [];
    const todayObj = new Date();
    const todayUTCStartString = toYYYYMMDD(new Date(Date.UTC(todayObj.getUTCFullYear(), todayObj.getUTCMonth(), todayObj.getUTCDate())));


    datesToProcess.forEach(dateString => {
      if (dateString < todayUTCStartString) return; // Skip past dates

      // dateString is YYYY-MM-DD (UTC). new Date will parse it as local if no Z, or UTC if Z.
      // For getDay(), it's safer to ensure UTC interpretation if that's what the logic expects.
      // new Date(dateString + "T00:00:00Z") creates a date at UTC midnight.
      const currentDateObj = new Date(dateString + "T00:00:00Z"); 
      const currentDayIndexJS = currentDateObj.getUTCDay(); // 0 (Sun) to 6 (Sat)
      
      let effectiveTime = time; 
      let defaultPackagesForDay: string[] = [];

      if (currentDayIndexJS === 0) { // Sunday
          effectiveTime = time === '14:00' || time.startsWith('14:') ? '14:00' : '18:00';
          defaultPackagesForDay = ['zondag-donderdag-70', 'zondag-donderdag-85'];
      } else if (currentDayIndexJS >= 1 && currentDayIndexJS <= 4) { // Mon-Thu
          effectiveTime = '18:30';
          defaultPackagesForDay = ['zondag-donderdag-70', 'zondag-donderdag-85'];
      } else { // Fri-Sat (currentDayIndexJS is 5 or 6)
          effectiveTime = '19:00';
          defaultPackagesForDay = ['vrijdag-zaterdag-80', 'vrijdag-zaterdag-95'];
      }
      
      const packagesToUse = selectedPackageIds.length > 0 ? selectedPackageIds : defaultPackagesForDay;

      if (!existingShowSlots.some(s => s.date === dateString && s.time === effectiveTime)) {
          if (packagesToUse.length > 0) {
               slotsToPreview.push({
                  date: dateString,
                  time: effectiveTime, 
                  capacity,
                  availablePackageIds: packagesToUse,
              });
          }
      }
    });

    setPreviewSlots(slotsToPreview);
    if (slotsToPreview.length === 0) {
        setMessage({type: 'info', text: 'Geen nieuwe (conflict-vrije) shows gevonden voor deze selectie, of geen arrangementen geselecteerd/standaard beschikbaar.'});
    } else {
        setMessage({type: 'info', text: `${slotsToPreview.length} shows worden voorgesteld. Controleer de tijden en arrangementen.`});
    }
  };

  const handleBulkAdd = () => {
    if (previewSlots.length === 0) {
      setMessage({type: 'error', text: 'Genereer eerst een voorbeeld met shows om toe te voegen.'});
      return;
    }
    let countAdded = 0;
    previewSlots.forEach(slotData => {
      onAddShowSlot(slotData);
      countAdded++;
    });
    setMessage({type: 'success', text: `${countAdded} shows succesvol toegevoegd.`});
    setPreviewSlots([]); 
    if (bulkMode === 'calendarClick') setSelectedClickDates([]);
  };


  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Bulk Shows Toevoegen</h2>
      
      <div className="mb-4 flex space-x-2 border-b pb-2">
        <button 
            onClick={() => setBulkMode('range')}
            className={`py-2 px-4 rounded-md text-sm font-medium ${bulkMode === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            Via Datumbereik
        </button>
        <button 
            onClick={() => setBulkMode('calendarClick')}
            className={`py-2 px-4 rounded-md text-sm font-medium ${bulkMode === 'calendarClick' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            Via Kalender Klikken
        </button>
      </div>

      {message && (
        <p className={`p-3 rounded-md mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {message.text}
        </p>
      )}

      <div className="space-y-4 border border-gray-200 p-4 rounded-md">
        {bulkMode === 'range' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Startdatum</label>
                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} 
                       min={new Date().toISOString().split('T')[0]}
                       className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">Einddatum</label>
                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} 
                       min={startDate || new Date().toISOString().split('T')[0]}
                       className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Dagen van de week</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {dayNamesShort.map((name, index) => ( // index is 0 (Mon) to 6 (Sun)
                        <button key={index} type="button" onClick={() => handleDayToggleRangeMode(index)}
                            className={`p-2 border rounded-md text-xs transition-colors ${daysOfWeek.includes(index) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}>
                            {name}
                        </button>
                    ))}
                </div>
            </div>
          </>
        )}

        {bulkMode === 'calendarClick' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Selecteer datums op de kalender:</label>
            <div className="bg-gray-50 p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeClickModeMonth(-1)} className="p-2 rounded-md hover:bg-gray-200 transition-colors" aria-label="Vorige maand"><ChevronLeftIcon /></button>
                <h3 className="text-md font-semibold text-gray-700">{currentDisplayMonthForClickMode.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
                <button onClick={() => changeClickModeMonth(1)} className="p-2 rounded-md hover:bg-gray-200 transition-colors" aria-label="Volgende maand"><ChevronRightIcon /></button>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {dayNamesShort.map(dayName => (<div key={dayName} className="text-center font-medium text-xs text-gray-500 py-1">{dayName}</div>))}
                {Array(firstDayOfClickModeMonth).fill(null).map((_, index) => (<div key={`empty-start-${index}`} className="border border-gray-100 rounded-md p-1 min-h-[40px]"></div>))}
                {daysInClickModeMonth.map(dayDateObj => { // dayDateObj is UTC
                  const dayString = toYYYYMMDD(dayDateObj);
                  const todayObj = new Date();
                  const todayUTCStart = new Date(Date.UTC(todayObj.getUTCFullYear(), todayObj.getUTCMonth(), todayObj.getUTCDate()));
                  const isPast = dayDateObj < todayUTCStart;
                  return (
                    <div key={dayString} className={getClickModeDayClass(dayDateObj)}
                         onClick={() => !isPast && handleCalendarDateClick(dayString)}
                         role="button" tabIndex={isPast ? -1 : 0}
                         onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isPast) handleCalendarDateClick(dayString);}}
                         aria-label={`Datum ${dayDateObj.toLocaleDateString('nl-NL', {timeZone: 'UTC'})}`} aria-disabled={isPast}
                    >
                      {dayDateObj.getUTCDate()}
                    </div>
                  );
                })}
                {Array(Math.max(0, 42 - (daysInClickModeMonth.length + firstDayOfClickModeMonth))).fill(null).map((_, index) => (
                    <div key={`empty-end-${index}`} className="border border-gray-100 rounded-md p-1 min-h-[40px]"></div>
                ))}
              </div>
            </div>
            {selectedClickDates.length > 0 && <p className="text-xs text-gray-600 mt-2">{selectedClickDates.length} datum(s) geselecteerd.</p>}
          </div>
        )}
        
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="bulkShowTime" className="block text-sm font-medium text-gray-600 mb-1">Basistijd (voor Zondag Matinee: 14:00)</label>
                <input type="time" id="bulkShowTime" value={time} onChange={e => setTime(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
                {timeSuggestion && <p className="text-xs text-blue-600 mt-1">{timeSuggestion}</p>}
            </div>
            <div>
                <label htmlFor="bulkCapacity" className="block text-sm font-medium text-gray-600 mb-1">Capaciteit per show</label>
                <input type="number" id="bulkCapacity" value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 0)} min="1" className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Selecteer Arrangementen (Optioneel: anders standaard per dag)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50 scrollbar">
            {allPackages.map(pkg => (
              <label key={pkg.id} className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-100 cursor-pointer border border-gray-200">
                <input type="checkbox" checked={selectedPackageIds.includes(pkg.id)} onChange={() => handlePackageToggle(pkg.id)}
                  className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-xs text-gray-700">{pkg.name}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="button" onClick={generatePreview} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
          Voorbeeld Genereren
        </button>
      </div>

      {previewSlots.length > 0 && (
        <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Voorbeeld: {previewSlots.length} shows worden toegevoegd</h3>
            <ul className="space-y-1.5 text-xs text-gray-600 max-h-48 overflow-y-auto border p-3 rounded-md bg-gray-50 scrollbar">
                {previewSlots.map((s, i) => 
                <li key={i} className="p-1.5 border-b border-gray-200 last:border-b-0">
                    {new Date(s.date + "T00:00:00Z").toLocaleDateString('nl-NL', {weekday: 'short', day:'numeric', month:'short', timeZone: 'UTC'})} om <span className="font-semibold">{s.time}</span> (Cap: {s.capacity}) <br/>
                    <span className="text-gray-500">Arrangementen: {s.availablePackageIds.map(pid => allPackages.find(p=>p.id===pid)?.name).join(', ') || 'Geen'}</span>
                </li>)}
            </ul>
            <button onClick={handleBulkAdd} className="mt-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                Bevestig en Voeg Toe
            </button>
        </div>
      )}
    </div>
  );
};
