

import React, { useState } from 'react';
import { Customer, ReservationDetails, ShowSlot, PackageOption, MerchandiseItem, SpecialAddOn, ReservationStatus, PromoCode } from '../../types';
import type { ToastMessage } from '../shared/ToastNotifications'; // Import ToastMessage type

interface CustomerManagementProps {
  customers: Customer[];
  allBookings: ReservationDetails[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'creationTimestamp' | 'lastUpdateTimestamp'>) => Promise<Customer | null>; // Changed to Promise
  onUpdateCustomer: (updatedCustomer: Customer) => Promise<boolean>; // Changed to Promise
  onDeleteCustomer: (customerId: string) => Promise<boolean>;
  onOpenEditBookingModal: (booking: ReservationDetails) => void;
  showSlots: ShowSlot[];
  allPackages: PackageOption[];
  onManualBookingSubmit: (
    details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName' | 'packageId' | 'status' | 'customerId'> & { showSlotId: string, packageId: string, isPaid: boolean, appliedPromoCode?: string, discountAmount?: number }
  ) => Promise<boolean>;
  specialAddons: SpecialAddOn[];
  merchandiseItems: MerchandiseItem[];
  showToast: (message: string, type: ToastMessage['type']) => void; 
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  allBookings,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenEditBookingModal,
  showSlots,
  allPackages,
  onManualBookingSubmit,
  specialAddons,
  merchandiseItems,
  showToast,
  applyPromoCode, 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState<Customer | null>(null);
  
