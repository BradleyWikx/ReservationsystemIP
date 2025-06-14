
import React, { useState, useMemo } from 'react';
import { ReservationDetails, ShowSlot, PackageOption, Customer, Invoice, ReservationStatus } from '../../types';
import { CalendarView } from '../CalendarView';

interface BookingViewerProps {
  bookings: ReservationDetails[];
  showSlots: ShowSlot[];
  allPackages: PackageOption[];
  onOpenEditModal: (booking: ReservationDetails) => void;
  customers: Customer[];
  onGenerateInvoice: (reservationId: string) => Promise<Invoice | null>;
  invoices: Invoice[];
}

const getStatusTextAndClass = (status: ReservationStatus): { text: string; className: string } => {
    switch (status) {
      case 'confirmed': return { text: 'Bevestigd', className: 'bg-green-200 text-green-700 border-green-300' };
      case 'pending_approval': return { text: 'Wacht Goedkeuring', className: 'bg-yellow-200 text-yellow-700 border-yellow-300' };
      case 'waitlisted': return { text: 'Wachtlijst', className: 'bg-blue-200 text-blue-700 border-blue-300' };
      case 'rejected': return { text: 'Afgewezen/Geannuleerd', className: 'bg-red-200 text-red-700 border-red-300' };
      case 'moved_to_waitlist': return { text: 'Verplaatst (Wachtlijst)', className: 'bg-gray-200 text-gray-700 border-gray-300' };
      case 'pending_date_change': return { text: 'Datumwijziging Aanvraag', className: 'bg-purple-200 text-purple-700 border-purple-300' };
      default: return { text: status, className: 'bg-gray-200 text-gray-700 border-gray-300' };
    }
};

