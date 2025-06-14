// import React, { useState, useEffect, useCallback } from 'react';
// import type { StaffMember, ScheduledShift, Show, StaffRole, Address } from '../../types'; // Added Address
// import { staffRolesArray } from '../../types';
// import { db } from '../../src/firebaseConfig';
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
// import { Calendar, momentLocalizer, EventProps } from 'react-big-calendar';
// import moment from 'moment';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import { ConfirmModal } from '../shared/ConfirmModal';

// const localizer = momentLocalizer(moment);

// interface StaffSchedulingPageProps {
//   staffMembers: StaffMember[];
//   shows: Show[];
//   onUpdateStaffMember: (staffMember: StaffMember) => Promise<void>;
//   onAddStaffMember: (staffMember: Omit<StaffMember, 'id'>) => Promise<string>;
//   onDeleteStaffMember: (staffMemberId: string) => Promise<void>;
// }

// const StaffSchedulingPage: React.FC<StaffSchedulingPageProps> = ({
//   staffMembers: initialStaffMembers,
//   shows,
//   onUpdateStaffMember,
//   onAddStaffMember,
//   onDeleteStaffMember,
// }) => {
//   const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
//   const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
