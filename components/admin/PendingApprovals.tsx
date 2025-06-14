
import React from 'react';
import { ReservationDetails, ShowSlot, ReservationStatus } from '../../types';

interface PendingApprovalsProps {
  bookings: ReservationDetails[]; // This will now include both pending_approval and pending_date_change
  onApprove: (reservationId: string) => void; 
  onReject: (reservationId: string) => void;
  onWaitlist: (reservationId: string) => void;
  showSlots: ShowSlot[];
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({ bookings, onApprove, onReject, onWaitlist, showSlots }) => {

  const sortedBookings = [...bookings]
    .filter(b => b.status === 'pending_approval' || b.status === 'pending_date_change') // Explicitly filter
    .sort((a, b) => new Date(b.bookingTimestamp).getTime() - new Date(a.bookingTimestamp).getTime());

  const getShowDetails = (slotId: string) => showSlots.find(s => s.id === slotId);

  const getStatusSpecificInfo = (status: ReservationStatus) => {
    switch (status) {
      case 'pending_approval': return { title: 'Nieuwe Aanvraag', color: 'yellow' };
      case 'pending_date_change': return { title: 'Verzoek Datumwijziging', color: 'purple' };
      default: return { title: 'Overige Aanvraag', color: 'gray' };
    }
  };


  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Te Beoordelen Aanvragen & Verzoeken ({sortedBookings.length})</h2>

      {sortedBookings.length === 0 ? (
        <p className="text-gray-500 italic">Geen aanvragen die wachten op goedkeuring of behandeling.</p>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar">
          {sortedBookings.map(booking => {
            const show = getShowDetails(booking.showSlotId);
            const bookingDate = show ? new Date(show.date + 'T00:00:00') : null;
            const availableCapacityDirect = show ? show.capacity - show.bookedCount : 0;
            const willExceedCapacityDirectly = show ? booking.guests > availableCapacityDirect : false;
            const statusInfo = getStatusSpecificInfo(booking.status);

            return (
              <div key={booking.reservationId} className={`p-4 rounded-md shadow-sm border bg-${statusInfo.color}-50 border-${statusInfo.color}-300`}>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                  <div>
                    <h3 className={`text-md font-semibold text-${statusInfo.color}-700`}>{statusInfo.title}: {booking.name} - {booking.guests} pers.</h3>
                    <p className={`text-xs text-${statusInfo.color}-600`}>{booking.packageName || 'Onbekend Arrangement'}</p>
                    {booking.status === 'pending_date_change' && booking.userModificationRequest && (
                        <p className={`text-xs text-${statusInfo.color}-700 mt-1`}>Klantverzoek: <em>"{booking.userModificationRequest}"</em></p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
                    {booking.status === 'pending_approval' && (
                        <>
                            <button
                            onClick={() => onApprove(booking.reservationId)}
                            className="w-full sm:w-auto text-xs bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-md transition-colors"
                            aria-label={`Keur aanvraag van ${booking.name} goed`}
                            >
                            Goedkeuren
                            </button>
                            <button
                            onClick={() => onWaitlist(booking.reservationId)}
                            className="w-full sm:w-auto text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md transition-colors"
                            aria-label={`Plaats aanvraag van ${booking.name} op wachtlijst`}
                            >
                            Plaats op Wachtlijst
                            </button>
                        </>
                    )}
                     {booking.status === 'pending_date_change' && (
                        <span className="text-xs text-purple-700 font-medium p-1.5">Handel af via "Boekingen" (bewerk)</span>
                     )}
                     <button
                      onClick={() => onReject(booking.reservationId)}
                      className="w-full sm:w-auto text-xs bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-3 rounded-md transition-colors"
                      aria-label={`Wijs aanvraag van ${booking.name} af`}
                    >
                      {booking.status === 'pending_date_change' ? 'Verzoek Afwijzen' : 'Afwijzen'}
                    </button>
                  </div>
                </div>

                {booking.status === 'pending_approval' && willExceedCapacityDirectly && show && (
                    <p className="text-xs text-red-600 font-semibold mb-1">
                        Let op: Goedkeuren resulteert in {show.bookedCount + booking.guests}/{show.capacity} bezetting (momenteel {availableCapacityDirect > 0 ? availableCapacityDirect : 0} direct vrij).
                    </p>
                )}
                 {booking.status === 'pending_approval' && !willExceedCapacityDirectly && show && availableCapacityDirect < booking.guests && (
                     <p className="text-xs text-yellow-700 font-semibold mb-1">
                        Let op: Er zijn {availableCapacityDirect > 0 ? availableCapacityDirect : 0} plaatsen direct vrij. Goedkeuren kan leiden tot overboeking als andere aanvragen prioriteit krijgen.
                    </p>
                 )}


                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Show:</strong> {show && bookingDate ? `${bookingDate.toLocaleDateString('nl-NL')} om ${show.time}` : 'Onbekende show'} (Huidig: {show?.bookedCount}/{show?.capacity})</p>
                  <p><strong>Contact:</strong> {booking.email} / {booking.phone}</p>
                  {booking.address && <p><strong>Adres:</strong> {booking.address.street} {booking.address.houseNumber}, {booking.address.postalCode} {booking.address.city}</p>}
                  {booking.celebrationDetails && <p><strong>Te Vieren:</strong> {booking.celebrationDetails}</p>}
                  {booking.dietaryWishes && <p className="font-medium text-orange-600"><strong>Dieetwensen:</strong> {booking.dietaryWishes}</p>}

                  {(booking.selectedVoorborrel || booking.selectedNaborrel) && (
                    <div>
                      <p className="font-medium"><strong>Extra's:</strong></p>
                      <ul className="list-disc list-inside ml-4">
                        {booking.selectedVoorborrel && <li>Borrel Vooraf</li>}
                        {booking.selectedNaborrel && <li>AfterParty</li>}
                      </ul>
                    </div>
                  )}
                  {booking.merchandise && booking.merchandise.length > 0 && (
                    <div>
                      <p className="font-medium"><strong>Merchandise:</strong></p>
                      <ul className="list-disc list-inside ml-4">{booking.merchandise.map(item => (<li key={item.itemId}>{item.quantity}x {item.itemName} (€{(item.itemPrice * item.quantity).toFixed(2)})</li>))}</ul>
                    </div>
                  )}
                  <p className="text-gray-600 pt-1 mt-1 border-t border-gray-200">Aangevraagd op: {new Date(booking.bookingTimestamp).toLocaleString('nl-NL')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};