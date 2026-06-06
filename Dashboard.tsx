import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Professional Error Handling Wrapper (Catch File Logic)
export class AppError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, context: string) => {
  console.error(`[Error in ${context}]:`, error);
  if (error instanceof AppError) {
    // Already wrapped
    return error;
  }
  
  const msg = error instanceof Error ? error.message : String(error);
  return new AppError(`هەڵەیەک ڕوویدا لە ${context}: ${msg}`, 'UNKNOWN', error);
};

export const withCatch = async <T,>(
  promise: Promise<T>,
  context: string
): Promise<[T | null, AppError | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, handleError(error, context)];
  }
};
