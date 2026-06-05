import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { Order } from '@/types';

const collectionName = 'orders';

export const addOrder = async (order: Omit<Order, 'id'>) => {
  return await addDoc(collection(db, collectionName), {
    ...order,
    date: order.date.toISOString(), // Convert Date to string for Firebase compatibility (or use Timestamp)
  });
};

export const getOrders = async (startDate?: Date, endDate?: Date) => {
    let q;
    if (startDate && endDate) {
      q = query(
        collection(db, collectionName), 
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'desc')
      );
    } else {
      q = query(collection(db, collectionName), orderBy('date', 'desc'), limit(50));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        date: new Date(data.date) 
      } as Order;
    });
};
