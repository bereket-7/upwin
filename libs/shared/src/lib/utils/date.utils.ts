export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const isExpired = (expirationDate: Date): boolean => {
  return new Date() > expirationDate;
};

export const getUnixTimestamp = (date: Date = new Date()): number => {
  return Math.floor(date.getTime() / 1000);
};