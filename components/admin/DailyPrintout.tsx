
import React, { useState, useMemo } from 'react';
import { ReservationDetails, ShowSlot, Customer } from '../../types';

interface DailyPrintoutProps {
  bookings: ReservationDetails[];
  showSlots: ShowSlot[];
  customers: Customer[]; 
}

export const DailyPrintout: React.FC<DailyPrintoutProps> = ({ bookings, showSlots, customers }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const getCustomerName = (customerId?: string) => customers.find(c => c.id === customerId)?.name;
  const getShowDetails = (slotId: string) => showSlots.find(s => s.id === slotId);

  const bookingsForDateGroupedAndSorted = useMemo(() => {
    const filtered = bookings.filter(b => {
      const show = getShowDetails(b.showSlotId);
      return show && show.date === selectedDate && b.status === 'confirmed';
    });

    const groupedByTime: Record<string, ReservationDetails[]> = {};
    filtered.forEach(booking => {
      const show = getShowDetails(booking.showSlotId);
      if (show) {
        if (!groupedByTime[show.time]) {
          groupedByTime[show.time] = [];
        }
        groupedByTime[show.time].push(booking);
      }
    });

    for (const time in groupedByTime) {
      groupedByTime[time].sort((a,b) => new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime());
      // Assign table numbers
      groupedByTime[time].forEach((booking, index) => {
        (booking as any).tableNumber = index + 1;
      });
    }
    return groupedByTime;
  }, [bookings, showSlots, selectedDate]);

  const totalBookingsForDay = Object.values(bookingsForDateGroupedAndSorted).flat().length;
  const totalGuestsForDay = Object.values(bookingsForDateGroupedAndSorted).flat().reduce((sum, b) => sum + b.guests, 0);
  
  const handlePrint = () => {
    // The @media print styles in index.html will handle the layout
    window.print();
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <div className="no-print mb-6 flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
        <div>
          <label htmlFor="printDate" className="block text-sm font-medium text-gray-600 mb-1">Selecteer Datum</label>
          <input type="date" id="printDate" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <button onClick={handlePrint} disabled={totalBookingsForDay === 0} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:bg-gray-300">Print Lijst</button>
      </div>

      {totalBookingsForDay === 0 && selectedDate && (
        <p className="text-gray-500 italic no-print">Geen reserveringen gevonden voor {new Date(selectedDate+'T00:00:00').toLocaleDateString('nl-NL')}.</p>
      )}

      <div id="print-area" className="printable-content"> {/* Added printable-content class for specific print styling if needed */}
        {totalBookingsForDay > 0 && (
          <>
            <h1>Reserveringen voor {new Date(selectedDate+'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>
            <h2>Totaal: {totalGuestsForDay} gasten ({totalBookingsForDay} reserveringen)</h2>
            {Object.entries(bookingsForDateGroupedAndSorted).sort(([timeA], [timeB]) => timeA.localeCompare(timeB)).map(([showTime, bookingsInGroup]) => (
                <div key={showTime} className="invoice-section"> {/* Added class for page-break-inside control */}
                    <h3>Show om {showTime} (Totaal gasten: {bookingsInGroup.reduce((sum,b) => sum+b.guests, 0)})</h3>
                    <table className="invoice-table"> {/* Applied invoice-table class for consistent print styling */}
                    <thead>
                        <tr>
                        <th>Tafel</th><th>Naam</th><th>#</th><th>Arrangement</th><th>Contact & Adres</th><th>MPL / Voorkeur / Admin Notitie</th><th>Dieet/Viering/Extra's</th><th>Merch.</th><th>Factuur</th><th>Betaald</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookingsInGroup.map(booking => {
                        const customerName = booking.customerId ? getCustomerName(booking.customerId) : booking.name;
                        return (
                            <tr key={booking.reservationId}>
                            <td>{(booking as any).tableNumber}</td>
                            <td>
                                {customerName || booking.name}
                                {customerName && customerName !== booking.name && <div className="booking-name-note">(Boeking: {booking.name})</div>}
                            </td>
                            <td>{booking.guests}</td>
                            <td>{booking.packageName}</td>
                            <td>
                                {booking.email}<br/>{booking.phone}
                                {booking.address && <><br/>{booking.address.street} {booking.address.houseNumber}<br/>{booking.address.postalCode} {booking.address.city}</>}
                            </td>
                            <td>
                                {booking.isMPL && <div className="mpl-yes">MPL: Ja</div>}
                                {booking.placementPreferenceDetails && <div className="placement-details">Voorkeur: {booking.placementPreferenceDetails}</div>}
                                {booking.internalAdminNotes && <div className="admin-notes">Admin: {booking.internalAdminNotes}</div>}
                            </td>
                            <td>
                                {booking.dietaryWishes && <div className="dietary">{booking.dietaryWishes}</div>}
                                {booking.celebrationDetails && <div><i>Te vieren: {booking.celebrationDetails}</i></div>}
                                {booking.selectedVoorborrel && <div className="extras-info">Borrel Vooraf</div>}
                                {booking.selectedNaborrel && <div className="extras-info">AfterParty</div>}
                            </td>
                            <td>
                                {booking.merchandise && booking.merchandise.length > 0 ? (<ul>{booking.merchandise.map(m => <li key={m.itemId}>{m.quantity}x {m.itemName}</li>)}</ul>) : '-'}
                            </td>
                            <td className="invoice-info">
                                {booking.invoiceDetails?.needsInvoice && booking.invoiceDetails.companyName ? (
                                    <>
                                    {booking.invoiceDetails.companyName}
                                    {booking.invoiceDetails.vatNumber && <><br/>BTW: {booking.invoiceDetails.vatNumber}</>}
                                    {booking.invoiceDetails.invoiceAddress?.street && <><br/>Adres: {booking.invoiceDetails.invoiceAddress.street} {booking.invoiceDetails.invoiceAddress.houseNumber}, {booking.invoiceDetails.invoiceAddress.postalCode} {booking.invoiceDetails.invoiceAddress.city}</>}
                                    {booking.invoiceDetails.remarks && <><br/>Opmerking: {booking.invoiceDetails.remarks}</>}
                                    </>
                                ): booking.invoiceDetails?.needsInvoice ? "Ja, details missen" : "Nee"}
                            </td>
                            <td className={booking.isPaid ? 'paid-status-yes' : 'paid-status-no'}>
                                {booking.isPaid ? 'Ja' : 'Nee'}
                            </td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
            ))}
          </>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500 no-print">De print layout wordt bepaald door de browserinstellingen en de CSS `@media print` regels.</p>
    </div>
  );
};
