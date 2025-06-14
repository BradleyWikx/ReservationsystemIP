import React, { useState } from 'react';
import { ReservationDetails, Customer, ReservationStatus, Invoice } from '../../types'; 
import { LoginForm } from '../auth/LoginForm'; 
import { RegistrationForm } from '../auth/RegistrationForm'; 
import { User } from 'firebase/auth'; // Import User type

interface UserAccountPageProps {
  onNavigateToHome: () => void;
  loggedInCustomer: Customer | null;
  firebaseUser: User | null; // Add firebaseUser prop
  onLogout: () => void;
  userBookings: ReservationDetails[];
  allInvoices: Invoice[]; // Added to get invoice due dates
  onUpdateGuestCount: (bookingId: string, newGuestCount: number) => Promise<boolean>;
  onCancelBooking: (bookingId: string) => Promise<boolean>;
  onRequestDateChange: (bookingId: string, remarks: string) => Promise<boolean>;
  confirmAction: (title: string, message: React.ReactNode, confirmText?: string, cancelText?: string) => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const getStatusBadgeClasses = (status: ReservationStatus): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-200 text-green-800 border-green-400';
      case 'pending_approval': return 'bg-amber-200 text-amber-800 border-amber-400';
      case 'waitlisted': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'rejected': return 'bg-red-200 text-red-800 border-red-400';
      case 'moved_to_waitlist': return 'bg-slate-300 text-slate-800 border-slate-500';
      case 'pending_date_change': return 'bg-purple-200 text-purple-800 border-purple-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
};

const getStatusText = (status: ReservationStatus): string => {
    switch (status) {
      case 'confirmed': return 'Bevestigd';
      case 'pending_approval': return 'In Aanvraag';
      case 'waitlisted': return 'Op Wachtlijst';
      case 'rejected': return 'Afgewezen/Geannuleerd';
      case 'moved_to_waitlist': return 'Verplaatst (Wachtlijst)';
      case 'pending_date_change': return 'Datumwijziging Aangevraagd';
      default:
        const _exhaustiveCheck: never = status;
        console.error(`Unexpected booking status received: ${_exhaustiveCheck}`);
        return "Status Onbekend";
    }
};

// Helper function (could be moved to utils if used elsewhere)
const isDateAtLeastXWeeksAwayUser = (dateStr: string, weeks: number): boolean => {
  const showDate = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = showDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= weeks * 7;
};

