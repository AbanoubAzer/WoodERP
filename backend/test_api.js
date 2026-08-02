const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).access_token;
    if (!token) return;
    
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/dashboard',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log("Dashboard:", data2);
      });
    });
  });
});

req.write(JSON.stringify({ email: 'asd@asd.asd', password: 'Asd123' }));
req.end();
