
import React, { useEffect, useRef } from 'react';

export interface InfoModalData {
  title: string;
  message: React.ReactNode;
  status: 'success' | 'error' | 'info' | 'warning';
}

interface InfoModalProps extends InfoModalData {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessIcon = () => <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const ErrorIcon = () => <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const WarningIcon = () => <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
const InfoIcon = () => <svg className="w-12 h-12 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  status,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let IconComponent;
  let titleColorClass = 'text-slate-800';
  switch (status) {
    case 'success': IconComponent = SuccessIcon; titleColorClass = 'text-green-600'; break;
    case 'error': IconComponent = ErrorIcon; titleColorClass = 'text-red-600'; break;
    case 'warning': IconComponent = WarningIcon; titleColorClass = 'text-amber-600'; break;
    case 'info': default: IconComponent = InfoIcon; titleColorClass = 'text-blue-600'; break;
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-[1100] backdrop-blur-sm" // Higher z-index than other modals
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full transform transition-all"
        tabIndex={-1}
      >
        <div className="text-center">
          <IconComponent />
          <h3 id="info-modal-title" className={`text-xl font-semibold ${titleColorClass} mt-2 mb-3`}>
            {title}
          </h3>
          <div className="text-sm text-slate-600 mb-6">
            {message}
          </div>
        </div>
        <div className="mt-5 text-center">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
