import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { Order } from '@/types';
import { useBranchStore } from '@/store/useBranchStore';

const getCollectionName = () => {
  const branch = useBranchStore.getState().currentBranch;
  return branch === 'cafe' ? 'orders' : 'orders_hospital';
};

export const addOrder = async (order: Omit<Order, 'id'>) => {
  return await addDoc(collection(db, getCollectionName()), {
    ...order,
    date: order.date.toISOString(),
  });
};

export const getOrders = async (startDate?: Date, endDate?: Date) => {
    let q;
    const collName = getCollectionName();
    if (startDate && endDate) {
      q = query(
        collection(db, collName), 
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'desc')
      );
    } else {
      q = query(collection(db, collName), orderBy('date', 'desc'), limit(50));
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
