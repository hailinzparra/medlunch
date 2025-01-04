const current_cache_name = 'medlunch-v0.1'

self.addEventListener('install', ev => {
    ev.waitUntil(
        caches.open(current_cache_name).then(cache => {
            cache.addAll([
                '/',
                '/index.html',
                '/ekg-sim/index.html',
            ])
        })
    )
})

self.addEventListener('fetch', ev => {
    ev.respondWith(
        caches.match(ev.request).then(res => {
            return res || fetch(ev.request)
        })
    )
})

self.addEventListener('activate', ev => {
    ev.waitUntil(
        caches.keys().then(names => {
            for (let name of names) {
                if (name !== current_cache_name) {
                    caches.delete(name)
                }
            }
        })
    )
})
