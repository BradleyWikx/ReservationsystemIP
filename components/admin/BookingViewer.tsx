import React, { useState, useMemo, Fragment } from 'react'; // Added Fragment
import { ReservationDetails, ShowSlot, Customer, Invoice, AppSettings } from '../../types';
import { CalendarView } from '../CalendarView';

// Helper Icon components (can be moved to a shared icons file)
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M7.5 3.75l.75 4.5M21.75 3.75l-.75 4.5m-16.5 0L5.25 21" /></svg>;
const InvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

interface BookingViewerProps {
  bookings: ReservationDetails[];
  showSlots: ShowSlot[];
  customers: Customer[]; 
  invoices: Invoice[]; 
  appSettings?: AppSettings; 
  onOpenEditModal: (booking: ReservationDetails) => void;
  onDeleteBooking: (bookingId: string, reason: string) => Promise<void>; 
  onGenerateInvoice?: (reservationId: string) => Promise<Invoice | null>; 
  isArchiveView?: boolean; 
}

export const BookingViewer: React.FC<BookingViewerProps> = ({ 
  bookings, 
  showSlots, 
  customers, 
  invoices, 
  onOpenEditModal,
  onDeleteBooking,
  onGenerateInvoice, 
  isArchiveView = false,
 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<ReservationDetails | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

  const toggleBookingExpansion = (reservationId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reservationId)) {
        newSet.delete(reservationId);
      } else {
        newSet.add(reservationId);
      }
      return newSet;
    });
  };

  const getShowDetails = (slotId: string) => showSlots.find(s => s.id === slotId);
  const getCustomerName = (customerId?: string) => customers.find(c => c.id === customerId)?.name;

  const datesWithBookings = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(booking => {
      const show = getShowDetails(booking.showSlotId);
      if (show && (isArchiveView || (booking.status === 'confirmed' || booking.status === 'pending_approval' || booking.status === 'pending_date_change'))) {
        dates.add(show.date);
      }
    });
    return dates;
  }, [bookings, showSlots, isArchiveView]);

  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return bookings
      .filter(booking => {
        const show = getShowDetails(booking.showSlotId);
        return show && show.date === selectedCalendarDate && (isArchiveView || (booking.status === 'confirmed' || booking.status === 'pending_approval' || booking.status === 'pending_date_change'));
      })
      .sort((a, b) => {
        const showA = getShowDetails(a.showSlotId);
        const showB = getShowDetails(b.showSlotId);
        if (showA && showB && showA.time !== showB.time) {
          return showA.time.localeCompare(showB.time);
        }
        return new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime();
      });
  }, [selectedCalendarDate, bookings, showSlots, isArchiveView]);

  const bookingsGroupedByShowTime = useMemo(() => {
    const grouped: Record<string, ReservationDetails[]> = {};
    bookingsForSelectedDate.forEach(booking => {
      const show = getShowDetails(booking.showSlotId);
      if (show) {
        if (!grouped[show.time]) {
          grouped[show.time] = [];
        }
        grouped[show.time].push(booking);
      }
    });
    Object.values(grouped).forEach(group => {
      group.forEach((booking, index) => {
        (booking as any).tableNumber = index + 1; // This might need re-evaluation if sorting changes
      });
    });
    return grouped;
  }, [bookingsForSelectedDate]);


  const filteredAndSearchedBookingsByShowTime = useMemo(() => {
    if (!selectedCalendarDate) return {};
    const filteredGroups: Record<string, ReservationDetails[]> = {};
    Object.entries(bookingsGroupedByShowTime).forEach(([time, bookingsInGroup]) => {
        const searchedBookings = bookingsInGroup.filter(booking => {
            const customerName = booking.customerId ? getCustomerName(booking.customerId) : booking.name;
            const searchTermLower = searchTerm.toLowerCase();
            const nameMatch = customerName?.toLowerCase().includes(searchTermLower) || booking.name.toLowerCase().includes(searchTermLower);
            const emailMatch = booking.email.toLowerCase().includes(searchTermLower);
            const reservationIdMatch = booking.reservationId.toLowerCase().includes(searchTermLower);
            const invoiceIdMatch = booking.invoiceId?.toLowerCase().includes(searchTermLower);
            const existingInvoice = booking.invoiceId ? invoices.find(inv => inv.id === booking.invoiceId) : null;
            const invoiceNumberMatch = existingInvoice?.invoiceNumber?.toLowerCase().includes(searchTermLower);
            const statusMatch = booking.status.toLowerCase().includes(searchTermLower);
            return nameMatch || emailMatch || reservationIdMatch || invoiceIdMatch || !!invoiceNumberMatch || statusMatch;
        });
        if(searchedBookings.length > 0) {
            filteredGroups[time] = searchedBookings;
        }
    });
    return filteredGroups;
  }, [bookingsGroupedByShowTime, searchTerm, selectedCalendarDate, customers, invoices]);

  const totalGuestsForDay = Object.values(filteredAndSearchedBookingsByShowTime).flat().reduce((sum, b) => sum + b.guests, 0);
  const totalBookingsForDay = Object.values(filteredAndSearchedBookingsByShowTime).flat().length;

  const getStatusColorClasses = (status: ReservationDetails['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 border-green-300 text-green-700';
      case 'pending_approval': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'waitlisted': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-700';
      case 'completed': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'pending_payment': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'pending_date_change': return 'bg-purple-100 border-purple-300 text-purple-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };
  
  const getStatusPillColorClasses = (status: ReservationDetails['status']) => {
    switch (status) {
        case 'confirmed': return 'bg-green-200 text-green-800';
        case 'pending_approval': return 'bg-yellow-200 text-yellow-800';
        case 'waitlisted': return 'bg-blue-200 text-blue-800';
        case 'cancelled': return 'bg-red-200 text-red-800';
        case 'completed': return 'bg-gray-200 text-gray-800';
        case 'pending_payment': return 'bg-orange-200 text-orange-800';
        case 'pending_date_change': return 'bg-purple-200 text-purple-800';
        default: return 'bg-gray-200 text-gray-600';
    }
  };


  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        {isArchiveView ? 'Archief: Afgewezen & Geannuleerde Reserveringen' : 'Reserveringen Overzicht'}
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4 flex-shrink-0">
        <div className="md:w-1/3 lg:w-1/4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Selecteer Showdatum</h3>
          <CalendarView
            showSlots={showSlots}
            selectedDate={selectedCalendarDate}
            onDateSelect={setSelectedCalendarDate}
            datesWithBookings={datesWithBookings}
          />
           <button
              onClick={() => setSelectedCalendarDate(null)}
              className="mt-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-md w-full"
            >
              Wis Datumfilter
            </button>
        </div>
        <div className="md:w-2/3 lg:w-3/4">
            <div className="mb-3">
                <label htmlFor="searchTermBookings" className="block text-xs font-medium text-gray-600 mb-0.5">Zoek (naam/email/ID/factuur/status)</label>
                <input type="text" id="searchTermBookings" placeholder="Zoek..." className="w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
             {selectedCalendarDate && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                    <h3 className="font-semibold text-blue-700">
                        Overzicht voor: {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-blue-600">Totaal Reserveringen: {totalBookingsForDay}</p>
                    <p className="text-blue-600">Totaal Gasten: {totalGuestsForDay}</p>
                </div>
            )}
        </div>
      </div>

      {!selectedCalendarDate && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 italic text-center py-8">Selecteer een datum in de kalender om boekingen te bekijken.</p>
          </div>
      )}

      {selectedCalendarDate && totalBookingsForDay === 0 && (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 italic">Geen reserveringen gevonden voor {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('nl-NL')} {searchTerm ? 'met de huidige zoekterm.' : '.'}</p>
        </div>
      )}

      {selectedCalendarDate && totalBookingsForDay > 0 && (
        <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {Object.entries(filteredAndSearchedBookingsByShowTime)
            .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
            .map(([showTime, bookingsInGroup]) => (
            <div key={showTime} className="mb-4">
              <h3 className="text-md font-semibold text-indigo-600 mb-1.5 sticky top-0 bg-white py-1.5 border-b z-10">
                Show om {showTime} ({bookingsInGroup.reduce((sum,b)=>sum+b.guests,0)} gasten / {bookingsInGroup.length} res.)
              </h3>
              <div className="space-y-2">
              {bookingsInGroup.map(booking => {
                const customerNameForDisplay = booking.customerId ? getCustomerName(booking.customerId) : booking.name;
                const existingInvoice = booking.invoiceId ? invoices.find(inv => inv.id === booking.invoiceId) : null;
                const isExpanded = expandedBookings.has(booking.reservationId);

                return (
                  <div key={booking.reservationId} className={`p-2.5 rounded-md shadow-sm border text-[11px] ${getStatusColorClasses(booking.status)}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                      <div className="flex-grow mb-1 sm:mb-0">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center">
                          Tafel {(booking as any).tableNumber}: {customerNameForDisplay || booking.name} ({booking.guests} pers.)
                          {booking.isMPL && <span className="ml-1.5 text-[9px] font-semibold px-1 py-0.5 rounded-full bg-purple-200 text-purple-700">MPL</span>}
                        </h4>
                        <p className="text-gray-500 text-[10px]">{booking.packageName}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0 self-start sm:self-center">
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-full ${getStatusPillColorClasses(booking.status)}`}>
                          {booking.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-full ${booking.isPaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {booking.isPaid ? 'BETAALD' : 'NIET BETAALD'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Collapsible Details Section */}
                    {isExpanded && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-300/50 space-y-1">
                            {customerNameForDisplay && customerNameForDisplay !== booking.name && <p className="text-[10px] text-gray-500 italic">(Boeking op naam: {booking.name})</p>}
                            {existingInvoice && <p className="text-[10px] text-purple-600">Factuur: {existingInvoice.invoiceNumber} ({existingInvoice.status})</p>}
                            <p><strong>Contact:</strong> {booking.email} / {booking.phone}</p>
                            {booking.address && <p><strong>Adres:</strong> {booking.address.street} {booking.address.houseNumber}, {booking.address.postalCode} {booking.address.city}</p>}
                            {booking.celebrationDetails && <p><strong>Te Vieren:</strong> {booking.celebrationDetails}</p>}
                            {booking.dietaryWishes && <p className="font-medium text-orange-600"><strong>Dieetwensen:</strong> {booking.dietaryWishes}</p>}
                            {booking.placementPreferenceDetails && <p><strong>Plaatsvoorkeur:</strong> {booking.placementPreferenceDetails}</p>}
                            {booking.internalAdminNotes && <p className="text-indigo-600"><strong>Admin Notitie:</strong> {booking.internalAdminNotes}</p>}
                            {booking.userModificationRequest && booking.status === 'pending_date_change' && <p className="text-purple-600 font-semibold">Klantverzoek Wijziging: {booking.userModificationRequest}</p>}

                            {(booking.selectedVoorborrel || booking.selectedNaborrel) && (
                                <div>
                                <strong>Extra's:</strong>
                                <ul className="list-disc list-inside ml-2 text-[10px]">
                                    {booking.selectedVoorborrel && <li>Borrel Vooraf</li>}
                                    {booking.selectedNaborrel && <li>AfterParty</li>}
                                </ul>
                                </div>
                            )}

                            {booking.merchandise && booking.merchandise.length > 0 && (
                                <div>
                                <strong>Merchandise:</strong>
                                <ul className="list-disc list-inside ml-2 text-[10px]">{booking.merchandise.map(item => (<li key={item.itemId}>{item.quantity}x {item.itemName}</li>))}</ul>
                                </div>
                            )}
                            {booking.invoiceDetails?.generateInvoice && (
                                <div className="text-gray-500 italic text-[10px]">
                                    Factuur nodig: {booking.invoiceDetails.companyName || 'Ja'} {booking.invoiceDetails.vatNumber && `(VAT: ${booking.invoiceDetails.vatNumber})`}
                                </div>
                            )}
                            {booking.needsInvoiceReview && <div className="text-orange-500 font-bold">LET OP: Factuur controleren na wijziging!</div>}
                            
                            {isArchiveView && booking.status === 'cancelled' && (
                                <div className="text-xs text-red-700 bg-red-50 p-1.5 rounded-md border border-red-200 mt-1">
                                    <p><strong>Geannuleerd op:</strong> {booking.cancellationTimestamp ? new Date(booking.cancellationTimestamp).toLocaleString('nl-NL') : 'N/A'}</p>
                                    <p><strong>Door:</strong> {booking.cancelledBy || 'N/A'}</p>
                                    <p><strong>Reden:</strong> {booking.cancellationReason || 'N/A'}</p>
                                </div>
                           )}
                        </div>
                    )}

                    <div className="flex items-center space-x-1.5 mt-1.5 pt-1 border-t border-gray-300/30">
                        <button 
                            onClick={() => toggleBookingExpansion(booking.reservationId)} 
                            className="text-[10px] px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
                        >
                            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            <span className="ml-1">{isExpanded ? 'Minder' : 'Meer'} Info</span>
                        </button>
                        {booking.invoiceId && invoices.find(inv => inv.id === booking.invoiceId) ? (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-md flex items-center">
                                <InvoiceIcon /> Factuur: {invoices.find(inv => inv.id === booking.invoiceId)?.invoiceNumber}
                            </span>
                        ) : onGenerateInvoice && booking.status === 'confirmed' && (
                            <button 
                                onClick={async () => {
                                if (onGenerateInvoice && booking.id) {
                                    await onGenerateInvoice(booking.id);
                                }
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm transition-colors flex items-center"
                            >
                                <InvoiceIcon /> Maak Factuur
                            </button>
                        )}
                        <button 
                        onClick={() => onOpenEditModal(booking)}
                        className="text-[10px] px-1.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors flex items-center"
                        >
                            <EditIcon /> Wijzig
                        </button>
                        {booking.status !== 'cancelled' && !isArchiveView && (
                        <button 
                            onClick={() => {
                            setBookingToCancel(booking);
                            setIsCancellationModalOpen(true);
                            }}
                            className="text-[10px] px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition-colors flex items-center"
                        >
                           <CancelIcon /> Annuleer
                        </button>
                        )}
                    </div>
                     <p className="text-[9px] text-gray-400 pt-1 mt-1.5 border-t border-gray-200/50">
                        Geboekt: {new Date(booking.bookingTimestamp).toLocaleString('nl-NL', {dateStyle:'short', timeStyle:'short'})} (ID: ...{booking.reservationId.slice(-6)})
                     </p>
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCancellationModalOpen && bookingToCancel && (
        <CancellationReasonModal
          isOpen={isCancellationModalOpen}
          onClose={() => {
            setIsCancellationModalOpen(false);
            setBookingToCancel(null);
          }}
          bookingDetails={bookingToCancel}
          onSubmit={async (reason) => {
            if (bookingToCancel?.id) {
              await onDeleteBooking(bookingToCancel.id, reason);
              setIsCancellationModalOpen(false);
              setBookingToCancel(null);
            }
          }}
        />
      )}
    </div>
  );
};

// Simple CancellationReasonModal (can be moved to its own file)
interface CancellationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: ReservationDetails;
  onSubmit: (reason: string) => Promise<void>;
}

const CancellationReasonModal: React.FC<CancellationReasonModalProps> = ({
  isOpen,
  onClose,
  bookingDetails,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Vul een reden voor annulering in.'); // Replace with a proper toast or validation message
      return;
    }
    await onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Boeking Annuleren</h3>
          <div className="mt-2 px-7 py-3 text-left text-sm">
            <p className="text-gray-600">
              Boeking ID: <span className="font-semibold">{bookingDetails.reservationId.slice(-6)}</span><br/>
              Naam: <span className="font-semibold">{bookingDetails.name}</span><br/>
              {/* Ensure date and time are displayed correctly, assuming they exist on bookingDetails */}
              {/* For example, if showSlotId is used to fetch date/time: */}
              {/* Datum: <span className="font-semibold">{getShowDetails(bookingDetails.showSlotId)?.date}</span> om <span className="font-semibold">{getShowDetails(bookingDetails.showSlotId)?.time}</span><br/> */}
              Gasten: <span className="font-semibold">{bookingDetails.guests}</span><br/>
              Pakket: <span className="font-semibold">{bookingDetails.packageName}</span>
            </p>
            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mt-4">Reden voor annulering:</label>
            <textarea 
              id="cancellationReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              placeholder="Bijv. op verzoek van klant, no-show, etc."
            />
          </div>
          <div className="items-center px-4 py-3 space-x-2">
            <button
              id="confirm-cancel-button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Annulering Bevestigen
            </button>
            <button
              id="abort-cancel-button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-auto hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Afbreken
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
