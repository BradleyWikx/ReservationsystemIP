import React, { useState } from 'react';
import { WaitingListEntry, ShowSlot } from '../../types';

interface WaitingListManagerProps {
  entries: WaitingListEntry[];
  onRemoveEntry: (entryId: string) => void;
  showSlots: ShowSlot[]; 
  onBookFromWaitingListModalOpen: (entry: WaitingListEntry) => void; // Prop name confirmed
}

export const WaitingListManager: React.FC<WaitingListManagerProps> = ({ entries, onRemoveEntry, showSlots, onBookFromWaitingListModalOpen }) => {
  const [filterShowSlotId, setFilterShowSlotId] = useState<string>('');

  const filteredEntries = entries
    .filter(entry => !filterShowSlotId || entry.showSlotId === filterShowSlotId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const activeShowSlotsWithWaitingList = showSlots.filter(slot => 
    entries.some(e => e.showSlotId === slot.id)
  ).sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const handleBookNowAttempt = (entry: WaitingListEntry, slot: ShowSlot | undefined) => {
    if (!slot) {
        // This case should ideally be prevented by disabling the button if slot is undefined.
        alert("Fout: Show details niet gevonden voor deze wachtlijst-inschrijving.");
        return;
    }
    // Directly call the prop to open the modal. The modal itself will handle package selection and capacity checks.
    onBookFromWaitingListModalOpen(entry);
  };


  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Wachtlijst Beheer ({filteredEntries.length})</h2>

      <div className="mb-6 p-4 border border-gray-200 rounded-md">
        <label htmlFor="filterShow" className="block text-sm font-medium text-gray-600 mb-1">Filter op Show</label>
        <select
          id="filterShow"
          value={filterShowSlotId}
          onChange={(e) => setFilterShowSlotId(e.target.value)}
          className="w-full md:w-1/2 border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Alle Shows</option>
          {activeShowSlotsWithWaitingList.map(slot => (
            <option key={slot.id} value={slot.id}>
              {new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL', {weekday: 'short', day: 'numeric', month: 'short'})} - {slot.time}
            </option>
          ))}
        </select>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="text-gray-500 italic">
          {entries.length === 0 ? "De wachtlijst is leeg." : "Geen inschrijvingen voor de geselecteerde show."}
        </p>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {filteredEntries.map(entry => {
            const slotForEntry = showSlots.find(s => s.id === entry.showSlotId);
            const canBookDirectly = slotForEntry && !slotForEntry.isManuallyClosed && slotForEntry.capacity > slotForEntry.bookedCount;
            
            let buttonClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';
            let buttonTitle = "Show data niet beschikbaar voor deze boeking.";

            if (slotForEntry) {
                if (canBookDirectly) {
                    buttonClass = 'bg-green-100 hover:bg-green-200 text-green-700';
                    buttonTitle = "Boek deze persoon nu direct";
                } else {
                    buttonClass = 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700';
                    buttonTitle = `Show is ${slotForEntry.isManuallyClosed ? 'gesloten' : 'vol'} (${slotForEntry.bookedCount}/${slotForEntry.capacity}). Klik om boeking te starten (admin overschrijving).`;
                }
            }

            return (
              <div key={entry.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                  <div>
                    <h3 className="text-md font-semibold text-blue-600">{entry.name} - {entry.guests} pers.</h3>
                    <p className="text-xs text-gray-500">
                      Voor show: {new Date(entry.showInfo.date + 'T00:00:00').toLocaleDateString('nl-NL')} om {entry.showInfo.time}
                      {slotForEntry && <span className="ml-2">({slotForEntry.bookedCount}/{slotForEntry.capacity}) {slotForEntry.isManuallyClosed ? <span className="text-orange-500">Gesloten</span>:''}</span>}
                    </p>
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <button
                        onClick={() => handleBookNowAttempt(entry, slotForEntry)} // Calls internal handler
                        className={`text-xs font-medium py-1 px-2 rounded-md transition-colors ${buttonClass}`}
                        disabled={!slotForEntry} // Keep disabled if slotForEntry is undefined
                        title={buttonTitle}
                    >
                        Boek Nu
                    </button>
                    <button
                      onClick={() => onRemoveEntry(entry.id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-2 rounded-md transition-colors"
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p><strong>Contact:</strong> {entry.email} / {entry.phone}</p>
                  <p className="text-gray-600 pt-1">Aangemeld op: {new Date(entry.timestamp).toLocaleString('nl-NL')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