  const [isCreatingBookingForCustomer, setIsCreatingBookingForCustomer] = useState(false);


  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddingCustomer(false);
    setIsEditingCustomer(null);
    setIsCreatingBookingForCustomer(false);
  };
  
  const handleCloseDetailView = () => {
    setSelectedCustomer(null);
    setIsAddingCustomer(false);
    setIsEditingCustomer(null);
    setIsCreatingBookingForCustomer(false);
  }

  const handleAddNewCustomer = () => {
    setSelectedCustomer(null);
    setIsAddingCustomer(true);
    setIsEditingCustomer(null);
  };
  
  const handleEditCustomer = (customer: Customer) => {
    setIsEditingCustomer(customer);
    setIsAddingCustomer(false); 
    setSelectedCustomer(customer); 
  };
  
  const handleOpenCreateBookingForCustomer = () => {
    if(selectedCustomer) {
        setIsCreatingBookingForCustomer(true);
        // TODO: Embed ManualBookingForm here or open it in a modal, prefilled.
        // For now, just showing a placeholder message.
        showToast('Nieuw boekingsformulier voor klant wordt voorbereid (nog niet volledig geïmplementeerd).', 'info');
    }
  };


  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-800 mb-3 sm:mb-0">Klantenbeheer ({filteredCustomers.length})</h2>
        <button
          onClick={handleAddNewCustomer}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-md hover:shadow-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nieuwe Klant
        </button>
      </div>
      
      <div className="mb-6">
        <label htmlFor="customerSearch" className="block text-sm font-medium text-slate-600 mb-1">Zoek Klant (Naam, Email, Telefoon)</label>
        <input
          type="text"
          id="customerSearch"
          placeholder="Typ om te zoeken..."
          className="w-full md:w-2/3 lg:w-1/2 border-slate-300 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isAddingCustomer || isEditingCustomer ? (
        <CustomerForm
          customerToEdit={isEditingCustomer}
          onSave={async (customerData, id) => { // Make this async
            let opSuccess = false;
            if (id && isEditingCustomer) { 
              opSuccess = await onUpdateCustomer({ ...customerData, id, creationTimestamp: isEditingCustomer.creationTimestamp, lastUpdateTimestamp: new Date().toISOString() });
            } else { 
              const newCust = await onAddCustomer(customerData);
              if (newCust) {
                opSuccess = true;
                handleSelectCustomer(newCust); 
              }
            }
            if (opSuccess) {
                setIsAddingCustomer(false);
                setIsEditingCustomer(null);
            } else {
                showToast(`Opslaan van klant ${isEditingCustomer ? isEditingCustomer.name : customerData.name} mislukt.`, 'error');
            }
          }}
          onCancel={() => {
            setIsAddingCustomer(false);
            setIsEditingCustomer(null);
          }}
        />
      ) : selectedCustomer ? (
         isCreatingBookingForCustomer && selectedCustomer ? (
            <div className="mt-4 p-6 border border-indigo-200 rounded-lg bg-indigo-50 shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Nieuwe Boeking voor: {selectedCustomer.name}</h3>
                <p className="text-sm text-slate-600">Hier zou een ingebedde versie van het handmatige boekingsformulier komen, vooringevuld met de gegevens van {selectedCustomer.name}.</p>
                <p className="text-sm text-slate-500 italic mt-2">(Volledige formulierintegratie is een toekomstige verbetering.)</p>
                {/* Placeholder for where ManualBookingForm could be embedded or triggered */}
                {/* <ManualBookingForm 
                    availableShowSlots={showSlots} 
                    allPackages={allPackages} 
                    specialAddons={specialAddons} 
                    merchandiseItems={merchandiseItems} 
                    onSubmit={onManualBookingSubmit} // This needs to be adapted to handle customerId
                    applyPromoCode={applyPromoCode} 
                    // initialData={{ customerId: selectedCustomer.id, name: selectedCustomer.name, email: selectedCustomer.email, phone: selectedCustomer.phone, address: selectedCustomer.address }}
                /> */}
                <button onClick={() => setIsCreatingBookingForCustomer(false)} className="mt-5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-medium py-2 px-4 rounded-md text-sm shadow hover:shadow-md">
                    Annuleer Boeking Aanmaken
                </button>
            </div>
        ) : (
            <CustomerDetailView
                customer={selectedCustomer}
                bookings={allBookings.filter(b => b.customerId === selectedCustomer.id)}
                showSlots={showSlots}
                allPackages={allPackages}
                onClose={handleCloseDetailView}
                onEditCustomer={handleEditCustomer}
                onOpenEditBookingModal={onOpenEditBookingModal}
                onCreateBooking={handleOpenCreateBookingForCustomer}
                customers={customers} 
            />
        )
      ) : (
        filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="mt-2 text-slate-500 italic">
              {customers.length === 0 ? "Nog geen klanten in het systeem." : "Geen klanten gevonden voor de zoekterm."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-2 scrollbar">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="bg-slate-50 p-4 rounded-lg shadow-md border border-slate-200 hover:bg-indigo-50 hover:shadow-lg hover:border-indigo-300 cursor-pointer transition-all duration-150 ease-in-out"
                onClick={() => handleSelectCustomer(customer)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectCustomer(customer)}
                role="button"
                tabIndex={0}
              >
                <h3 className="text-md font-semibold text-indigo-700">{customer.name}</h3>
                <p className="text-sm text-slate-600">{customer.email} - {customer.phone}</p>
                <p className="text-xs text-slate-400 mt-1">Aangemaakt: {new Date(customer.creationTimestamp).toLocaleDateString('nl-NL')}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};


interface CustomerDetailViewProps {
  customer: Customer;
  bookings: ReservationDetails[];
  showSlots: ShowSlot[];
  allPackages: PackageOption[];
  customers: Customer[];
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenEditBookingModal: (booking: ReservationDetails) => void;
  onCreateBooking: () => void;
}

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, bookings, showSlots, onClose, onEditCustomer, onOpenEditBookingModal, onCreateBooking, customers }) => {
  const getShowDetails = (slotId: string) => showSlots.find(s => s.id === slotId);
  const getCustomerName = (customerId?: string) => customers.find(c => c.id === customerId)?.name || "Onbekende Klant";

  return (
    <div className="mt-4 p-5 border border-slate-300 rounded-xl bg-white shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-4 border-b border-slate-200">
        <h3 className="text-2xl font-semibold text-indigo-700 mb-2 sm:mb-0">{customer.name}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onEditCustomer(customer)} className="text-xs bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold py-1.5 px-3.5 rounded-md shadow-sm hover:shadow-md transition-all">Bewerk Klant</button>
          <button onClick={onCreateBooking} className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3.5 rounded-md shadow-sm hover:shadow-md transition-all">Nieuwe Boeking</button>
          <button onClick={onClose} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-1.5 px-3.5 rounded-md shadow-sm hover:shadow-md transition-all">Sluit Details</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
        <div><strong>Email:</strong> <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">{customer.email}</a></div>
        <div><strong>Telefoon:</strong> <a href={`tel:${customer.phone}`} className="text-indigo-600 hover:underline">{customer.phone}</a></div>
        {customer.address && (
          <div className="md:col-span-2">
            <strong>Adres:</strong> {customer.address.street} {customer.address.houseNumber}, {customer.address.postalCode} {customer.address.city}
          </div>
        )}
        <div className="text-xs text-slate-500"><strong>Klant Sinds:</strong> {new Date(customer.creationTimestamp).toLocaleDateString('nl-NL')}</div>
        <div className="text-xs text-slate-500"><strong>Laatst Bijgewerkt:</strong> {new Date(customer.lastUpdateTimestamp).toLocaleString('nl-NL', {dateStyle:'short', timeStyle:'short'})}</div>
      </div>

      <h4 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Boekingshistorie ({bookings.length})</h4>
      {bookings.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Geen boekingen gevonden voor deze klant.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
          {bookings.sort((a,b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()).map(booking => {
            const show = getShowDetails(booking.showSlotId);
            const bookingDisplayName = booking.name; // Customer name is on booking.name, actual customer name for account is customer.name
            const statusClasses: Record<ReservationStatus, string> = {
                confirmed: 'bg-green-100 text-green-700 border-green-300',
                pending_approval: 'bg-amber-100 text-amber-700 border-amber-300',
                waitlisted: 'bg-blue-100 text-blue-700 border-blue-300',
                rejected: 'bg-red-100 text-red-700 border-red-300',
                moved_to_waitlist: 'bg-slate-100 text-slate-600 border-slate-300',
                pending_date_change: 'bg-purple-100 text-purple-700 border-purple-300',
            };
            const statusText: Record<ReservationStatus, string> = {
                confirmed: 'Bevestigd',
                pending_approval: 'Wacht op goedk.',
                waitlisted: 'Wachtlijst',
                rejected: 'Afgewezen',
                moved_to_waitlist: 'Verplaatst (wachtl.)',
                pending_date_change: 'Datumwijziging Aangevraagd',
            };
            return (
              <div key={booking.reservationId} className={`p-3 border rounded-lg shadow-sm ${statusClasses[booking.status] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <span className="font-semibold text-sm">{show ? `${new Date(show.date + 'T00:00:00').toLocaleDateString('nl-NL', {weekday:'short',day:'numeric',month:'short'})} ${show.time}` : 'Onbekende Show'}</span> - {booking.guests} pers.
                        <br/><span className="text-xs">{booking.packageName}</span>
                        {customer.name !== bookingDisplayName && <span className="text-slate-500 text-[10px] block italic">(Boeking op naam: {bookingDisplayName})</span>}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusClasses[booking.status]}`}>{statusText[booking.status]}</span>
                        <button onClick={() => onOpenEditBookingModal(booking)} className="text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md shadow-sm transition-colors">Details/Bewerk</button>
                    </div>
                </div>
                {booking.isPaid ? <span className="text-green-600 text-[10px] font-medium">(Betaald)</span> : <span className="text-red-500 text-[10px] font-medium">(Niet Betaald)</span>}
                {booking.isMPL && <span className="ml-2 text-purple-600 text-[10px] font-medium">(MPL)</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CustomerFormProps {
  customerToEdit: Customer | null;
  onSave: (customerData: Omit<Customer, 'id' | 'creationTimestamp' | 'lastUpdateTimestamp'>, id?: string) => Promise<void>; // Changed to Promise<void>
  onCancel: () => void;
}
const CustomerForm: React.FC<CustomerFormProps> = ({ customerToEdit, onSave, onCancel }) => {
    const [name, setName] = useState(customerToEdit?.name || '');
    const [email, setEmail] = useState(customerToEdit?.email || '');
    const [phone, setPhone] = useState(customerToEdit?.phone || '');
    const [address, setAddress] = useState(customerToEdit?.address || { street: '', houseNumber: '', postalCode: '', city: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const commonInputClass = "w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow";
    const commonLabelClass = "text-sm font-medium text-slate-700 block mb-1";
    const errorTextClass = "text-red-600 text-xs mt-0.5";

    const handleSubmit = async (e: React.FormEvent) => { // Make this async
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = "Naam is verplicht.";
        if (!email.trim()) newErrors.email = "Email is verplicht.";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Ongeldig emailformaat.";
        if (!phone.trim()) newErrors.phone = "Telefoon is verplicht.";
        if (!address.street.trim()) newErrors.street = "Straat is verplicht.";
        if (!address.houseNumber.trim()) newErrors.houseNumber = "Huisnummer is verplicht.";
        if (!address.postalCode.trim()) newErrors.postalCode = "Postcode is verplicht.";
        if (!address.city.trim()) newErrors.city = "Plaats is verplicht.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        await onSave({ name, email, phone, address }, customerToEdit?.id);
    };
    
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress(prev => ({...prev, [e.target.name]: e.target.value}));
        if(errors[e.target.name]) setErrors(prevErrors => ({...prevErrors, [e.target.name]: undefined}));
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-5 border border-indigo-200 rounded-xl bg-indigo-50 space-y-4 shadow-lg">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">{customerToEdit ? 'Klant Bewerken' : 'Nieuwe Klant Toevoegen'}</h3>
            {Object.values(errors).length > 0 && <div className="text-red-600 bg-red-100 p-2.5 rounded-md text-xs shadow">{Object.values(errors).map((err, i) => <div key={i}>{err}</div>)}</div>}
            <div>
                <label htmlFor="custName" className={commonLabelClass}>Naam</label>
                <input type="text" id="custName" value={name} onChange={e => {setName(e.target.value); if(errors.name) setErrors(p=>({...p, name:undefined}))}} className={commonInputClass}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="custEmail" className={commonLabelClass}>Email</label>
                    <input type="email" id="custEmail" value={email} onChange={e => {setEmail(e.target.value); if(errors.email) setErrors(p=>({...p, email:undefined}))}} className={commonInputClass}/>
                </div>
                <div>
                    <label htmlFor="custPhone" className={commonLabelClass}>Telefoon</label>
                    <input type="tel" id="custPhone" value={phone} onChange={e => {setPhone(e.target.value); if(errors.phone) setErrors(p=>({...p, phone:undefined}))}} className={commonInputClass}/>
                </div>
            </div>
            <fieldset className="border border-slate-300 p-3 rounded-lg bg-white">
                <legend className="text-sm font-medium text-slate-600 px-1">Adres</legend>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="col-span-2"><label htmlFor="custStreet" className="text-xs font-medium text-slate-600">Straat</label><input type="text" name="street" id="custStreet" value={address.street} onChange={handleAddressChange} className={commonInputClass + " p-1.5 text-xs"}/>{errors.street && <span className={errorTextClass}>{errors.street}</span>}</div>
                    <div><label htmlFor="custHouseNr" className="text-xs font-medium text-slate-600">Huisnr.</label><input type="text" name="houseNumber" id="custHouseNr" value={address.houseNumber} onChange={handleAddressChange} className={commonInputClass + " p-1.5 text-xs"}/>{errors.houseNumber && <span className={errorTextClass}>{errors.houseNumber}</span>}</div>
                    <div><label htmlFor="custPostcode" className="text-xs font-medium text-slate-600">Postcode</label><input type="text" name="postalCode" id="custPostcode" value={address.postalCode} onChange={handleAddressChange} className={commonInputClass + " p-1.5 text-xs"}/>{errors.postalCode && <span className={errorTextClass}>{errors.postalCode}</span>}</div>
                    <div className="col-span-2"><label htmlFor="custCity" className="text-xs font-medium text-slate-600">Plaats</label><input type="text" name="city" id="custCity" value={address.city} onChange={handleAddressChange} className={commonInputClass + " p-1.5 text-xs"}/>{errors.city && <span className={errorTextClass}>{errors.city}</span>}</div>
                </div>
            </fieldset>
            <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={onCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm shadow-sm hover:shadow-md transition-all">Annuleren</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-md text-sm shadow-md hover:shadow-lg transition-all">{customerToEdit ? 'Wijzigingen Opslaan' : 'Klant Toevoegen'}</button>
            </div>
        </form>
    );
};
