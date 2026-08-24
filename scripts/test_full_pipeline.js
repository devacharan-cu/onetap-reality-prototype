const http = require('http');
const fs = require('fs');

async function testPipeline() {
  console.log('=== 1. TESTING POST /api/analyze ===');
  const filePath = '/home/devacharan/.gemini/antigravity/brain/bda853cd-91a6-47b2-ad1f-e45cc5dbd0ba/.user_uploaded/media_1787549721664.png';
  const buffer = fs.readFileSync(filePath);
  const base64Data = 'data:image/png;base64,' + buffer.toString('base64');

  const analyzePayload = JSON.stringify({ image: base64Data });

  const analyzeResult = await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(analyzePayload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Analyze HTTP Status:', res.statusCode);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + data));
        }
      });
    });
    req.on('error', reject);
    req.write(analyzePayload);
    req.end();
  });

  console.log('Title:', analyzeResult.title);
  console.log('Context:', analyzeResult.context);
  console.log('Summary:', analyzeResult.summary);
  console.log('Fields:');
  for (const [k, f] of Object.entries(analyzeResult.fields)) {
    console.log(`  ${k}: value="${f.value}" (status=${f.status}, source=${f.source})`);
  }
  console.log('Actions:');
  for (const a of analyzeResult.actions) {
    console.log(`  [${a.type}] ${a.label} -> ${a.description} (payload=${JSON.stringify(a.payload || {})})`);
  }

  console.log('\n=== 2. TESTING POST /api/chat (ZERO-HALLUCINATION Q&A & TRANSLATION) ===');

  async function askQuestion(question) {
    const chatPayload = JSON.stringify({
      message: question,
      context: analyzeResult.context,
      title: analyzeResult.title,
      summary: analyzeResult.summary,
      fields: analyzeResult.fields
    });

    return new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(chatPayload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).answer);
          } catch (e) {
            reject(new Error('Failed to parse chat response: ' + data));
          }
        });
      });
      req.on('error', reject);
      req.write(chatPayload);
      req.end();
    });
  }

  const q1 = 'Where is the event located?';
  const a1 = await askQuestion(q1);
  console.log(`Q: "${q1}"`);
  console.log(`A: "${a1}"\n`);

  const q2 = 'What is the phone number?';
  const a2 = await askQuestion(q2);
  console.log(`Q: "${q2}"`);
  console.log(`A: "${a2}"\n`);

  const q3 = 'Translate this event to Hindi';
  const a3 = await askQuestion(q3);
  console.log(`Q: "${q3}"`);
  console.log(`A: "${a3}"\n`);

  console.log('=== PIPELINE TEST COMPLETE ===');
}

testPipeline().catch(console.error);
