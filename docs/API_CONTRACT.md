# OneTap Reality — Multimodal AI & Pre-Android API Contract

## 1. Overview & Architecture

OneTap Reality operates on a strict epistemological pipeline:

```
Camera / Frame Capture (Normal Pixel Orientation)
  ↓
Multimodal AI Perception (Gemini Multimodal Engine)
  ↓
Structured Entity & Number Disambiguation
  ↓
Server-Side Evidence & Anti-Placeholder Validation
  ↓
Canonical Verified Object
  ↓
Client Features (Actions, Chat, Calendar, Maps, Search, History)
```

Both the Web Client and future Android native clients interface with the same authoritative backend routes.

---

## 2. API Endpoints

### Endpoint A: Visual Analysis (`POST /api/analyze`)

**Request Payload:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Canonical Verified Object Response:**
```json
{
  "context": "event_poster | advertisement | business_card | menu | receipt | invoice | product | product_packaging | document | form | ticket | timetable | schedule | signboard | location_information | map | screenshot | social_media_post | educational_material | diagram | chart | artwork | object | unknown",
  "title": "Borcelle College Art Fair",
  "summary": "An event poster advertising an art fair organized by Borcelle College.",
  "keyTakeaway": "You can attend the Borcelle College Art Fair for free from October 10th to 18th.",
  "temporalState": "upcoming | ongoing | past | unknown",
  "confidence": 0.95,
  "entitiesList": [
    {
      "name": "Borcelle College",
      "type": "organization",
      "role": "organizer"
    },
    {
      "name": "Art Fair",
      "type": "event"
    }
  ],
  "lineItems": [
    {
      "label": "Oat Milk Vanilla Latte",
      "value": "$6.75",
      "amount": 6.75,
      "unit": "USD"
    }
  ],
  "languageDetected": {
    "code": "hi",
    "name": "Hindi",
    "originalSnippet": "...",
    "translatedEnglish": "..."
  },
  "emergencyDetected": false,
  "fields": {
    "eventTitle": {
      "value": "Art Fair",
      "status": "verified",
      "source": "image",
      "confidence": 0.95,
      "evidence": "ART FAIR"
    },
    "date": {
      "value": "10th-18th October",
      "status": "verified",
      "source": "image",
      "confidence": 0.95,
      "evidence": "10TH-18TH OCTOBER"
    },
    "location": {
      "value": "Not mentioned",
      "status": "not_mentioned",
      "source": "none",
      "confidence": 1.0
    }
  },
  "actions": [
    {
      "id": "act-calendar",
      "label": "Add to Calendar",
      "description": "Schedule \"Art Fair\" on 10th-18th October",
      "type": "calendar",
      "payload": {
        "title": "Art Fair",
        "date": "10th-18th October",
        "time": "",
        "location": ""
      }
    },
    {
      "id": "act-search",
      "label": "Search on Web",
      "description": "Google search for \"Borcelle College Art Fair\"",
      "type": "search",
      "payload": {
        "query": "Borcelle College Art Fair"
      }
    }
  ],
  "webGroundingUsed": false
}
```

---

### Endpoint B: Grounded Multi-Turn Chat (`POST /api/chat`)

**Request Payload:**
```json
{
  "message": "When is it?",
  "history": [
    { "sender": "user", "text": "What is this?" },
    { "sender": "assistant", "text": "This is an event poster for the Borcelle College Art Fair." }
  ],
  "context": "event_poster",
  "title": "Borcelle College Art Fair",
  "summary": "An event poster advertising an art fair organized by Borcelle College.",
  "keyTakeaway": "You can attend the Borcelle College Art Fair for free from October 10th to 18th.",
  "temporalState": "upcoming",
  "entitiesList": [...],
  "lineItems": [...],
  "fields": { ... }
}
```

**Response Payload:**
```json
{
  "answer": "The Borcelle College Art Fair takes place from October 10th to 18th."
}
```

---

## 3. Epistemological States

| Status | Definition |
| :--- | :--- |
| `verified` | Directly observed in pixel text with verbatim token evidence match. |
| `web_verified` | Retrieved via trusted Google Search Grounding with official citation. |
| `uncertain` | Ambiguous, partially cropped, blurry, or low-contrast text. |
| `not_mentioned` | Absent from image or explicitly rejected template placeholder. |

---

## 4. Android Client Integration Notes

1. **CameraX Viewfinder Mirroring vs AI Capture**:
   - Preview View: Set `scaleX = -1f` on the front camera `PreviewView`.
   - Frame Analysis / ImageCapture: Always save the un-mirrored raw byte buffer / Bitmap (`ImageProxy.toBitmap()`) when dispatching to `/api/analyze`.
2. **Deterministic Actions in Android**:
   - `calendar`: Launch `Intent(Intent.ACTION_INSERT).setData(Events.CONTENT_URI)` with title and timestamp.
   - `maps`: Launch `Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=..."))`.
   - `call`: Launch `Intent(Intent.ACTION_DIAL, Uri.parse("tel:..."))`.
   - `share`: Launch `Intent.createChooser(Intent(Intent.ACTION_SEND), ...)`.
