// Service worker de remoção.
// O worker antigo servia uma cópia velha do index.html do cache; depois de um
// deploy ela apontava para arquivos que não existem mais e a página ficava em
// branco. O navegador sempre busca este arquivo na rede, então esta versão
// substitui a antiga, apaga os caches, se desregistra e recarrega as abas.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => client.navigate(client.url));
    })());
});
