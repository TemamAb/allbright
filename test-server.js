import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Response length: ${data.length}`);
    console.log(data.substring(0, 500));
  });
});

req.on('error', (err) => {
  console.error('ERROR:', err.message);
});

req.on('timeout', () => {
  console.error('TIMEOUT');
  req.destroy();
});

req.end();
