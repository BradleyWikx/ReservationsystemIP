
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmModal, ConfirmModalProps } from './ConfirmModal';

type ConfirmFunction = (title: string, message: React.ReactNode, confirmText?: string, cancelText?: string) => Promise<boolean>;

interface ConfirmContextValue {
  confirm: ConfirmFunction;
  isConfirmModalOpen: boolean;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const useConfirm = (): ConfirmContextValue => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

interface ConfirmProviderProps {
  children: ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [confirmState, setConfirmState] = useState<Omit<ConfirmModalProps, 'isOpen' | 'onConfirm' | 'onCancel'> | null>(null);
  const [resolver, setResolver] = useState<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((title: string, message: React.ReactNode, confirmText?: string, cancelText?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ title, message, confirmText, cancelText });
      setResolver(() => resolve); // Store the resolve function
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }
    setConfirmState(null);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
    }
    setConfirmState(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, isConfirmModalOpen: !!confirmState }}>
      {children}
      {confirmState && (
        <ConfirmModal
          isOpen={!!confirmState} 
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};
