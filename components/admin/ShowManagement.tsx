
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShowSlot, PackageOption, WaitingListEntry, ShowType } from '../../types';
import { CalendarView } from '../CalendarView';
import { SHOW_TYPE_COLORS } from '../../constants';

interface ShowManagementProps {
  availableShowSlots: ShowSlot[];
  onAddShowSlot: (newSlotData: Omit<ShowSlot, 'id' | 'bookedCount'>) => void;
  onRemoveShowSlot: (slotId: string) => Promise<void>; // Updated return type
  onUpdateShowSlot: (slot: ShowSlot) => void;
  allPackages: PackageOption[];
  waitingListEntries: WaitingListEntry[];
}

const DEFAULT_CAPACITY = 250;
const ALL_SHOW_TYPES = Object.values(ShowType);

// Simple Close Icon for Modals
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const ShowManagement: React.FC<ShowManagementProps> = ({
  availableShowSlots,
  onAddShowSlot,
  onRemoveShowSlot,
  onUpdateShowSlot,
  allPackages,
  waitingListEntries,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ShowSlot | null>(null);
  // Form state for the modal
  const [formDate, setFormDate] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('18:30');
  const [formCapacity, setFormCapacity] = useState<number>(DEFAULT_CAPACITY);
  const [formSelectedPackageIds, setFormSelectedPackageIds] = useState<string[]>([]);
  const [formIsManuallyClosed, setFormIsManuallyClosed] = useState<boolean>(false);
  const [formShowType, setFormShowType] = useState<ShowType>(ShowType.REGULAR);
  const [formError, setFormError] = useState<string>('');

  const showsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableShowSlots
      .filter(slot => slot.date === selectedDate)
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [selectedDate, availableShowSlots]);

  // Effect to auto-set time to 14:00 if Matinee is selected in the form
  useEffect(() => {
    if (isModalOpen && formShowType === ShowType.MATINEE) {
      setFormTime("14:00");
    }
  }, [formShowType, isModalOpen]);


  const openModalForNewShow = (date: string) => {
    setEditingSlot(null);
    setFormDate(date);
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    let initialTime = '19:00'; // Default Fri-Sat
    let initialType = ShowType.REGULAR;

    if (dayOfWeek === 0) { // Sunday
      initialTime = '18:00'; // Default evening
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Mon-Thu
      initialTime = '18:30';
    }

    setFormTime(initialTime);
    setFormShowType(initialType); // Set initial type
    // The line below was removed as initialType is always ShowType.REGULAR here.
    // The useEffect for formShowType handles setting the time if the user changes type to MATINEE.
    // if (initialType === ShowType.MATINEE) setFormTime("14:00");

    setFormCapacity(DEFAULT_CAPACITY);
    setFormSelectedPackageIds([]);
    setFormIsManuallyClosed(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openModalForEditShow = (slot: ShowSlot) => {
    setEditingSlot(slot);
    setFormDate(slot.date);
    setFormTime(slot.time);
    setFormCapacity(slot.capacity);
    setFormSelectedPackageIds(slot.availablePackageIds);
    setFormIsManuallyClosed(slot.isManuallyClosed);
    setFormShowType(slot.showType || ShowType.REGULAR);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setFormError('');
  };

  const handleFormPackageToggle = (packageId: string) => {
    setFormSelectedPackageIds(prev =>
      prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formDate || !formTime || formSelectedPackageIds.length === 0 || formCapacity <= 0) {
      setFormError('Datum, tijd, capaciteit (>0) en minstens één arrangement zijn verplicht.');
      return;
    }

    const today = new Date(); today.setHours(0,0,0,0);
    if (!editingSlot && new Date(formDate + 'T00:00:00') < today) {
        setFormError('Kan geen show in het verleden toevoegen.');
        return;
    }

    let finalTime = formTime;
    if (formShowType === ShowType.MATINEE) {
      finalTime = "14:00";
    }

    if (!editingSlot || (editingSlot && (editingSlot.date !== formDate || editingSlot.time !== finalTime))) {
      if (availableShowSlots.some(s => s.id !== editingSlot?.id && s.date === formDate && s.time === finalTime)) {
        setFormError('Er bestaat al een show op deze datum en tijd.');
        return;
      }
    }

    const slotData = {
      date: formDate,
      time: finalTime,
      capacity: formCapacity,
      availablePackageIds: formSelectedPackageIds,
      isManuallyClosed: formIsManuallyClosed,
      showType: formShowType,
    };

    if (editingSlot) {
      onUpdateShowSlot({ ...editingSlot, ...slotData });
    } else {
      onAddShowSlot(slotData);
    }
    closeModal();
  };

  const handleToggleCloseShow = (slot: ShowSlot) => {
    onUpdateShowSlot({ ...slot, isManuallyClosed: !slot.isManuallyClosed });
  };

  const handleChangeShowType = (slotId: string, newType: ShowType) => {
    const slotToUpdate = availableShowSlots.find(s => s.id === slotId);
    if (slotToUpdate) {
      let updatedTime = slotToUpdate.time;
      if (newType === ShowType.MATINEE) {
        updatedTime = "14:00";
      }
      onUpdateShowSlot({ ...slotToUpdate, showType: newType, time: updatedTime });
    }
  };

  const handleDateSelectFromCalendar = useCallback((date: string) => {
    setSelectedDate(date);
    const dailyManagerElement = document.getElementById('daily-show-manager');
    if (dailyManagerElement) {
        dailyManagerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);


  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Showbeheer via Kalender</h2>

      <CalendarView
        showSlots={availableShowSlots}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelectFromCalendar}
        showTypeColors={SHOW_TYPE_COLORS}
        className="mb-8 bg-slate-50 p-4 rounded-xl shadow-lg border border-slate-200"
      />

      {selectedDate && (
        <div id="daily-show-manager" className="mt-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-indigo-700">
              Shows op {new Date(selectedDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button
                onClick={() => openModalForNewShow(selectedDate)}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors shadow-sm"
            >
                + Nieuwe Show
            </button>
          </div>

          {showsForSelectedDate.length === 0 ? (
            <p className="text-slate-500 italic">Geen shows gepland op deze datum.</p>
          ) : (
            <div className="space-y-3">
              {showsForSelectedDate.map(slot => {
                 const waitingCount = waitingListEntries.filter(w => w.showSlotId === slot.id).length;
                 return (
                  <div key={slot.id} className={`p-3 rounded-md shadow-sm border ${slot.isManuallyClosed ? 'bg-red-100 border-red-300 opacity-80' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-grow">
                        <p className={`font-semibold ${slot.isManuallyClosed ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                          {slot.time} - {slot.showType || 'REGULAR'}
                          <span className="ml-2 inline-block w-3 h-3 rounded-full" style={{backgroundColor: SHOW_TYPE_COLORS[slot.showType || ShowType.REGULAR]}}></span>
                        </p>
                        <p className="text-xs text-slate-500">Capaciteit: {slot.bookedCount}/{slot.capacity}
                           {waitingCount > 0 && <span className="text-yellow-600 ml-2">({waitingCount} op wachtlijst)</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Arrangementen:
                          {slot.availablePackageIds.map(pid => allPackages.find(p => p.id === pid)?.name).filter(Boolean).join(', ') || 'Geen'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                        <select
                            value={slot.showType || ShowType.REGULAR}
                            onChange={(e) => handleChangeShowType(slot.id, e.target.value as ShowType)}
                            className="text-xs p-1 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {ALL_SHOW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <button
                            onClick={() => handleToggleCloseShow(slot)}
                            className={`text-xs font-medium py-1 px-2 rounded-md transition-colors ${slot.isManuallyClosed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        >
                            {slot.isManuallyClosed ? 'Openen' : 'Sluiten'}
                        </button>
                        <button onClick={() => openModalForEditShow(slot)} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-medium py-1 px-2 rounded-md transition-colors">Bewerk</button>
                        <button onClick={() => onRemoveShowSlot(slot.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded-md transition-colors">Verwijder</button>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h3 className="text-xl font-semibold text-indigo-700">{editingSlot ? 'Show Bewerken' : 'Nieuwe Show Toevoegen'}</h3>
                <button onClick={closeModal} className="p-1 text-slate-500 hover:text-slate-700 rounded-full"><CloseIcon/></button>
            </div>
            {formError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-3">{formError}</p>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="formDate" className="block text-sm font-medium text-slate-600 mb-1">Datum</label>
                <input type="date" id="formDate" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                       min={editingSlot ? undefined : new Date().toISOString().split('T')[0]}
                       className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required readOnly={!!editingSlot}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="formShowType" className="block text-sm font-medium text-slate-600 mb-1">Show Type</label>
                    <select id="formShowType" value={formShowType} onChange={(e) => setFormShowType(e.target.value as ShowType)} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                        {ALL_SHOW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="formTime" className="block text-sm font-medium text-slate-600 mb-1">Tijd</label>
                    <input
                        type="time"
                        id="formTime"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        disabled={formShowType === ShowType.MATINEE} // Disable time input if Matinee
                    />
                    {formShowType === ShowType.MATINEE && <p className="text-xs text-slate-500 mt-1">Tijd is 14:00 voor Matinee.</p>}
                </div>
              </div>
               <div>
                    <label htmlFor="formCapacity" className="block text-sm font-medium text-slate-600 mb-1">Capaciteit</label>
                    <input type="number" id="formCapacity" value={formCapacity} onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)} min="1" className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Beschikbare Arrangementen</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50">
                    {allPackages.map(pkg => (
                    <label key={pkg.id} className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-slate-100 cursor-pointer border border-slate-200">
                        <input type="checkbox" checked={formSelectedPackageIds.includes(pkg.id)} onChange={() => handleFormPackageToggle(pkg.id)}
                        className="form-checkbox h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <span className="text-xs text-slate-700">{pkg.name} (€{pkg.price.toFixed(2)})</span>
                    </label>
                    ))}
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formIsManuallyClosed} onChange={(e) => setFormIsManuallyClosed(e.target.checked)}
                           className="form-checkbox h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Handmatig Gesloten</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={closeModal} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm">Annuleren</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-md text-sm">{editingSlot ? 'Opslaan' : 'Toevoegen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
