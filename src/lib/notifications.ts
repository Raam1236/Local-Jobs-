import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { NotificationType } from '../types';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      relatedId: relatedId || '',
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error creating notification:', e);
  }
};
