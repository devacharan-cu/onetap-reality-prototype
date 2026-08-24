const http = require('http');
const fs = require('fs');

const filePath = '/home/devacharan/.gemini/antigravity/brain/bda853cd-91a6-47b2-ad1f-e45cc5dbd0ba/.user_uploaded/media_1787549721664.png';
const buffer = fs.readFileSync(filePath);
const base64Data = 'data:image/png;base64,' + buffer.toString('base64');

const testPayload = JSON.stringify({
  image: base64Data
});

const req = http.request('http://localhost:3001/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testPayload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Context:', parsed.context);
      console.log('Title:', parsed.title);
      console.log('Fields:');
      for (const key of Object.keys(parsed.fields)) {
        const f = parsed.fields[key];
        console.log('  ' + key + ': value="' + f.value + '" status=' + f.status + ' source=' + f.source);
      }
      console.log('Actions labels:', parsed.actions.map(a => a.label));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => console.error('Req error:', e));
req.write(testPayload);
req.end();
