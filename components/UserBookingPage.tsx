import React, { useState, useMemo, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { ShowSlot, PackageOption, ShowType } from '../types'; // Removed MerchandiseItem, AppSettings
import { ShowFilterControls } from './ShowFilterControls';
import { CalendarView } from './CalendarView'; // Corrected import path
import { SHOW_TYPE_COLORS } from '../constants'; 

interface UserBookingPageProps {
  availableShowSlots: ShowSlot[];
  onBookShow: (slot?: ShowSlot) => void;
  allPackages: PackageOption[]; 
  onOpenWaitingListModal: (slotId: string) => void; // Added this line
  onNavigateToAdminView: () => void;
  onNavigateToUserAccountView: () => void; 
}

// Helper function to get unique months from show slots
const getAvailableMonths = (slots: ShowSlot[]): string[] => {
  const months = new Set<string>();
  slots.forEach(slot => {
    if (new Date(`${slot.date}T${slot.time}`) > new Date() && slot.capacity > slot.bookedCount && !slot.isManuallyClosed) {
      months.add(slot.date.substring(0, 7)); // YYYY-MM
    }
  });
  return Array.from(months).sort();
};

const getShowTypeDisplayName = (showType?: ShowType): string | null => {
  if (!showType) return null;
  switch (showType) {
    case ShowType.MATINEE: return "Matinee";
    case ShowType.ZORGZAME_HELDEN: return "Zorgzame Helden Dag";
    case ShowType.SPECIAL_EVENT: return "Speciaal Evenement";
    default: return null;
  }
};

const calculateEndTime = (startTimeStr: string, durationHours: number): string => {
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const startDate = new Date(); // Use a dummy date, only time matters
  startDate.setHours(hours, minutes, 0, 0);
  
  startDate.setHours(startDate.getHours() + durationHours);
  
  const endHours = startDate.getHours().toString().padStart(2, '0');
  const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
  
  return `${endHours}:${endMinutes}`;
};

export const UserBookingPage: React.FC<UserBookingPageProps> = ({ availableShowSlots, onBookShow, allPackages, onOpenWaitingListModal, onNavigateToAdminView, onNavigateToUserAccountView }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedShowType, setSelectedShowType] = useState<ShowType | ''>('');
  const [overviewDate, setOverviewDate] = useState<string | null>(null); // State for day overview
  const dayOverviewRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  const logoUrl = "./logo-ip.png"; 
  const SHOW_DURATION_HOURS = 3; // Standard show duration of 3 hours

  const availableMonthsForFilter = useMemo(() => getAvailableMonths(availableShowSlots), [availableShowSlots]);
  const availableShowTypesForFilter = useMemo(() => {
    const types = new Set<ShowType>();
    availableShowSlots.forEach(slot => {
        if (slot.showType && new Date(`${slot.date}T${slot.time}`) > new Date() && slot.capacity > slot.bookedCount && !slot.isManuallyClosed) {
            types.add(slot.showType);
        } else if (!slot.showType && new Date(`${slot.date}T${slot.time}`) > new Date() && slot.capacity > slot.bookedCount && !slot.isManuallyClosed) {
            types.add(ShowType.REGULAR); // Assume REGULAR if not specified but available
        }
    });
    return Array.from(types).sort();
  }, [availableShowSlots]);


  const filteredShows = useMemo(() => {
    return availableShowSlots
      .filter(slot => {
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        const isFutureAndOpen = slotDateTime > new Date() && slot.capacity > slot.bookedCount && !slot.isManuallyClosed;
        if (!isFutureAndOpen) return false;

        const monthMatch = !selectedMonth || slot.date.startsWith(selectedMonth);
        const showTypeMatch = !selectedShowType || (slot.showType || ShowType.REGULAR) === selectedShowType;
        
        return monthMatch && showTypeMatch;
      })
      .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [availableShowSlots, selectedMonth, selectedShowType]);

  const handleResetFilters = () => {
    setSelectedMonth('');
    setSelectedShowType('');
    setOverviewDate(null); // Reset overview date as well
  };
  

  const handleDateSelectForCalendar = (dateString: string) => {
    setOverviewDate(dateString);
  };

  useEffect(() => {
    if (overviewDate && dayOverviewRef.current) {
      dayOverviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, [overviewDate]);

  const showsForDayOverview = useMemo(() => {
    if (!overviewDate) return [];
    return filteredShows.filter(slot => slot.date === overviewDate);
  }, [overviewDate, filteredShows]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-4 md:p-8 flex flex-col items-center selection:bg-amber-500 selection:text-amber-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12 w-full text-center">
          <img 
            src={logoUrl} 
            alt="Inspiration Point Logo" 
            className="w-auto h-auto max-h-[100px] md:max-h-[150px] mx-auto object-contain mb-5 md:mb-6 drop-shadow-lg"
          />
          <h1 className="font-display-black text-3xl sm:text-4xl md:text-5xl text-amber-400 mb-3 tracking-tight leading-tight">
            Welkom bij Inspiration Point
          </h1>
          <p className="font-display text-xl md:text-2xl text-amber-300 mt-1 mb-2">
            Beleef onze huidige show: "Alles in Wonderland"
          </p>
          <p className="text-md md:text-lg text-slate-300 max-w-xl mx-auto">
            Vind en boek uw perfecte dinnershow ervaring. Filter op maand en soort show.
          </p>
        </header>

        <ShowFilterControls
          availableMonths={availableMonthsForFilter}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableShowTypes={availableShowTypesForFilter}
          selectedShowType={selectedShowType}
          onShowTypeChange={setSelectedShowType}
          onResetFilters={handleResetFilters}
        />

        <div className="mt-8 w-full">
          <CalendarView
            showSlots={filteredShows} // Pass filtered shows to calendar
            selectedDate={overviewDate}
            onDateSelect={handleDateSelectForCalendar}
            className="bg-slate-800 bg-opacity-50 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-slate-700"
          />
        </div>

        {overviewDate ? (
          // Display shows for the selected day
          <div ref={dayOverviewRef} className="mt-8 w-full scroll-mt-4">
            <h2 className="text-2xl sm:text-3xl font-display-bold text-amber-400 mb-4 sm:mb-6 tracking-tight">
              Shows op {new Date(overviewDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {showsForDayOverview.length > 0 ? (
              <div className="space-y-4">
                {showsForDayOverview.map(slot => {
                  const availablePackagesForSlot = allPackages.filter(p => slot.availablePackageIds.includes(p.id));
                  const showTypeDisplayName = getShowTypeDisplayName(slot.showType);
                  const showTypeColor = slot.showType ? SHOW_TYPE_COLORS[slot.showType] : SHOW_TYPE_COLORS[ShowType.REGULAR];
                  const endTime = calculateEndTime(slot.time, SHOW_DURATION_HOURS);
                  return (
                    <div key={`overview-${slot.id}`} className="bg-slate-800 bg-opacity-70 backdrop-blur-md p-4 rounded-lg shadow-xl border border-slate-700 hover:border-amber-500 transition-colors duration-150">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                          <h3 className="text-xl font-display font-semibold text-amber-400">
                            {slot.name || `Show om ${slot.time}`}
                          </h3>
                          <p className="text-lg text-slate-200 font-medium">
                            Tijd: {slot.time} - {endTime}
                          </p>
                          {showTypeDisplayName && showTypeColor && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full ml-0 sm:ml-0 mt-1 inline-block align-middle"
                              style={{ backgroundColor: showTypeColor, color: '#fff' }}
                            >
                              {showTypeDisplayName}
                            </span>
                          )}
                          <p className="text-sm text-slate-300 mt-1.5">
                            {slot.capacity - slot.bookedCount} plaatsen beschikbaar
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Arrangementen: {availablePackagesForSlot.map(p => p.name).join(', ') || 'Geen gespecificeerd'}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 mt-3 sm:mt-0">
                          {(slot.capacity - slot.bookedCount <= 0 || slot.isManuallyClosed) && (
                            <button
                              onClick={() => onOpenWaitingListModal(slot.id)}
                              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-transform transform hover:scale-105 text-sm shadow-md hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                              Wachtlijst
                            </button>
                          )}
                          {!(slot.capacity - slot.bookedCount <= 0 || slot.isManuallyClosed) && (
                            <button
                              onClick={() => onBookShow(slot)}
                              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-6 rounded-lg transition-transform transform hover:scale-105 text-sm shadow-md hover:shadow-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                              aria-label={`Boek show op ${new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL')} van ${slot.time} tot ${endTime}`}
                            >
                              Boek Deze Show
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-300 bg-slate-800 bg-opacity-50 p-6 rounded-lg shadow-xl border border-slate-700">
                Geen shows gevonden voor {new Date(overviewDate + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} die aan uw huidige filters voldoen.
              </p>
            )}
          </div>
        ) : (
          // Display all filtered shows if no specific date is selected
          <div className="mt-8 w-full">
            <h2 className="text-2xl sm:text-3xl font-display-bold text-amber-400 mb-4 sm:mb-6 tracking-tight">
              Alle Beschikbare Shows (volgens filters)
            </h2>
            {filteredShows.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 scrollbar">
                {filteredShows.map(slot => {
                  const availablePackagesForSlot = allPackages.filter(p => slot.availablePackageIds.includes(p.id));
                  const showTypeDisplayName = getShowTypeDisplayName(slot.showType);
                  const showTypeColor = slot.showType ? SHOW_TYPE_COLORS[slot.showType] : SHOW_TYPE_COLORS[ShowType.REGULAR];
                  const endTime = calculateEndTime(slot.time, SHOW_DURATION_HOURS);
                  return (
                    <div key={slot.id} className="bg-slate-800 bg-opacity-60 backdrop-blur-md p-4 rounded-lg shadow-xl border border-slate-700 hover:border-amber-500 transition-colors duration-150">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                          <h3 className="text-xl font-display font-semibold text-amber-400">
                            {new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {slot.name && ` - ${slot.name}`}
                          </h3>
                          <p className="text-lg text-slate-200 font-medium">
                            Tijd: {slot.time} - {endTime}
                          </p>
                          {showTypeDisplayName && showTypeColor && (
                              <span 
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full ml-0 sm:ml-0 mt-1 inline-block align-middle"
                                  style={{ backgroundColor: showTypeColor, color: '#fff' }} 
                              >
                                  {showTypeDisplayName}
                              </span>
                          )}
                          <p className="text-sm text-slate-300 mt-1.5">
                            {slot.capacity - slot.bookedCount} plaatsen beschikbaar
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Arrangementen: {availablePackagesForSlot.map(p => p.name).join(', ') || 'Geen gespecificeerd'}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 mt-3 sm:mt-0">
                          {(slot.capacity - slot.bookedCount <= 0 || slot.isManuallyClosed) && (
                            <button
                              onClick={() => onOpenWaitingListModal(slot.id)}
                              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-transform transform hover:scale-105 text-sm shadow-md hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                              Wachtlijst
                            </button>
                          )}
                          {!(slot.capacity - slot.bookedCount <= 0 || slot.isManuallyClosed) && (
                            <button
                              onClick={() => onBookShow(slot)}
                              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-6 rounded-lg transition-transform transform hover:scale-105 text-sm shadow-md hover:shadow-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                              aria-label={`Boek show op ${new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL')} van ${slot.time} tot ${endTime}`}
                            >
                              Boek Deze Show
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              availableShowSlots.length > 0 ? (
                   <p className="text-center text-slate-300 bg-slate-800 bg-opacity-50 p-6 rounded-lg shadow-xl border border-slate-700">
                  Geen shows gevonden die aan uw criteria voldoen. Probeer andere filters of reset de filters.
                </p>
              ) : (
                   <p className="text-center text-slate-300 bg-slate-800 bg-opacity-50 p-6 rounded-lg shadow-xl border border-slate-700">
                  Er zijn momenteel geen shows beschikbaar. Kom later terug!
                </p>
              )
            )}
          </div>
        )}
        
        {overviewDate && ( // Only show this button if a date is selected (overviewDate is not null)
          <div className="mt-8 w-full flex justify-center">
               <button
                  onClick={() => setOverviewDate(null)} // Clears the selected date
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-150 ease-in-out hover:scale-105 text-md shadow-md hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-opacity-50"
              >
                  Toon Alle Gefilterde Shows
              </button>
          </div>
        )}

        <footer className="text-center mt-10 py-4">
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Inspiration Point Boekingssysteem</p>
          <button 
              onClick={onNavigateToAdminView} 
              className="text-xs text-indigo-400 hover:text-amber-400 hover:underline mt-1 mr-4 inline-block bg-transparent border-none p-0 cursor-pointer"
              aria-label="Ga naar admin login"
          >
              Admin Login
          </button>
          <button 
              onClick={onNavigateToUserAccountView} 
              className="text-xs text-indigo-400 hover:text-amber-400 hover:underline mt-1 inline-block bg-transparent border-none p-0 cursor-pointer"
              aria-label="Ga naar mijn account"
          >
              Mijn Account
          </button>
        </footer>
      </div>
    </div>
  );
};
