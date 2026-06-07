import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Product } from '@/types';
import { useBranchStore } from '@/store/useBranchStore';

const getCollectionName = () => {
  const branch = useBranchStore.getState().currentBranch;
  return branch === 'cafe' ? 'products' : 'products_hospital';
};

export const getProducts = async (): Promise<Product[]> => {
  const branch = useBranchStore.getState().currentBranch;
  const cacheKey = `cached_products_${branch}`;
  try {
    const q = query(collection(db, getCollectionName()));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    
    if (data.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    return data;
  } catch (err) {
    console.warn("Using offline fallback products cache in productService:", err);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  }
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  return await addDoc(collection(db, getCollectionName()), product);
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const productRef = doc(db, getCollectionName(), id);
  return await updateDoc(productRef, product);
};

export const updateCategoryName = async (oldName: string, newName: string) => {
  const products = await getProducts();
  const productsToUpdate = products.filter(p => p.category === oldName);
  
  const promises = productsToUpdate.map(product => {
    const productRef = doc(db, getCollectionName(), product.id);
    return updateDoc(productRef, { category: newName });
  });
  
  await Promise.all(promises);
};

export const deleteProduct = async (id: string) => {
  const productRef = doc(db, getCollectionName(), id);
  return await deleteDoc(productRef);
};
