// probes which local servers are serving the Shecurity app correctly
import http from 'node:http';

function probe(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 4000 }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () =>
        resolve({
          port,
          status: res.statusCode,
          bytes: d.length,
          hasRoot: d.includes('id="root"'),
          hasAppJs: d.includes('/src/main.tsx') || d.includes('assets/index'),
          title: (d.match(/<title>([^<]*)/) || [])[1] || '(none)',
        }),
      );
    });
    req.on('timeout', () => { req.destroy(); resolve({ port, error: 'timeout' }); });
    req.on('error', (e) => resolve({ port, error: e.message }));
  });
}

const ports = [4173, 5173, 5199, 3000, 5174];
for (const p of ports) {
  const r = await probe(p);
  console.log(p, '→', JSON.stringify(r));
}
