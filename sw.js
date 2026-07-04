const CACHE_NAME = 'kanon-cache-v1';
const APP_SHELL = ['./', './index.html'];

// Установка: сразу кладём главную страницу в кэш
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // если addAll не сработал (например, разный путь репозитория на GitHub Pages),
        // не роняем установку — кэш всё равно наполнится при обычном просмотре
      });
    })
  );
});

// Активация: чистим старые версии кэша
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Стратегия: сначала сеть (чтобы всегда были свежие данные),
// а если сети нет — отдаём то, что уже сохранено в кэше.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy).catch(function () {});
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
