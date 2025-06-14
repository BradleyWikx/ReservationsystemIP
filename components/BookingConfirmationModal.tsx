import React from 'react';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  customerName: string;
  customerEmail: string;
  showDate: string;
  showTime: string;
  packageName: string;
  totalPrice: number;
  guests: number;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  reservationId,
  customerName,
  customerEmail,
  showDate,
  showTime,
  packageName,
  totalPrice,
  guests
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Boeking Bevestigd!
          </h2>
          
          {/* Subtitle */}
          <p className="text-center text-gray-600 mb-6">
            Uw reservering is succesvol ontvangen. U ontvangt binnen enkele minuten een bevestigingsmail.
          </p>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Reserveringsnummer:</span>
                <span className="text-sm font-bold text-indigo-600">{reservationId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Naam:</span>
                <span className="text-sm text-gray-900">{customerName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">E-mail:</span>
                <span className="text-sm text-gray-900">{customerEmail}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Datum & Tijd:</span>
                <span className="text-sm text-gray-900">{showDate} om {showTime}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Arrangement:</span>
                <span className="text-sm text-gray-900">{packageName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Aantal gasten:</span>
                <span className="text-sm text-gray-900">{guests}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-900">Totaalprijs:</span>
                <span className="text-sm font-bold text-indigo-600">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Belangrijke informatie:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Bewaar uw reserveringsnummer voor eventuele vragen</li>
              <li>• Kom 15 minuten voor aanvang naar de locatie</li>
              <li>• Voor wijzigingen kunt u contact opnemen via info@inspirationpoint.nl</li>
              <li>• Annulering is mogelijk tot 48 uur voor de voorstelling</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
