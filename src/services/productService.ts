import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Product } from '@/types';

const collectionName = 'products';

export const getProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  return await addDoc(collection(db, collectionName), product);
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const productRef = doc(db, collectionName, id);
  return await updateDoc(productRef, product);
};

export const updateCategoryName = async (oldName: string, newName: string) => {
  const products = await getProducts();
  const productsToUpdate = products.filter(p => p.category === oldName);
  
  const promises = productsToUpdate.map(product => {
    const productRef = doc(db, collectionName, product.id);
    return updateDoc(productRef, { category: newName });
  });
  
  await Promise.all(promises);
};

export const deleteProduct = async (id: string) => {
  const productRef = doc(db, collectionName, id);
  return await deleteDoc(productRef);
};
