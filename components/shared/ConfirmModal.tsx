import React, { useEffect, useRef } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode; // Allow for more complex messages, e.g. with lists
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AlertTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Bevestig',
  cancelText = 'Annuleer',
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel} // Close on backdrop click
    >
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal content click
        tabIndex={-1}
      >
        <div className="text-center">
          <AlertTriangleIcon />
          <h3 id="confirm-modal-title" className="text-xl font-semibold text-slate-800 mt-4 mb-2">
            {title}
          </h3>
          <div className="text-sm text-slate-600 mb-6 whitespace-pre-wrap">
            {message}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
