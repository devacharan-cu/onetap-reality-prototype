const fs = require('fs');
const http = require('http');

async function testCameraAndLifecycle() {
  console.log('================================================================');
  console.log('RUNNING CAMERA MIRROR, RETAKE & SCAN-AGAIN VERIFICATION SUITE');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Verify Page Source for Mirrored Video Element & Unmirrored Controls
  console.log('\n--- 1. Testing Video Mirror Styling & Control Isolation ---');
  const pageSource = fs.readFileSync('/home/devacharan/hackathons/onetap-reality/app/page.tsx', 'utf8');

  // Verify Video Element is horizontally mirrored
  assert(
    pageSource.includes('style={{ transform: "scaleX(-1)" }}') && pageSource.includes('-scale-x-100'),
    'Video element contains explicit horizontal mirror transform: scaleX(-1) and -scale-x-100'
  );

  // Verify Capture Canvas draws in normal (unmirrored) orientation
  assert(
    pageSource.includes('ctx.drawImage(video, 0, 0, width, height)') && !pageSource.includes('ctx.scale(-1'),
    'Canvas capture draws the raw video frame in NORMAL (unmirrored) orientation'
  );

  // Verify UI controls are on separate z-index layer and not children of video
  assert(
    pageSource.includes('z-10 flex items-center justify-between') && pageSource.includes('z-0 pointer-events-none'),
    'UI controls (Capture button, close, flash, retake) reside on z-10 layer outside the mirrored video'
  );

  // 2. Verify Scan Again & Retake Lifecycle Logic
  console.log('\n--- 2. Testing Scan Again & Retake Lifecycle & Stale Scan Protection ---');
  assert(pageSource.includes('function retakeScan()'), 'retakeScan() function defined');
  assert(pageSource.includes('activeScanIdRef.current = scanCounterRef.current'), 'scanCounterRef invalidates running requests on reset()');
  assert(pageSource.includes('activeAbortControllerRef.current.abort()'), 'activeAbortControllerRef aborts in-flight fetch on reset/retake');
  assert(pageSource.includes('if (activeScanIdRef.current !== scanId)'), 'Stale responses are discarded if a newer scan was initiated');

  // 3. Verify End-to-End Analysis Pipeline with Normal Image on Port 3001
  console.log('\n--- 3. Testing Analysis Flow on Live Server (Port 3001) ---');
  const imgPath = '/home/devacharan/.gemini/antigravity/brain/bda853cd-91a6-47b2-ad1f-e45cc5dbd0ba/.user_uploaded/media_1787553892879.png';
  const imgBuffer = fs.readFileSync(imgPath);
  const dataUri = `data:image/png;base64,${imgBuffer.toString('base64')}`;

  const analyzeReqData = JSON.stringify({ image: dataUri });
  const analyzeRes = await new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:3001/api/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(analyzeReqData),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(analyzeReqData);
    req.end();
  });

  assert(analyzeRes.status === 200, 'Live /api/analyze returned HTTP 200');
  assert(analyzeRes.data.fields.eventTitle.value === 'ART FAIR', 'Normal orientation image correctly extracted Event Title');
  assert(analyzeRes.data.fields.organization.value === 'BORCELLE COLLEGE', 'Normal orientation image correctly extracted Organization');
  assert(analyzeRes.data.fields.location.status === 'not_mentioned', 'Absent location rejected');

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('================================================================');
}

testCameraAndLifecycle().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
