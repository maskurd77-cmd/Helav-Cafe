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
    const branch = useBranchStore.getState().currentBranch;
    const cacheKey = `cached_orders_${branch}`;
    const collName = getCollectionName();
    
    try {
        let q;
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
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data() as Record<string, any>;
          return {
            id: doc.id,
            ...data,
            date: new Date(data.date) 
          } as Order;
        });
        
        // Cache recent order history (the limit 50 query) for instantaneous future queries
        if (!startDate && !endDate && ordersData.length > 0) {
          try {
            const serializable = ordersData.map(o => ({ ...o, date: o.date.toISOString() }));
            localStorage.setItem(cacheKey, JSON.stringify(serializable));
          } catch (_) {}
        }
        
        return ordersData;
    } catch (err) {
        console.warn("Using offline fallback orders cache in orderService:", err);
        if (!startDate && !endDate) {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              return parsed.map((o: any) => ({ ...o, date: new Date(o.date) })) as Order[];
            }
          } catch (_) {}
        }
        return [];
    }
};
