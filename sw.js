const staticCacheName = 'site-static-v2';
const dynamicCacheName = 'site-dynamic-v1';

const assets = [
  '/',
  '/index.html',
  '404.html',
  '/fallback.html',
  '/assets/js/app.js',
  '/assets/js/jquery.backstretch.js',
  '/assets/js/jquery.backstretch.min.js',
  '/assets/js/jquery.mCustomScrollbar.concat.min.js',
  '/assets/js/jquery.waypoints.js',
  '/assets/js/jquery.waypoints.min.js',
  '/assets/js/jquery-3.3.1.min.js',
  '/assets/js/jquery-migrate-3.0.0.min.js',
  '/assets/js/scripts.js',
  '/assets/js/waypoints.js',
  '/assets/js/wow.js',
  '/assets/js/wow.min.js',
  '/assets/css/animate.css',
  '/assets/css/jquery.mCustomScrollbar.min.css',
  '/assets/css/media-queries.css',
  '/assets/css/style.css',
  '/assets/img/logo.png',
  '/assets/ico/favicon-72x72.png',
  '/assets/ico/favicon-96x96.png',
  '/assets/ico/favicon-128x128.png',
  '/assets/ico/favicon-144x144.png',
  '/assets/ico/favicon-152x152.png',
  '/assets/ico/favicon-192x192.png',
  '/assets/ico/favicon-384x384.png',
  '/assets/ico/favicon-512x512.png',
  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500&display=swap"', 
  'https://use.fontawesome.com/releases/v5.7.2/css/all.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
];


// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if(keys.length > size){
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install event
self.addEventListener('install', evt => {
  //console.log('service worker installed');
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});

// activate event
self.addEventListener('activate', evt => {
  //console.log('service worker activated');
  evt.waitUntil(
    caches.keys().then(keys => {
      //console.log(keys);
      return Promise.all(keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// fetch event
self.addEventListener('fetch', evt => {
  if(evt.request.url.indexOf('firestore.googleapis.com') === -1){
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(dynamicCacheName).then(cache => {
          cache.put(evt.request.url, fetchRes.clone());
          // check cached items size
          limitCacheSize(dynamicCacheName, 15);
          return fetchRes;
        })
      });
    }).catch(() => {
      if(evt.request.url.indexOf('.html') > -1){
        return caches.match('/pages/fallback.html');
      } 
    })
  );
  }
});