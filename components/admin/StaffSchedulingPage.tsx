
import React, { useState, useMemo, useEffect } from 'react';
import { StaffMember, StaffRole, ScheduledShift, ShowSlot } from '../../types';
import { CalendarView } from '../CalendarView';
import { useConfirm } from '../shared/ConfirmContext';
import type { ToastMessage } from '../shared/ToastNotifications';

interface StaffSchedulingPageProps {
  staffMembers: StaffMember[];
  scheduledShifts: ScheduledShift[];
  availableShowSlots: ShowSlot[];
  onAddStaffMember: (data: Omit<StaffMember, 'id'>) => StaffMember;
  onUpdateStaffMember: (updatedStaffMember: StaffMember) => boolean;
  onDeleteStaffMember: (staffMemberId: string) => Promise<boolean>;
  onScheduleStaff: (shiftData: Omit<ScheduledShift, 'id'>) => ScheduledShift | null;
  onUnscheduleStaff: (shiftId: string) => Promise<boolean>; // Changed from boolean to Promise<boolean>
  showToast: (message: string, type: ToastMessage['type']) => void;
}

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const StaffSchedulingPage: React.FC<StaffSchedulingPageProps> = ({
  staffMembers,
  scheduledShifts,
  availableShowSlots,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onScheduleStaff,
  onUnscheduleStaff,
  showToast,
}) => {
  const { confirm } = useConfirm();

  // Staff Management State
  const [isEditingStaff, setIsEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>(StaffRole.ZAAL);
  const [staffContact, setStaffContact] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [staffUnavailableDates, setStaffUnavailableDates] = useState<string[]>([]);
  const [currentUnavailableDateInput, setCurrentUnavailableDateInput] = useState('');
  const [staffFormError, setStaffFormError] = useState('');

  // Scheduling State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [staffToSchedule, setStaffToSchedule] = useState<Record<string, Record<StaffRole, string>>>({}); // { [showSlotId]: { Zaal: staffMemberId, Keuken: staffMemberId } }
  const [shiftNotes, setShiftNotes] = useState<Record<string, Record<StaffRole, string>>>({}); // { [showSlotId]: { Zaal: note, Keuken: note }}

  useEffect(() => {
    if (isEditingStaff) {
      setStaffName(isEditingStaff.name);
      setStaffRole(isEditingStaff.role);
      setStaffContact(isEditingStaff.contactInfo || '');
      setStaffNotes(isEditingStaff.notes || '');
      setStaffUnavailableDates(isEditingStaff.unavailableDates || []);
    } else {
      setStaffName('');
      setStaffRole(StaffRole.ZAAL);
      setStaffContact('');
      setStaffNotes('');
      setStaffUnavailableDates([]);
    }
    setCurrentUnavailableDateInput('');
    setStaffFormError('');
  }, [isEditingStaff]);
  
  const handleAddUnavailableDate = () => {
    if (currentUnavailableDateInput && !staffUnavailableDates.includes(currentUnavailableDateInput)) {
        // Basic validation for YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(currentUnavailableDateInput)) {
            setStaffFormError('Ongeldig datumformaat. Gebruik YYYY-MM-DD.');
            return;
        }
        try {
            new Date(currentUnavailableDateInput + "T00:00:00Z").toISOString(); // Check if valid date
            setStaffUnavailableDates(prev => [...prev, currentUnavailableDateInput].sort());
            setCurrentUnavailableDateInput('');
            setStaffFormError('');
        } catch (e) {
            setStaffFormError('Ongeldige datum ingevoerd.');
        }
    } else if (staffUnavailableDates.includes(currentUnavailableDateInput)) {
        setStaffFormError('Deze datum is al toegevoegd.');
    }
  };

  const handleRemoveUnavailableDate = (dateToRemove: string) => {
    setStaffUnavailableDates(prev => prev.filter(date => date !== dateToRemove));
  };


  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setStaffFormError('Naam is verplicht.');
      return;
    }
    const staffData = { 
        name: staffName, 
        role: staffRole, 
        contactInfo: staffContact, 
        notes: staffNotes,
        unavailableDates: staffUnavailableDates 
    };
    if (isEditingStaff) {
      onUpdateStaffMember({ ...isEditingStaff, ...staffData });
    } else {
      onAddStaffMember(staffData);
    }
    setIsEditingStaff(null); // Resets form via useEffect
  };

  const handleDeleteStaff = async (staffMemberId: string) => {
    await onDeleteStaffMember(staffMemberId); // Confirm is handled in App.tsx
  };

  const showsForSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return availableShowSlots
      .filter(slot => slot.date === selectedCalendarDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedCalendarDate, availableShowSlots]);

  const getScheduledStaffForSlotAndRole = (showSlotId: string, role: StaffRole): ScheduledShift[] => {
    return scheduledShifts.filter(s => s.showSlotId === showSlotId && s.roleDuringShift === role);
  };

  const getAvailableStaffForSlotAndRole = (showSlot: ShowSlot, role: StaffRole): StaffMember[] => {
    const scheduledForThisExactSlot = scheduledShifts
      .filter(s => s.showSlotId === showSlot.id)
      .map(s => s.staffMemberId);
      
    return staffMembers.filter(sm => 
        sm.role === role && 
        !scheduledForThisExactSlot.includes(sm.id)
    );
  };

  const handleScheduleStaffMember = (showSlotId: string, role: StaffRole) => {
    const staffMemberId = staffToSchedule[showSlotId]?.[role];
    const show = availableShowSlots.find(s => s.id === showSlotId);

    if (!staffMemberId || !show) {
      showToast('Selecteer een personeelslid en zorg dat de show bestaat.', 'warning');
      return;
    }

    const staffMember = staffMembers.find(sm => sm.id === staffMemberId);
    let currentShiftNoteValue = shiftNotes[showSlotId]?.[role] || '';
    
    if (staffMember?.unavailableDates?.includes(show.date)) {
        currentShiftNoteValue = (currentShiftNoteValue ? currentShiftNoteValue + " " : "") + "(Let op: Personeelslid was gemarkeerd onbeschikbaar)";
    }

    onScheduleStaff({ showSlotId, staffMemberId, roleDuringShift: role, shiftNotes: currentShiftNoteValue });
    
    // Clear selection
    setStaffToSchedule(prev => ({ ...prev, [showSlotId]: { ...prev[showSlotId], [role]: '' } }));
    setShiftNotes(prev => ({ ...prev, [showSlotId]: { ...prev[showSlotId], [role]: '' } }));
  };

  const handleStaffToScheduleChange = (showSlotId: string, role: StaffRole, staffMemberId: string) => {
    setStaffToSchedule(prev => ({
      ...prev,
      [showSlotId]: {
        ...prev[showSlotId],
        [role]: staffMemberId,
      },
    }));
  };

  const handleShiftNotesChange = (showSlotId: string, role: StaffRole, note: string) => {
    setShiftNotes(prev => ({
        ...prev,
        [showSlotId]: {
            ...prev[showSlotId],
            [role]: note,
        },
    }));
  };


  return (
    <div className="space-y-8">
      {/* Staff Management Section */}
      <section className="p-4 md:p-6 bg-slate-50 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">{isEditingStaff ? 'Personeelslid Bewerken' : 'Nieuw Personeelslid Toevoegen'}</h2>
        {staffFormError && <p className="text-red-600 bg-red-100 p-2 rounded-md text-sm mb-3">{staffFormError}</p>}
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="staffName" className="block text-sm font-medium text-slate-600">Naam</label>
              <input type="text" id="staffName" value={staffName} onChange={e => setStaffName(e.target.value)} required className="mt-1 w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="staffRole" className="block text-sm font-medium text-slate-600">Rol</label>
              <select id="staffRole" value={staffRole} onChange={e => setStaffRole(e.target.value as StaffRole)} className="mt-1 w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                {Object.values(StaffRole).map(roleValue => (
                  <option key={roleValue} value={roleValue}>{roleValue}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="staffContact" className="block text-sm font-medium text-slate-600">Contact Info (Telefoon/Email)</label>
            <input type="text" id="staffContact" value={staffContact} onChange={e => setStaffContact(e.target.value)} className="mt-1 w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="staffNotes" className="block text-sm font-medium text-slate-600">Notities (Vaardigheden, etc.)</label>
            <textarea id="staffNotes" value={staffNotes} onChange={e => setStaffNotes(e.target.value)} rows={2} className="mt-1 w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
           {/* Unavailable Dates Management */}
           <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Onbeschikbare Datums</label>
            <div className="flex items-center space-x-2 mb-2">
                <input 
                    type="date" 
                    value={currentUnavailableDateInput} 
                    onChange={e => setCurrentUnavailableDateInput(e.target.value)}
                    className="p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button type="button" onClick={handleAddUnavailableDate} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md shadow-sm">Datum Toevoegen</button>
            </div>
            {staffUnavailableDates.length > 0 && (
                <ul className="list-disc list-inside pl-1 space-y-1 max-h-24 overflow-y-auto text-sm">
                    {staffUnavailableDates.map(date => (
                        <li key={date} className="text-slate-700 flex justify-between items-center bg-slate-100 p-1 rounded-md">
                            {new Date(date+"T00:00:00").toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                            <button type="button" onClick={() => handleRemoveUnavailableDate(date)} className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100" aria-label={`Verwijder ${date}`}>
                              <XMarkIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm shadow-sm">
              {isEditingStaff ? 'Opslaan' : 'Toevoegen'}
            </button>
            {isEditingStaff && <button type="button" onClick={() => setIsEditingStaff(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3 rounded-md text-sm">Annuleren</button>}
          </div>
        </form>

        <h3 className="text-lg font-semibold text-indigo-600 mt-8 mb-3">Bestaand Personeel ({staffMembers.length})</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar">
          {staffMembers.length === 0 && <p className="text-slate-500 italic">Geen personeel gevonden.</p>}
          {staffMembers.map(sm => (
            <div key={sm.id} className="p-3 border border-slate-200 rounded-md bg-white flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium text-slate-800">{sm.name} <span className="text-xs text-slate-500">({sm.role})</span></p>
                {sm.contactInfo && <p className="text-xs text-slate-600">Contact: {sm.contactInfo}</p>}
                {sm.notes && <p className="text-xs text-slate-500 italic" title={sm.notes}>Notitie: {sm.notes.substring(0,50)}{sm.notes.length > 50 ? '...' : ''}</p>}
                {sm.unavailableDates && sm.unavailableDates.length > 0 && <p className="text-xs text-orange-600">Onbeschikbaar op: {sm.unavailableDates.length} dag(en)</p>}
              </div>
              <div className="space-x-2 flex-shrink-0">
                <button onClick={() => setIsEditingStaff(sm)} className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium py-1 px-2 rounded">Bewerk</button>
                <button onClick={() => handleDeleteStaff(sm.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-2 rounded">Verwijder</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scheduling Section */}
      <section className="p-4 md:p-6 bg-slate-50 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Show Planning</h2>
        <CalendarView
          showSlots={availableShowSlots}
          selectedDate={selectedCalendarDate}
          onDateSelect={setSelectedCalendarDate}
          className="mb-6 bg-white p-4 rounded-lg shadow border border-slate-200"
        />

        {selectedCalendarDate && (
          <div>
            <h3 className="text-lg font-semibold text-indigo-600 mb-3">
              Shows op {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {showsForSelectedDate.length === 0 && <p className="text-slate-500 italic">Geen shows gepland op deze datum.</p>}
            <div className="space-y-6">
              {showsForSelectedDate.map(slot => {
                const scheduledZaal = getScheduledStaffForSlotAndRole(slot.id, StaffRole.ZAAL);
                const scheduledKeuken = getScheduledStaffForSlotAndRole(slot.id, StaffRole.KEUKEN);
                const availableZaalStaff = getAvailableStaffForSlotAndRole(slot, StaffRole.ZAAL);
                const availableKeukenStaff = getAvailableStaffForSlotAndRole(slot, StaffRole.KEUKEN);
                
                return (
                  <div key={slot.id} className="p-4 border border-indigo-200 rounded-lg bg-white shadow-md">
                    <h4 className="font-semibold text-md text-indigo-800">{slot.time} (Bezetting: {slot.bookedCount}/{slot.capacity}) {slot.isManuallyClosed ? <span className="text-orange-600">(Gesloten)</span>:''}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                      {/* Zaal Section */}
                      <div className="space-y-2 p-3 bg-indigo-50 rounded-md border border-indigo-100">
                        <h5 className="font-medium text-indigo-700">Zaal Personeel ({scheduledZaal.length})</h5>
                        {scheduledZaal.map(shift => {
                          const staff = staffMembers.find(sm => sm.id === shift.staffMemberId);
                          return (
                            <div key={shift.id} className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-indigo-200">
                              <span>{staff?.name || 'Onbekend'} {shift.shiftNotes && <em className="text-slate-500 text-[10px]" title={shift.shiftNotes}>({shift.shiftNotes.substring(0,30)}{shift.shiftNotes.length > 30 ? '...' : ''})</em>}</span>
                              <button onClick={() => onUnscheduleStaff(shift.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold px-1">X</button>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-indigo-100">
                            <select 
                                value={staffToSchedule[slot.id]?.[StaffRole.ZAAL] || ''} 
                                onChange={e => handleStaffToScheduleChange(slot.id, StaffRole.ZAAL, e.target.value)}
                                className="w-full p-1.5 border-slate-300 rounded-md text-xs mb-1 focus:ring-indigo-400 focus:border-indigo-400"
                                disabled={availableZaalStaff.length === 0}
                            >
                                <option value="" disabled>{availableZaalStaff.length === 0 ? 'Geen beschikbaar' : 'Selecteer Zaalpersoneel'}</option>
                                {availableZaalStaff.map(sm => {
                                    const isUnavailable = sm.unavailableDates?.includes(slot.date);
                                    return <option key={sm.id} value={sm.id} className={isUnavailable ? 'text-orange-600' : ''}>{sm.name}{isUnavailable ? ' (Onbeschikbaar)' : ''}</option>
                                })}
                            </select>
                            <input type="text" placeholder="Shift notitie (optioneel)" value={shiftNotes[slot.id]?.[StaffRole.ZAAL] || ''} onChange={e => handleShiftNotesChange(slot.id, StaffRole.ZAAL, e.target.value)} className="w-full p-1.5 border-slate-300 rounded-md text-xs mb-1 focus:ring-indigo-400 focus:border-indigo-400" />
                            <button onClick={() => handleScheduleStaffMember(slot.id, StaffRole.ZAAL)} disabled={!staffToSchedule[slot.id]?.[StaffRole.ZAAL]} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-1 px-2 rounded-md disabled:bg-slate-300">Voeg Zaal Toe</button>
                        </div>
                      </div>
                      {/* Keuken Section */}
                      <div className="space-y-2 p-3 bg-purple-50 rounded-md border border-purple-100">
                        <h5 className="font-medium text-purple-700">Keuken Personeel ({scheduledKeuken.length})</h5>
                        {scheduledKeuken.map(shift => {
                          const staff = staffMembers.find(sm => sm.id === shift.staffMemberId);
                          return (
                            <div key={shift.id} className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-purple-200">
                               <span>{staff?.name || 'Onbekend'} {shift.shiftNotes && <em className="text-slate-500 text-[10px]" title={shift.shiftNotes}>({shift.shiftNotes.substring(0,30)}{shift.shiftNotes.length > 30 ? '...' : ''})</em>}</span>
                              <button onClick={() => onUnscheduleStaff(shift.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold px-1">X</button>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-purple-100">
                            <select 
                                value={staffToSchedule[slot.id]?.[StaffRole.KEUKEN] || ''} 
                                onChange={e => handleStaffToScheduleChange(slot.id, StaffRole.KEUKEN, e.target.value)}
                                className="w-full p-1.5 border-slate-300 rounded-md text-xs mb-1 focus:ring-purple-400 focus:border-purple-400"
                                disabled={availableKeukenStaff.length === 0}
                            >
                                <option value="" disabled>{availableKeukenStaff.length === 0 ? 'Geen beschikbaar' : 'Selecteer Keukenpersoneel'}</option>
                                 {availableKeukenStaff.map(sm => {
                                    const isUnavailable = sm.unavailableDates?.includes(slot.date);
                                    return <option key={sm.id} value={sm.id} className={isUnavailable ? 'text-orange-600' : ''}>{sm.name}{isUnavailable ? ' (Onbeschikbaar)' : ''}</option>
                                })}
                            </select>
                             <input type="text" placeholder="Shift notitie (optioneel)" value={shiftNotes[slot.id]?.[StaffRole.KEUKEN] || ''} onChange={e => handleShiftNotesChange(slot.id, StaffRole.KEUKEN, e.target.value)} className="w-full p-1.5 border-slate-300 rounded-md text-xs mb-1 focus:ring-purple-400 focus:border-purple-400" />
                            <button onClick={() => handleScheduleStaffMember(slot.id, StaffRole.KEUKEN)} disabled={!staffToSchedule[slot.id]?.[StaffRole.KEUKEN]} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded-md disabled:bg-slate-300">Voeg Keuken Toe</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
