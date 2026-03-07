import React from 'react';

export function PWAUpdate({ needRefresh, offlineReady, onClose, onUpdate }) {
  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex justify-between items-center">
        <p className="text-sm">
          {offlineReady
            ? 'Приложение готово к работе офлайн'
            : 'Доступна новая версия приложения'}
        </p>
        <div className="flex gap-2 ml-4">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="px-3 py-1 bg-blue-600 text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Обновить
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
