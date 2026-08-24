const fs = require('fs');
const http = require('http');
const path = require('path');

async function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function runAndroidIntegrationTests() {
  console.log('================================================================');
  console.log('STARTING ONETAP REALITY ANDROID INTEGRATION VERIFICATION SUITE');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, description) {
    total++;
    if (condition) {
      console.log(`✓ PASS [Test ${total}]: ${description}`);
      passed++;
    } else {
      console.error(`✗ FAIL [Test ${total}]: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  const androidRoot = path.join(__dirname, '..', 'android');

  // 1. Android Manifest Permissions & Config
  const manifestPath = path.join(androidRoot, 'app/src/main/AndroidManifest.xml');
  assert(fs.existsSync(manifestPath), 'AndroidManifest.xml exists');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  assert(manifest.includes('android.permission.CAMERA'), 'Camera permission declared');
  assert(manifest.includes('android.permission.INTERNET'), 'Internet permission declared');
  assert(!manifest.includes('RECORD_AUDIO'), 'Microphone permission NOT requested (Privacy invariant)');
  assert(manifest.includes('network_security_config'), 'Network security config referenced');

  // 2. Network Security Config (Localhost / Emulator Support)
  const netSecPath = path.join(androidRoot, 'app/src/main/res/xml/network_security_config.xml');
  assert(fs.existsSync(netSecPath), 'network_security_config.xml exists');
  const netSec = fs.readFileSync(netSecPath, 'utf8');
  assert(netSec.includes('10.0.2.2') && netSec.includes('localhost'), 'Allows development cleartext for 10.0.2.2 emulator');

  // 3. Kotlin DTOs and Serialization Mapping
  const analyzeDtoPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/data/model/AnalyzeDtos.kt');
  assert(fs.existsSync(analyzeDtoPath), 'AnalyzeDtos.kt exists');
  const analyzeDto = fs.readFileSync(analyzeDtoPath, 'utf8');
  assert(analyzeDto.includes('data class AnalyzeResponseDto') && analyzeDto.includes('data class FieldDto'), 'AnalyzeResponseDto defines canonical contract');

  // 4. CameraX Viewfinder Mirroring vs Normal Capture Invariant
  const previewPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/ui/camera/CameraPreview.kt');
  const previewCode = fs.readFileSync(previewPath, 'utf8');
  assert(
    previewCode.includes('previewView.scaleX = if (lensFacing == CameraSelector.LENS_FACING_FRONT) -1f else 1f'),
    'CameraX live preview is horizontally mirrored for front camera'
  );

  const camVmPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/ui/camera/CameraViewModel.kt');
  const camVmCode = fs.readFileSync(camVmPath, 'utf8');
  assert(
    camVmCode.includes('Bitmap.createBitmap') && !camVmCode.includes('matrix.postScale(-1f'),
    'Captured image sent to Gemini AI maintains normal (unmirrored) orientation'
  );

  // 5. Native Intent Utilities
  const intentPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/utils/IntentUtils.kt');
  const intentCode = fs.readFileSync(intentPath, 'utf8');
  assert(intentCode.includes('CalendarContract.Events.CONTENT_URI'), 'Google Calendar intent uses CalendarContract');
  assert(intentCode.includes('geo:0,0?q='), 'Google Maps intent uses geo URI');
  assert(intentCode.includes('tel:'), 'Dialer intent uses tel URI');
  assert(intentCode.includes('Intent.ACTION_SEND'), 'Sharesheet intent uses ACTION_SEND');

  // 6. Configurable Base URL (Emulator 10.0.2.2 default)
  const netConfPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/utils/NetworkConfig.kt');
  const netConf = fs.readFileSync(netConfPath, 'utf8');
  assert(netConf.includes('http://10.0.2.2:3001'), 'NetworkConfig defaults to 10.0.2.2:3001 for emulator');

  // 7. Grounded Multi-Turn Chat Architecture
  const chatDtoPath = path.join(androidRoot, 'app/src/main/java/com/onetap/reality/data/model/ChatDtos.kt');
  const chatDto = fs.readFileSync(chatDtoPath, 'utf8');
  assert(chatDto.includes('data class ChatHistoryItemDto'), 'Chat DTOs support multi-turn history');

  // 8. Live Backend API Verification (Port 3001)
  const imgPath = path.join(__dirname, '..', 'public', 'samples', 'event_poster.png');
  const imgBuffer = fs.readFileSync(imgPath);
  const dataUri = `data:image/png;base64,${imgBuffer.toString('base64')}`;

  const analyzeRes = await postJson('http://localhost:3001/api/analyze', { image: dataUri });
  assert(analyzeRes.status === 200, 'Live /api/analyze returned HTTP 200');
  assert(analyzeRes.data.context === 'event_poster', 'Live backend classified event_poster');
  assert(analyzeRes.data.fields.eventTitle.status === 'verified', 'Event title verified from image');

  const chatRes = await postJson('http://localhost:3001/api/chat', {
    message: 'When is this event?',
    context: analyzeRes.data.context,
    title: analyzeRes.data.title,
    summary: analyzeRes.data.summary,
    fields: analyzeRes.data.fields
  });
  assert(chatRes.status === 200, 'Live /api/chat returned HTTP 200');
  assert(chatRes.data.answer.toLowerCase().includes('october'), 'Chat resolved verified event dates');

  console.log('\n================================================================');
  console.log(`ANDROID INTEGRATION SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('================================================================');
}

runAndroidIntegrationTests().catch((err) => {
  console.error('Android Integration Test Error:', err);
  process.exit(1);
});