export const BookingViewer: React.FC<BookingViewerProps> = ({ bookings, showSlots, allPackages, onOpenEditModal, customers, onGenerateInvoice, invoices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const getShowDetails = (slotId: string) => showSlots.find(s => s.id === slotId);
  const getCustomerName = (customerId?: string) => customers.find(c => c.id === customerId)?.name;

  const datesWithBookings = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(booking => {
      const show = getShowDetails(booking.showSlotId);
      if (show && (booking.status === 'confirmed' || booking.status === 'pending_approval' || booking.status === 'pending_date_change')) {
        dates.add(show.date);
      }
    });
    return dates;
  }, [bookings, showSlots]);

  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];

    return bookings
      .filter(booking => {
        const show = getShowDetails(booking.showSlotId);
        return show && show.date === selectedCalendarDate && (booking.status === 'confirmed' || booking.status === 'pending_approval' || booking.status === 'pending_date_change');
      })
      .sort((a, b) => {
        const showA = getShowDetails(a.showSlotId);
        const showB = getShowDetails(b.showSlotId);
        if (showA && showB && showA.time !== showB.time) {
          return showA.time.localeCompare(showB.time);
        }
        return new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime();
      });
  }, [selectedCalendarDate, bookings, showSlots]);

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
        (booking as any).tableNumber = index + 1;
      });
    });
    return grouped;
  }, [bookingsForSelectedDate, showSlots]);


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
            const invoiceNumberMatch = invoices.find(inv => inv.id === booking.invoiceId)?.invoiceNumber.toLowerCase().includes(searchTermLower);
            const statusMatch = getStatusTextAndClass(booking.status).text.toLowerCase().includes(searchTermLower);
            return nameMatch || emailMatch || reservationIdMatch || invoiceIdMatch || invoiceNumberMatch || statusMatch;
        });
        if(searchedBookings.length > 0) {
            filteredGroups[time] = searchedBookings;
        }
    });
    return filteredGroups;
  }, [bookingsGroupedByShowTime, searchTerm, selectedCalendarDate, customers, invoices]);

  const totalGuestsForDay = Object.values(filteredAndSearchedBookingsByShowTime).flat().reduce((sum, b) => sum + b.guests, 0);
  const totalBookingsForDay = Object.values(filteredAndSearchedBookingsByShowTime).flat().length;

  const handleViewInvoice = (invoiceId: string) => {
    window.location.hash = `#admin?mode=invoices&viewInvoiceId=${invoiceId}`;
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Reserveringen Overzicht</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <h3 className="text-md font-medium text-gray-600 mb-1">Selecteer Showdatum</h3>
          <CalendarView
            showSlots={showSlots}
            selectedDate={selectedCalendarDate}
            onDateSelect={setSelectedCalendarDate}
            datesWithBookings={datesWithBookings}
          />
           <button
              onClick={() => setSelectedCalendarDate(null)}
              className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-md w-full"
            >
              Wis Datumfilter
            </button>
        </div>
        <div className="md:col-span-2">
            <div className="mb-4">
                <label htmlFor="searchTermBookings" className="block text-sm font-medium text-gray-600 mb-1">Zoek op naam/email/ID/factuurnr/status (binnen geselecteerde datum)</label>
                <input type="text" id="searchTermBookings" placeholder="Zoek..." className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
             {selectedCalendarDate && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="text-md font-semibold text-blue-700">
                        Overzicht voor: {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-sm text-blue-600">Totaal Reserveringen: {totalBookingsForDay}</p>
                    <p className="text-sm text-blue-600">Totaal Gasten: {totalGuestsForDay}</p>
                </div>
            )}
        </div>
      </div>

      {!selectedCalendarDate && (
          <p className="text-gray-500 italic text-center py-8">Selecteer een datum in de kalender om boekingen te bekijken.</p>
      )}

      {selectedCalendarDate && totalBookingsForDay === 0 && (
        <p className="text-gray-500 italic">Geen reserveringen gevonden voor {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('nl-NL')} {searchTerm ? 'met de huidige zoekterm.' : '.'}</p>
      )}

      {selectedCalendarDate && totalBookingsForDay > 0 && (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar">
          {Object.entries(filteredAndSearchedBookingsByShowTime)
            .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
            .map(([showTime, bookingsInGroup]) => (
            <div key={showTime}>
              <h3 className="text-lg font-semibold text-indigo-600 mb-2 sticky top-0 bg-white py-1 border-b">Show om {showTime} ({bookingsInGroup.reduce((sum,b)=>sum+b.guests,0)} gasten / {bookingsInGroup.length} res.)</h3>
              <div className="space-y-3">
              {bookingsInGroup.map(booking => {
                const customerNameForDisplay = booking.customerId ? getCustomerName(booking.customerId) : booking.name;
                const existingInvoice = booking.invoiceId ? invoices.find(inv => inv.id === booking.invoiceId) : null;
                const statusInfo = getStatusTextAndClass(booking.status);
                return (
                  <div key={booking.reservationId} className={`p-3 rounded-md shadow-sm border text-xs ${statusInfo.className}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-1.5">
                      <div className="flex-grow">
                        <h4 className="text-sm font-semibold text-blue-700">
                          Tafel {(booking as any).tableNumber}: {customerNameForDisplay || booking.name} ({booking.guests} pers.)
                        </h4>
                        {customerNameForDisplay && customerNameForDisplay !== booking.name && <p className="text-[11px] text-gray-500 italic">(Boeking op naam: {booking.name})</p>}
                        <p className="text-gray-500">{booking.packageName}</p>
                        {existingInvoice && <p className="text-xs text-purple-600">Factuur: {existingInvoice.invoiceNumber} ({existingInvoice.status})</p>}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 sm:mt-0 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.text}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${booking.isPaid ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                          {booking.isPaid ? 'BETAALD' : 'NIET BETAALD'}
                        </span>
                        {booking.isMPL && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-700">MPL</span>}
                        {existingInvoice ? (
                            <button
                                onClick={() => handleViewInvoice(existingInvoice.id)}
                                className="text-[10px] bg-sky-500 hover:bg-sky-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
                            >
                                Bekijk Factuur
                            </button>
                        ) : (
                            booking.status === 'confirmed' &&
                            <button
                                onClick={() => onGenerateInvoice(booking.reservationId)}
                                className="text-[10px] bg-teal-500 hover:bg-teal-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
                            >
                                Maak Factuur
                            </button>
                        )}
                        <button
                          onClick={() => onOpenEditModal(booking)}
                          className="text-[10px] bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-medium py-1 px-2 rounded-md transition-colors"
                        >
                          Bewerk
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1 text-gray-600">
                      <div><strong>Contact:</strong> {booking.email} / {booking.phone}</div>
                      {booking.address && <div><strong>Adres:</strong> {booking.address.street} {booking.address.houseNumber}, {booking.address.postalCode} {booking.address.city}</div>}
                      {booking.celebrationDetails && <div><strong>Te Vieren:</strong> {booking.celebrationDetails}</div>}
                      {booking.dietaryWishes && <div className="font-medium text-orange-600"><strong>Dieetwensen:</strong> {booking.dietaryWishes}</div>}
                      {booking.placementPreferenceDetails && <div><strong>Plaatsvoorkeur:</strong> {booking.placementPreferenceDetails}</div>}
                      {booking.internalAdminNotes && <div className="text-indigo-600"><strong>Admin Notitie:</strong> {booking.internalAdminNotes}</div>}
                      {booking.userModificationRequest && booking.status === 'pending_date_change' && <div className="text-purple-600 font-semibold">Klantverzoek Wijziging: {booking.userModificationRequest}</div>}

                      {(booking.selectedVoorborrel || booking.selectedNaborrel) && (
                        <div>
                          <strong>Extra's:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {booking.selectedVoorborrel && <li>Borrel Vooraf</li>}
                            {booking.selectedNaborrel && <li>AfterParty</li>}
                          </ul>
                        </div>
                      )}

                      {booking.merchandise && booking.merchandise.length > 0 && (
                        <div>
                          <strong>Merchandise:</strong>
                          <ul className="list-disc list-inside ml-2">{booking.merchandise.map(item => (<li key={item.itemId}>{item.quantity}x {item.itemName}</li>))}</ul>
                        </div>
                      )}
                       {booking.invoiceDetails?.needsInvoice && (
                        <div className="lg:col-span-full text-gray-500 italic">
                            Factuur nodig: {booking.invoiceDetails.companyName || 'Ja'} {booking.invoiceDetails.vatNumber && `(VAT: ${booking.invoiceDetails.vatNumber})`}
                        </div>
                      )}
                       {booking.needsInvoiceReview && <div className="text-orange-500 font-bold lg:col-span-full">LET OP: Factuur controleren na wijziging!</div>}
                    </div>
                     <p className="text-[10px] text-gray-400 pt-1 mt-1 border-t border-gray-200">Geboekt: {new Date(booking.bookingTimestamp).toLocaleString('nl-NL', {dateStyle:'short', timeStyle:'short'})} (ID: ...{booking.reservationId.slice(-6)})</p>
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