export const UserAccountPage: React.FC<UserAccountPageProps> = ({ 
    onNavigateToHome, 
    loggedInCustomer, 
    firebaseUser,
    onLogout, 
    userBookings,
    allInvoices,
    onUpdateGuestCount,
    onCancelBooking,
    onRequestDateChange,
    confirmAction,
    showToast,
}) => {
  const logoUrl = "./logo-ip.png"; 
  const [showRegistration, setShowRegistration] = useState(false); 

  const handleLoginSuccess = () => {
    // This function can be called by LoginForm upon successful login
    // to potentially trigger UI changes in UserAccountPage if needed,
    // though App.tsx's onAuthStateChanged should handle the main state updates.
    showToast('Succesvol ingelogd via Mijn Account pagina.', 'success');
  };

  const handleRegisterSuccess = () => {
    // Similar to handleLoginSuccess, for registration.
    setShowRegistration(false); // Switch back to login form view or main account view
    showToast('Registratie succesvol! U bent nu ingelogd.', 'success');
  };

  const sortedUserBookings = userBookings.sort((a, b) => 
    new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()
  );

  const handleGuestCountChange = async (booking: ReservationDetails) => {
    const currentGuests = booking.guests;
    const newGuestsStr = prompt(`Huidig aantal gasten: ${currentGuests}. Voer nieuw aantal gasten in:`, currentGuests.toString());
    if (newGuestsStr === null) return; // User cancelled
    
    const newGuests = parseInt(newGuestsStr, 10);
    if (isNaN(newGuests) || newGuests <= 0) {
      showToast('Ongeldig aantal gasten ingevoerd.', 'error');
      return;
    }
    if (newGuests === currentGuests) {
      showToast('Aantal gasten is niet gewijzigd.', 'info');
      return;
    }
    
    const confirmed = await confirmAction(
        'Aantal Gasten Wijzigen', 
        `Weet u zeker dat u het aantal gasten wilt wijzigen van ${currentGuests} naar ${newGuests} voor de show op ${new Date(booking.date + 'T00:00:00').toLocaleDateString('nl-NL')}? Dit kan invloed hebben op uw factuur.`,
        'Ja, Wijzig', 'Nee, Annuleer'
    );
    if (confirmed) {
      await onUpdateGuestCount(booking.reservationId, newGuests);
    }
  };

  const handleCancelBooking = async (booking: ReservationDetails) => {
     const confirmed = await confirmAction(
        'Boeking Annuleren', 
        `Weet u zeker dat u uw boeking voor de show op ${new Date(booking.date + 'T00:00:00').toLocaleDateString('nl-NL')} wilt annuleren?`,
        'Ja, Annuleer Boeking', 'Nee'
    );
    if (confirmed) {
      await onCancelBooking(booking.reservationId);
    }
  };
  
  const handleDateChangeRequest = async (booking: ReservationDetails) => {
    const remarks = prompt("Heeft u een voorkeur voor een nieuwe datum of een opmerking voor uw verzoek? (Optioneel)", "");
    if (remarks === null) return; // User cancelled prompt

    const confirmed = await confirmAction(
        'Datumwijziging Aanvragen',
        `U staat op het punt een verzoek in te dienen om de datum van uw boeking voor ${new Date(booking.date + 'T00:00:00').toLocaleDateString('nl-NL')} te wijzigen. Wij nemen contact met u op om de mogelijkheden te bespreken.\n\nUw opmerking: "${remarks || 'Geen opmerking'}"\n\nDoorgaan?`,
        'Ja, Verzoek Indienen', 'Nee'
    );
    if (confirmed) {
        await onRequestDateChange(booking.reservationId, remarks || 'Geen specifieke voorkeur opgegeven.');
    }
  };

  const canModifyGuests = (bookingDate: string) => isDateAtLeastXWeeksAwayUser(bookingDate, 2);
  const canCancelBooking = (bookingDate: string) => isDateAtLeastXWeeksAwayUser(bookingDate, 3);
  // Date change requests can be made up to, e.g., 1 week before, or always if admin handles it. Let's use 1 week for now.
  const canRequestDateChange = (bookingDate: string, status: ReservationStatus) => status === 'confirmed' && isDateAtLeastXWeeksAwayUser(bookingDate, 1);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-4 md:p-8 flex flex-col items-center selection:bg-amber-500 selection:text-amber-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12 w-full text-center">
          <img 
            src={logoUrl} 
            alt="Inspiration Point Logo" 
            className="w-auto h-auto max-h-[80px] md:max-h-[120px] mx-auto object-contain mb-4 md:mb-5 drop-shadow-lg"
          />
          <h1 className="font-display-black text-3xl sm:text-4xl text-amber-400 mb-3 tracking-tight">
            Mijn Account
          </h1>
        </header>

        <div className="w-full bg-slate-800 bg-opacity-60 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700">
          {!loggedInCustomer ? (
            <section>
              {showRegistration ? (
                <>
                  <h2 className="text-xl font-display text-amber-300 mb-4 text-center">Nieuw Account Registreren</h2>
                  <RegistrationForm 
                    // onRegister prop is removed, internal Firebase logic handles it.
                    // Add onSuccess to handle UI changes post-registration if needed.
                    onSuccess={handleRegisterSuccess} 
                    showToast={showToast} // Pass showToast for notifications
                    onNavigateToLogin={() => setShowRegistration(false)} 
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-display text-amber-300 mb-4 text-center">Inloggen</h2>
                  <LoginForm 
                    // onLogin prop is removed, internal Firebase logic handles it.
                    // Add onSuccess to handle UI changes post-login if needed.
                    onSuccess={handleLoginSuccess}
                    showToast={showToast} // Pass showToast for notifications
                    onNavigateToRegister={() => setShowRegistration(true)}
                  />
                </>
              )}
            </section>
          ) : (
            <>
              <section className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-3 border-b border-slate-700">
                    <h2 className="text-xl font-display text-amber-300">Welkom, {loggedInCustomer.name || loggedInCustomer.email}!</h2>
                    <button 
                        onClick={onLogout}
                        className="mt-3 sm:mt-0 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                    >
                        Uitloggen
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-slate-700 bg-opacity-50 rounded-lg border border-slate-600 text-sm">
                    <h3 className="text-md font-semibold text-amber-200 mb-2">Mijn Gegevens</h3>
                    <p><span className="font-medium text-slate-300">Naam:</span> {loggedInCustomer.name}</p>
                    <p><span className="font-medium text-slate-300">E-mail:</span> {loggedInCustomer.email}</p>
                    {loggedInCustomer.phone && <p><span className="font-medium text-slate-300">Telefoon:</span> {loggedInCustomer.phone}</p>}
                    {loggedInCustomer.address && (loggedInCustomer.address.street || loggedInCustomer.address.city) && (
                        <p><span className="font-medium text-slate-300">Adres:</span> {loggedInCustomer.address.street} {loggedInCustomer.address.houseNumber}, {loggedInCustomer.address.postalCode} {loggedInCustomer.address.city}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">Om uw gegevens te wijzigen, neem contact op.</p>
                </div>


                <h3 className="text-lg font-semibold text-amber-200 mb-3">Mijn Reserveringen ({sortedUserBookings.length})</h3>
                {sortedUserBookings.length === 0 ? (
                  <div className="p-4 bg-slate-700 bg-opacity-50 rounded-lg border border-slate-600 text-center">
                    <p className="text-slate-400">U heeft nog geen reserveringen.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 scrollbar">
                    {sortedUserBookings.map(booking => {
                      const badgeClasses = getStatusBadgeClasses(booking.status);
                      const statusText = getStatusText(booking.status);
                      const invoice = booking.invoiceId ? allInvoices.find(inv => inv.id === booking.invoiceId) : null;
                      
                      const canModify = canModifyGuests(booking.date) && booking.status === 'confirmed';
                      const canCancel = canCancelBooking(booking.date) && booking.status === 'confirmed';
                      const canRequestChange = canRequestDateChange(booking.date, booking.status);

                      return (
                        <div key={booking.reservationId} className={`p-4 rounded-lg shadow-md border ${badgeClasses.replace('bg-', 'border-').replace('-200', '-400')} bg-slate-700 bg-opacity-70`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start">
                            <div>
                              <h4 className="text-md font-semibold text-amber-300">
                                {new Date(booking.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} om {booking.time}
                              </h4>
                              <p className="text-sm text-slate-300">{booking.packageName}</p>
                              <p className="text-xs text-slate-400">Aantal gasten: {booking.guests}</p>
                              {booking.isPaid ? (
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-500 text-white">Betaald</span>
                              ) : (
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white">Nog te betalen</span>
                              )}
                              {invoice && <span className="text-xs text-slate-400 ml-2"> (Factuur vervalt op: {new Date(invoice.dueDate+'T00:00:00').toLocaleDateString('nl-NL')})</span>}
                            </div>
                            <span className={`mt-2 sm:mt-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClasses}`}>
                              {statusText}
                            </span>
                          </div>
                          {booking.celebrationDetails && <p className="text-xs text-slate-300 mt-1">Viering: {booking.celebrationDetails}</p>}
                          {booking.dietaryWishes && <p className="text-xs text-orange-300 mt-1">Dieet: {booking.dietaryWishes}</p>}
                          {booking.merchandise && booking.merchandise.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-slate-300 font-medium">Merchandise:</p>
                              <ul className="list-disc list-inside ml-4 text-xs text-slate-400">
                                {booking.merchandise.map(m => <li key={m.itemId}>{m.quantity}x {m.itemName}</li>)}
                              </ul>
                            </div>
                          )}
                          {booking.needsInvoiceReview && <p className="text-xs text-amber-400 mt-1">Let op: Uw factuur wordt herzien vanwege recente wijzigingen.</p>}
                          {booking.userModificationRequest && booking.status === 'pending_date_change' && <p className="text-xs text-purple-300 mt-1">Verzoek: {booking.userModificationRequest}</p>}
                          
                          <div className="mt-3 pt-2 border-t border-slate-600 flex flex-wrap gap-2">
                            {invoice && (
                                <button onClick={() => window.location.hash = `#admin?mode=invoices&viewInvoiceId=${invoice.id}`}
                                className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium py-1 px-2.5 rounded-md shadow-sm transition-colors">
                                Bekijk Factuur
                                </button>
                            )}
                            {canModify && (
                                <button onClick={() => handleGuestCountChange(booking)}
                                className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-1 px-2.5 rounded-md shadow-sm transition-colors">
                                Aantal Wijzigen
                                </button>
                            )}
                            {canCancel && (
                                <button onClick={() => handleCancelBooking(booking)}
                                className="text-xs bg-red-600 hover:bg-red-500 text-white font-medium py-1 px-2.5 rounded-md shadow-sm transition-colors">
                                Annuleren
                                </button>
                            )}
                             {canRequestChange && (
                                <button onClick={() => handleDateChangeRequest(booking)}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium py-1 px-2.5 rounded-md shadow-sm transition-colors">
                                Datum Wijzigen (Aanvraag)
                                </button>
                            )}
                          </div>
                           <p className="text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-600">ID: ...{booking.reservationId.slice(-6)} | Geboekt op: {new Date(booking.bookingTimestamp).toLocaleDateString('nl-NL')}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
          
          <div className="mt-8 text-center">
            <button 
              onClick={onNavigateToHome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Terug naar Home
            </button>
          </div>
        </div>
        
        <footer className="text-center mt-10 py-4">
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Inspiration Point</p>
        </footer>
      </div>
    </div>
  );
};