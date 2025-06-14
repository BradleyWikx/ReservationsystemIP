// Placeholder for WaitingListModal component
import React from 'react';
import { ShowSlot } from '../../types'; // Adjust path as necessary

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { name: string; email: string; phone: string; guests: number; notes?: string; showSlotId: string }) => Promise<boolean>;
  showSlotId: string;
  showSlotInfo?: ShowSlot | null; // Make optional or ensure it's always passed
}

export const WaitingListModal: React.FC<WaitingListModalProps> = ({ isOpen, onClose, onSubmit, showSlotId, showSlotInfo }) => {
  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const details = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      guests: parseInt(formData.get('guests') as string, 10),
      notes: formData.get('notes') as string | undefined,
      showSlotId,
    };
    onSubmit(details).then(success => {
      if (success) onClose();
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '5px' }}>
        <h2>Join Waiting List</h2>
        {showSlotInfo && <p>Show: {showSlotInfo.date} at {showSlotInfo.time}</p>}
        <form onSubmit={handleSubmit}>
          <div><label>Name: <input type="text" name="name" required /></label></div>
          <div><label>Email: <input type="email" name="email" required /></label></div>
          <div><label>Phone: <input type="tel" name="phone" required /></label></div>
          <div><label>Number of Guests: <input type="number" name="guests" min="1" required /></label></div>
          <div><label>Notes (optional): <textarea name="notes"></textarea></label></div>
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};
