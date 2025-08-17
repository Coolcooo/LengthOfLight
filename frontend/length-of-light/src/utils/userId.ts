// Утилита для управления уникальным ID пользователя
export const getUserId = (): string => {
  const STORAGE_KEY = 'gameUserId';
  
  // Проверяем, есть ли уже сохраненный ID
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // Генерируем новый уникальный ID
    userId = generateUniqueId();
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
};

// Генерация уникального ID
const generateUniqueId = (): string => {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

// Функция для сброса ID пользователя (если нужно)
export const resetUserId = (): string => {
  const STORAGE_KEY = 'gameUserId';
  localStorage.removeItem(STORAGE_KEY);
  return getUserId();
};
