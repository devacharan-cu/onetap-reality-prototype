"use client";

import React, {
  ChangeEvent,
  Component,
  ErrorInfo,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Camera,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Search,
  Share2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Check,
  ChevronRight,
  X,
  Upload,
  Info,
  ShieldAlert,
  Globe,
  Mail,
  Languages,
  History,
  Send,
  Copy,
  Compass,
  Trash2,
  Tag,
  Building2,
  MessageSquare,
  CheckCircle2,
  Download,
  Sun,
  Moon,
  SwitchCamera,
  Zap,
  ZapOff,
  LucideIcon,
} from "lucide-react";

export type FieldStatus = "verified" | "web_verified" | "uncertain" | "not_mentioned" | "unverified";
export type FieldSource = "image" | "web" | "none" | "inference";

export type ExtractedField = {
  value: string;
  status: FieldStatus;
  source: FieldSource;
  confidence: number;
  evidence?: string;
  sourceCitation?: string;
  reasoning?: string;
};

export type StructuredEntity = {
  name: string;
  type: "organization" | "event" | "person" | "product" | "location" | "business" | "document" | "other";
  role?: string;
};

export type LineItem = {
  label: string;
  value: string;
  amount?: number;
  unit?: string;
};

export type ActionType =
  | "calendar"
  | "maps"
  | "directions"
  | "call"
  | "email"
  | "website"
  | "search"
  | "translate"
  | "copy"
  | "share"
  | "emergency";

export type Action = {
  id: string;
  label: string;
  description: string;
  type: ActionType;
  payload?: Record<string, string>;
};

export type Analysis = {
  context: string;
  title: string;
  summary: string;
  keyTakeaway?: string;
  temporalState?: "upcoming" | "ongoing" | "past" | "unknown";
  confidence: number;
  entitiesList?: StructuredEntity[];
  lineItems?: LineItem[];
  languageDetected?: {
    code: string;
    name: string;
    originalSnippet?: string;
    translatedEnglish?: string;
  };
  emergencyDetected: boolean;
  fields: Record<string, ExtractedField>;
  actions: Action[];
  webGroundingUsed?: boolean;
};

export type HistoryItem = {
  id: string;
  timestamp: number;
  context: string;
  title: string;
  summary: string;
  thumbnail?: string;
  analysis: Analysis;
};

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
};

type AppStatus = "idle" | "loading" | "success" | "error";
type ThemeMode = "dark" | "light" | "system";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OneTap Reality UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xs">
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="mt-6 px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-semibold hover:opacity-90 active:scale-95 transition"
          >
            Reload OneTap Reality
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

// Client-side image compression using Canvas for fast mobile uploads
async function compressImage(file: File, maxDimension = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Empty image file."));
        return;
      }

      const img = document.createElement("img");
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function parseEventDates(dateStr: string, timeStr: string) {
  const currentYear = new Date().getFullYear();
  let year = currentYear;
  let month = new Date().getMonth();
  let day = new Date().getDate();
  let hasTime = false;
  let hours = 9;
  let minutes = 0;

  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const cleanDate = dateStr.toLowerCase().trim();

  for (const [mName, mIdx] of Object.entries(months)) {
    if (cleanDate.includes(mName)) {
      month = mIdx;
      const dayMatch = cleanDate.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
      if (dayMatch) day = parseInt(dayMatch[1], 10);
      const yearMatch = cleanDate.match(/\b(20\d{2})\b/);
      if (yearMatch) year = parseInt(yearMatch[1], 10);
      break;
    }
  }

  const isoMatch = cleanDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    const dmyMatch = cleanDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10) - 1;
      year = parseInt(dmyMatch[3], 10);
    }
  }

  if (timeStr && timeStr.trim()) {
    const cleanTime = timeStr.toLowerCase().trim();
    const timeMatch = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      hasTime = true;
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3];
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      hours = h;
      minutes = m;
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyymmdd = `${year}${pad(month + 1)}${pad(day)}`;

  return {
    year,
    month,
    day,
    hasTime,
    yyyymmdd,
    dtstart: hasTime ? `${yyyymmdd}T${pad(hours)}${pad(minutes)}00` : yyyymmdd,
    dtend: hasTime ? `${yyyymmdd}T${pad((hours + 1) % 24)}${pad(minutes)}00` : yyyymmdd,
  };
}

// PRIMARY Google Calendar Pre-Filled Event Link
function openGoogleCalendar(
  title: string,
  dateStr: string,
  timeStr: string,
  description: string,
  location: string
) {
  const { hasTime, yyyymmdd, dtstart, dtend, year, month, day } = parseEventDates(dateStr, timeStr);
  
  let datesParam = "";
  if (hasTime) {
    datesParam = `${dtstart}/${dtend}`;
  } else {
    // All-day event in Google Calendar format: end date is day + 1
    const nextDay = new Date(year, month, day + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextYmd = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;
    datesParam = `${yyyymmdd}/${nextYmd}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Event",
    dates: datesParam,
  });

  if (description && description.trim()) {
    params.set("details", description.trim());
  }
  if (location && location.trim() && location !== "Not mentioned") {
    params.set("location", location.trim());
  }

  const gCalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(gCalUrl, "_blank", "noopener,noreferrer");
}

function escapeICS(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// SECONDARY .ics Calendar Download Fallback
function downloadICSFile(
  title: string,
  dateStr: string,
  timeStr: string,
  description: string,
  location: string
) {
  const { hasTime, yyyymmdd, dtstart, dtend } = parseEventDates(dateStr, timeStr);
  const now = new Date();
  const nowStr = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OneTap Reality//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@onetap-reality`,
    `DTSTAMP:${nowStr}`,
  ];

  if (hasTime) {
    icsLines.push(`DTSTART:${dtstart}`);
    icsLines.push(`DTEND:${dtend}`);
  } else {
    icsLines.push(`DTSTART;VALUE=DATE:${yyyymmdd}`);
    icsLines.push(`DTEND;VALUE=DATE:${yyyymmdd}`);
  }

  icsLines.push(`SUMMARY:${escapeICS(title || "Event")}`);
  if (description) {
    icsLines.push(`DESCRIPTION:${escapeICS(description)}`);
  }
  if (location && location !== "Not mentioned") {
    icsLines.push(`LOCATION:${escapeICS(location)}`);
  }
  icsLines.push("STATUS:CONFIRMED");
  icsLines.push("END:VEVENT");
  icsLines.push("END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const filename = (title || "event").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function triggerPhoneCall(phone: string) {
  const cleanPhone = phone.replace(/[^\d+*#]/g, "");
  if (!cleanPhone) return;
  const link = document.createElement("a");
  link.href = `tel:${cleanPhone}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerEmail(email: string, subject = "Information from OneTap Reality") {
  const link = document.createElement("a");
  link.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openMaps(location: string) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  window.open(mapsUrl, "_blank", "noopener,noreferrer");
}

function openDirections(location: string) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
  window.open(directionsUrl, "_blank", "noopener,noreferrer");
}

function openSearch(query: string) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(searchUrl, "_blank", "noopener,noreferrer");
}

function openUrl(url: string) {
  const target = url.startsWith("http") ? url : `https://${url}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

const FIELD_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  eventTitle: { label: "Event Name", icon: Sparkles },
  date: { label: "Date", icon: Calendar },
  time: { label: "Time", icon: Clock },
  location: { label: "Location", icon: MapPin },
  phoneNumber: { label: "Phone", icon: Phone },
  email: { label: "Email", icon: Mail },
  website: { label: "Website", icon: Globe },
  productName: { label: "Product / Item", icon: Tag },
  routeNumber: { label: "Transit / Route", icon: Compass },
  price: { label: "Price", icon: Tag },
  organization: { label: "Organization", icon: Building2 },
  qrCodeData: { label: "QR Code Data", icon: Globe },
  language: { label: "Detected Language", icon: Languages },
};

function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getHistorySnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem("onetap_scan_history") || "[]";
  } catch {
    return "[]";
  }
}

function getServerHistorySnapshot(): string {
  return "[]";
}

function OneTapApp() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [loadingStep, setLoadingStep] = useState<string>("Preparing image...");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Real Live Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraStreamState, setCameraStreamState] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Theme Management
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onetap_theme") as ThemeMode | null;
      if (saved) return saved;
    }
    return "dark";
  });

  // Emergency Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Translation Modal
  const [translationModalOpen, setTranslationModalOpen] = useState(false);

  // Scan History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const historyJson = useSyncExternalStore(subscribeStorage, getHistorySnapshot, getServerHistorySnapshot);
  const historyItems: HistoryItem[] = useMemo(() => {
    try {
      return JSON.parse(historyJson);
    } catch {
      return [];
    }
  }, [historyJson]);

  // Q&A Interactive Follow-up
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Show all / verified filter for fields
  const [showAllFields, setShowAllFields] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const scanCounterRef = useRef<number>(1);
  const activeScanIdRef = useRef<number>(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Robustly bind MediaStream to HTMLVideoElement and ensure playback
  const bindStreamToVideo = React.useCallback((video: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!video || !stream) return;

    // Verify video tracks
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) {
      console.warn("No video tracks found in MediaStream.");
      return;
    }

    const track = tracks[0];
    track.enabled = true;

    if (track.readyState !== "live") {
      console.warn(`Video track state is "${track.readyState}", expected "live".`);
    }

    try {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      // Handle metadata loaded
      video.onloadedmetadata = async () => {
        try {
          await video.play();
        } catch (playErr) {
          console.warn("Camera video play on loadedmetadata failed:", playErr);
        }
      };

      // Also call play immediately
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Initial video play error:", err);
        });
      }
    } catch (bindErr) {
      console.error("Failed to bind MediaStream to video element:", bindErr);
    }
  }, []);

  // Callback ref for the video element to guarantee immediate attachment upon React DOM mount
  const setVideoRef = React.useCallback((videoNode: HTMLVideoElement | null) => {
    videoRef.current = videoNode;
    if (videoNode && mediaStreamRef.current) {
      bindStreamToVideo(videoNode, mediaStreamRef.current);
    }
  }, [bindStreamToVideo]);

  // Effect to ensure binding whenever isCameraOpen or cameraStreamState changes
  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStreamRef.current) {
      bindStreamToVideo(videoRef.current, mediaStreamRef.current);
    }
  }, [isCameraOpen, cameraStreamState, bindStreamToVideo]);

  // Stop camera stream safely and release hardware
  function stopCameraStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStreamState(null);
    setIsCameraOpen(false);
    setCameraLoading(false);
    setTorchOn(false);
  }

  // Cleanup active camera on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Open Real Camera (Webcam on laptop or Camera on phone)
  async function startRealCamera(targetFacing: "environment" | "user" = facingMode) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera access is not supported on this browser. Please choose an image from your gallery.");
      return;
    }

    setCameraLoading(true);
    setErrorMessage("");
    setFeedbackMessage("");
    stopCameraStream();

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback with basic constraints if resolution/facingMode constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // Verify that at least one video track is active and live
      const videoTracks = stream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        throw new Error("No active video track returned by device.");
      }

      videoTracks[0].enabled = true;

      mediaStreamRef.current = stream;
      setCameraStreamState(stream);
      setIsCameraOpen(true);
      setCameraLoading(false);

      // Attempt immediate binding if video element is already available
      if (videoRef.current) {
        bindStreamToVideo(videoRef.current, stream);
      }

      // Check for multiple cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }

      // Check for torch/flashlight capability
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
        setTorchSupported(Boolean(capabilities && capabilities.torch));
      } catch {
        setTorchSupported(false);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      stopCameraStream();
      setStatus("error");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMessage("Camera access was denied. Check your browser permissions or choose an image instead.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setErrorMessage("No camera was detected on this device. You can choose an image from your gallery.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setErrorMessage("Camera is already in use by another application. Please close other camera apps and try again.");
        } else if (err.name === "OverconstrainedError") {
          setErrorMessage("Camera does not support requested settings. You can still choose an image from your gallery.");
        } else if (err.name === "SecurityError") {
          setErrorMessage("Camera access is restricted in this security context. Please choose an image from your gallery.");
        } else {
          setErrorMessage(`Camera error (${err.name}). Please select an image from your gallery.`);
        }
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Could not connect to camera. Please select an image from your gallery."
        );
      }
    }
  }

  // Switch between front and rear cameras
  function toggleCameraFacing() {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    startRealCamera(nextFacing);
  }

  // Toggle Torch/Flashlight if supported
  async function toggleTorch() {
    if (!mediaStreamRef.current || !torchSupported) return;
    try {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      const nextTorch = !torchOn;
      await (track as unknown as { applyConstraints: (c: { advanced: Array<{ torch: boolean }> }) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      // Torch constraint failed
    }
  }

  // Capture Current Video Frame and immediately run analysis
  function captureVideoFrame() {
    if (!videoRef.current || !mediaStreamRef.current) return;

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not initialize canvas context.");
      }

      // Draw the video frame directly to canvas in its normal (unmirrored) orientation
      ctx.drawImage(video, 0, 0, width, height);
      const base64Data = canvas.toDataURL("image/jpeg", 0.88);

      // Stop camera hardware immediately
      stopCameraStream();

      // Launch automated analysis pipeline immediately in normal orientation
      processBase64Image(base64Data);
    } catch (err) {
      console.error("Frame capture error:", err);
      stopCameraStream();
      setStatus("error");
      setErrorMessage("Failed to capture photo frame. Please try again.");
    }
  }

  // Core Analysis Engine with Stale-Scan Protection
  async function processBase64Image(base64: string) {
    scanCounterRef.current += 1;
    const scanId = scanCounterRef.current;
    activeScanIdRef.current = scanId;

    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch {
        // Ignore
      }
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setStatus("loading");
    setLoadingStep("1. Capturing and optimizing frame...");
    setErrorMessage("");
    setFeedbackMessage("");
    setAnalysis(null);
    setChatMessages([]);
    setImage(base64);

    try {
      setLoadingStep("2. Understanding Scene Context...");
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const stepTimer1 = setTimeout(() => {
        if (activeScanIdRef.current === scanId) {
          setLoadingStep("3. Checking Evidence & Grounding...");
        }
      }, 2000);

      const stepTimer2 = setTimeout(() => {
        if (activeScanIdRef.current === scanId) {
          setLoadingStep("4. Preparing Verified Actions...");
        }
      }, 4500);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      // Ignore if user scanned again or reset while request was in flight
      if (activeScanIdRef.current !== scanId) {
        return;
      }

      const data = await response.json().catch(() => null);

      if (activeScanIdRef.current !== scanId) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          (data && data.error) ||
            `Analysis failed (HTTP ${response.status}). Please try again.`
        );
      }

      if (!data || typeof data !== "object" || !data.title) {
        throw new Error("Invalid analysis data format received from server.");
      }

      const validatedAnalysis = data as Analysis;
      setAnalysis(validatedAnalysis);
      setStatus("success");

      // Save to local history
      saveScanToHistory(validatedAnalysis, base64);
    } catch (err) {
      if (activeScanIdRef.current !== scanId) {
        // Silently discard aborted or superseded requests
        return;
      }
      console.error("Processing error:", err);
      setStatus("error");
      if (err instanceof Error && err.name === "AbortError") {
        setErrorMessage("Request was cancelled or timed out. Please try again.");
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not understand this image. Try another photo."
        );
      }
    }
  }

  // Process File from Gallery/Files
  async function processFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    try {
      const base64 = await compressImage(file);
      processBase64Image(base64);
    } catch {
      setStatus("error");
      setErrorMessage("Could not read image file. Please try another photo.");
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = "";
  }

  function triggerGalleryUpload() {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  }

  function toggleTheme() {
    const nextTheme: ThemeMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("onetap_theme", nextTheme);
      if (nextTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    }
  }

  function saveScanToHistory(newAnalysis: Analysis, thumbDataUrl?: string) {
    try {
      const current: HistoryItem[] = JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
      // Avoid duplicate consecutive scans of the same subject
      if (
        current.length > 0 &&
        current[0].title === newAnalysis.title &&
        current[0].summary === newAnalysis.summary
      ) {
        return;
      }

      const newItem: HistoryItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        context: newAnalysis.context,
        title: newAnalysis.title,
        summary: newAnalysis.summary,
        thumbnail: thumbDataUrl,
        analysis: newAnalysis,
      };

      const updated = [newItem, ...current.slice(0, 19)];
      localStorage.setItem("onetap_scan_history", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore
    }
  }

  function deleteHistoryItem(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    try {
      if (typeof window !== "undefined") {
        const current: HistoryItem[] = JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
        const updated = current.filter((item) => item.id !== id);
        localStorage.setItem("onetap_scan_history", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
      setFeedbackMessage("✓ Scan deleted from history.");
    } catch {
      // Ignore
    }
  }

  function executeClearAllHistory() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("onetap_scan_history");
        window.dispatchEvent(new Event("storage"));
      }
      setConfirmClearOpen(false);
      setFeedbackMessage("✓ All scan history cleared.");
    } catch {
      // Ignore
    }
  }

  function loadHistoryItem(item: HistoryItem) {
    setAnalysis(item.analysis);
    setImage(item.thumbnail || null);
    setStatus("success");
    setHistoryOpen(false);
    setConfirmClearOpen(false);
    setChatMessages([]);
    setFeedbackMessage(`✓ Loaded "${item.title}"`);
  }

  async function handleAction(action: Action) {
    if (!analysis) return;

    setActionLoadingId(action.id);
    setFeedbackMessage("");
    setErrorMessage("");

    try {
      switch (action.type) {
        case "calendar": {
          const dateField = analysis.fields.date;
          const timeField = analysis.fields.time;
          const locField = analysis.fields.location;
          const titleField = analysis.fields.eventTitle;

          if (dateField.status === "not_mentioned" || !dateField.value) {
            throw new Error("No verified date is available for calendar creation.");
          }

          const title =
            titleField.status !== "not_mentioned" && titleField.value
              ? titleField.value
              : analysis.title;
          const time = timeField.status !== "not_mentioned" ? timeField.value : "";
          const location = locField.status !== "not_mentioned" ? locField.value : "";

          // PRIMARY: Open Google Calendar with prefilled details
          openGoogleCalendar(title, dateField.value, time, analysis.summary, location);
          setFeedbackMessage(`✓ Opened Google Calendar for "${title}". Review and save.`);
          break;
        }

        case "maps": {
          const loc = action.payload?.location || analysis.fields.location.value;
          if (!loc || loc === "Not mentioned") {
            throw new Error("No verified location available.");
          }
          openMaps(loc);
          setFeedbackMessage(`✓ Opening Maps for "${loc}".`);
          break;
        }

        case "directions": {
          const loc = action.payload?.location || analysis.fields.location.value;
          if (!loc || loc === "Not mentioned") {
            throw new Error("No verified destination available.");
          }
          openDirections(loc);
          setFeedbackMessage(`✓ Getting directions to "${loc}".`);
          break;
        }

        case "call": {
          const phone = action.payload?.phone || analysis.fields.phoneNumber.value;
          if (!phone || phone === "Not mentioned") {
            throw new Error("No verified phone number available.");
          }
          triggerPhoneCall(phone);
          setFeedbackMessage(`✓ Connecting to ${phone}...`);
          break;
        }

        case "email": {
          const email = action.payload?.email || analysis.fields.email.value;
          if (!email || email === "Not mentioned") {
            throw new Error("No verified email available.");
          }
          triggerEmail(email, `Inquiry regarding ${analysis.title}`);
          setFeedbackMessage(`✓ Composing email to ${email}...`);
          break;
        }

        case "website": {
          const url = action.payload?.url || analysis.fields.website.value;
          if (!url || url === "Not mentioned") {
            throw new Error("No verified website available.");
          }
          openUrl(url);
          setFeedbackMessage(`✓ Opening ${url}...`);
          break;
        }

        case "translate": {
          setTranslationModalOpen(true);
          break;
        }

        case "search": {
          const query = action.payload?.query || analysis.title;
          openSearch(query);
          setFeedbackMessage(`✓ Searching Google for "${query}".`);
          break;
        }

        case "copy": {
          // Format ONLY verified non-empty fields (exclude "Not mentioned")
          const verifiedLines = Object.entries(analysis.fields)
            .filter(([, f]) => f.status !== "not_mentioned" && f.value && f.value !== "Not mentioned")
            .map(([k, f]) => `• ${FIELD_LABELS[k]?.label || k}: ${f.value}`)
            .join("\n");

          const textToCopy = `OneTap Reality\n\n${analysis.title}\n${analysis.summary}\n\n${verifiedLines}`;

          if (navigator.clipboard) {
            await navigator.clipboard.writeText(textToCopy);
            setFeedbackMessage("✓ Copied verified details to clipboard.");
          } else {
            setFeedbackMessage("✓ Clipboard not accessible.");
          }
          break;
        }

        case "share": {
          // Format ONLY verified non-empty fields (exclude "Not mentioned")
          const verifiedLines = Object.entries(analysis.fields)
            .filter(([, f]) => f.status !== "not_mentioned" && f.value && f.value !== "Not mentioned")
            .map(([k, f]) => `• ${FIELD_LABELS[k]?.label || k}: ${f.value}`)
            .join("\n");

          const shareText = `OneTap Reality\n\n${analysis.title}\n${analysis.summary}\n\n${verifiedLines}`;

          if (navigator.share) {
            try {
              await navigator.share({
                title: analysis.title,
                text: shareText,
              });
              setFeedbackMessage("✓ Shared successfully.");
            } catch (shareErr) {
              if (shareErr instanceof Error && shareErr.name !== "AbortError") {
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(shareText);
                  setFeedbackMessage("✓ Details copied to clipboard.");
                }
              }
            }
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            setFeedbackMessage("✓ Details copied to clipboard.");
          }
          break;
        }

        case "emergency": {
          setEmergencyModalOpen(true);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Action could not be completed."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleChatSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || !analysis || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Send verified structured evidence (NO raw image) to prevent any hallucinations
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: analysis.context,
          title: analysis.title,
          summary: analysis.summary,
          keyTakeaway: analysis.keyTakeaway,
          temporalState: analysis.temporalState,
          entitiesList: analysis.entitiesList,
          lineItems: analysis.lineItems,
          fields: analysis.fields,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error((data && data.error) || "Could not get answer.");
      }

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I could not find verified evidence for that detail in the image.",
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "assistant",
        text: "Could not verify that question. Please try asking again.",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  function requestEmergencyLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported on this browser.");
      return;
    }

    setLocationLoading(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationLoading(false);
      },
      (geoErr) => {
        setLocationLoading(false);
        setErrorMessage(`Location access error: ${geoErr.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  function reset() {
    scanCounterRef.current += 1;
    activeScanIdRef.current = scanCounterRef.current;
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch {
        // Ignore
      }
      activeAbortControllerRef.current = null;
    }
    stopCameraStream();
    setStatus("idle");
    setImage(null);
    setAnalysis(null);
    setErrorMessage("");
    setFeedbackMessage("");
    setActionLoadingId(null);
    setEmergencyModalOpen(false);
    setTranslationModalOpen(false);
    setDeviceLocation(null);
    setChatMessages([]);
    setChatInput("");
    setShowAllFields(false);
  }

  function retakeScan() {
    reset();
    startRealCamera();
  }

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case "calendar":
        return <Calendar className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case "maps":
        return <MapPin className="w-5 h-5 text-sky-500 dark:text-sky-400" />;
      case "directions":
        return <Compass className="w-5 h-5 text-teal-500 dark:text-teal-400" />;
      case "call":
        return <Phone className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case "email":
        return <Mail className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      case "website":
        return <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case "translate":
        return <Languages className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case "search":
        return <Search className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case "copy":
        return <Copy className="w-5 h-5 text-slate-500 dark:text-slate-300" />;
      case "share":
        return <Share2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
      case "emergency":
        return <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[var(--text-secondary)]" />;
    }
  };

  const renderFieldBadge = (field: ExtractedField) => {
    if (field.status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
          <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          FROM IMAGE
        </span>
      );
    }
    if (field.status === "web_verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-sky-600 dark:text-sky-400">
          <CheckCircle2 size={10} className="text-sky-500 dark:text-sky-400" />
          WEB VERIFIED
        </span>
      );
    }
    if (field.status === "uncertain") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-amber-600 dark:text-amber-400">
          UNCERTAIN
        </span>
      );
    }
    return (
      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-pill)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
        NOT MENTIONED
      </span>
    );
  };

  const verifiedFieldsList = analysis
    ? Object.entries(analysis.fields).filter(([, f]) => f.status !== "not_mentioned")
    : [];

  const unmentionedFieldsList = analysis
    ? Object.entries(analysis.fields).filter(([, f]) => f.status === "not_mentioned")
    : [];

  return (
    <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-between transition-colors duration-200">
      {/* Hidden file input for Gallery file selection */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Gallery file input"
        onChange={handleImageChange}
      />

      <div className="w-full max-w-md flex min-h-screen flex-col px-5 pb-8 pt-6">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
                iQOO Vision AI
              </p>
            </div>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
              OneTap Reality
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition active:scale-95"
              title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme mode"
            >
              {themeMode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Scan History Button */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition active:scale-95 relative"
              title="Recent Scans"
              aria-label="Recent Scans history"
            >
              <History size={15} />
              {historyItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-emerald)]" />
              )}
            </button>

            {status !== "idle" && (
              <button
                type="button"
                onClick={reset}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition active:scale-95"
                title="Scan something else"
                aria-label="Reset scene"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </header>

        {/* Feedback Message Toast */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-lg backdrop-blur-md animate-fade-in">
            <span>{feedbackMessage}</span>
            <button
              onClick={() => setFeedbackMessage("")}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 ml-2"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {status === "error" && errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-xs text-red-800 dark:text-red-200 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-red-900 dark:text-red-100">
                  Could not understand this image.
                </p>
                <p className="mt-1 text-red-700 dark:text-red-300 leading-relaxed">
                  {errorMessage}
                </p>
                <p className="mt-1 text-red-600 dark:text-red-400 font-medium">
                  Try another photo or clearer angle.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={retakeScan}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-pill)] hover:bg-[var(--bg-card-hover)] py-2.5 text-xs font-semibold text-[var(--text-primary)] transition"
              >
                <Camera size={13} />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-pill)] hover:bg-[var(--bg-card-hover)] py-2.5 text-xs font-semibold text-[var(--text-primary)] transition"
              >
                <RefreshCw size={13} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={triggerGalleryUpload}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] py-2.5 text-xs font-semibold hover:opacity-90 transition"
              >
                <Upload size={13} />
                <span>Upload</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <section className="flex flex-1 flex-col justify-center py-6">
          {/* LIVE CAMERA VIEWFINDER MODAL / VIEW */}
          {isCameraOpen && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-[var(--accent-emerald)] bg-black shadow-2xl flex flex-col justify-between p-4">
              {/* Live Video Element (Horizontally Mirrored for User Preview Only) */}
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  v.play().catch((err) => console.warn("Video onLoadedMetadata play error:", err));
                }}
                onCanPlay={(e) => {
                  const v = e.currentTarget;
                  v.play().catch((err) => console.warn("Video onCanPlay play error:", err));
                }}
                className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none -scale-x-100"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Viewfinder Target Framing Overlay */}
              <div className="pointer-events-none absolute inset-6 rounded-2xl border border-white/25 flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-[var(--accent-emerald)]" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-[var(--accent-emerald)]" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-[var(--accent-emerald)]" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-[var(--accent-emerald)]" />
                </div>
              </div>

              {/* Camera Header Controls */}
              <div className="relative z-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition active:scale-95"
                  aria-label="Close camera"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition active:scale-95 ${
                        torchOn ? "bg-amber-400 text-black" : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                      aria-label="Toggle flashlight"
                    >
                      {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                    </button>
                  )}

                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition active:scale-95"
                      aria-label="Switch camera"
                    >
                      <SwitchCamera size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Camera Footer Shutter Button */}
              <div className="relative z-10 flex flex-col items-center pb-2">
                <button
                  type="button"
                  onClick={captureVideoFrame}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 backdrop-blur-md transition hover:scale-105 active:scale-95"
                  aria-label="Capture photo"
                >
                  <div className="h-14 w-14 rounded-full bg-white transition group-active:scale-90" />
                </button>
                <p className="mt-2 text-[11px] font-medium text-white/80 drop-shadow-md">
                  Tap to capture &amp; understand
                </p>
              </div>
            </div>
          )}

          {/* IDLE VIEW (When Camera is not active) */}
          {!isCameraOpen && status === "idle" && (
            <div className="flex flex-col items-center text-center">
              <div className="my-8">
                <p className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)]">
                  SEE IT.
                  <br />
                  UNDERSTAND IT.
                  <br />
                  <span className="text-[var(--text-muted)]">DO SOMETHING.</span>
                </p>

                <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)] max-w-xs mx-auto">
                  Point your camera at the physical world. AI extracts verified facts,
                  verifies missing data, and generates instant phone actions.
                </p>
              </div>

              {/* Primary Real Camera Shutter Trigger */}
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => startRealCamera("environment")}
                  disabled={cameraLoading}
                  className="group relative w-full flex flex-col items-center justify-center rounded-[2rem] border border-[var(--border-medium)] bg-[var(--bg-card)] p-8 shadow-xl transition hover:border-[var(--accent-emerald)] hover:bg-[var(--bg-card-hover)] active:scale-[0.98]"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-xl transition group-hover:scale-105 group-active:scale-95">
                    {cameraLoading ? (
                      <div className="w-8 h-8 rounded-full border-3 border-[var(--btn-primary-text)]/30 border-t-[var(--btn-primary-text)] animate-spin" />
                    ) : (
                      <Camera size={34} strokeWidth={2} />
                    )}
                  </div>

                  <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                    Point &amp; Capture
                  </span>

                  <span className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Opens real camera preview
                  </span>
                </button>

                {/* Secondary Gallery Upload */}
                <button
                  type="button"
                  onClick={triggerGalleryUpload}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition active:scale-[0.99]"
                >
                  <Upload size={14} />
                  <span>Choose from Gallery / Files</span>
                </button>
              </div>

              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
                <Info size={13} />
                <span>Zero hallucinations — Verified evidence only</span>
              </div>
            </div>
          )}

          {/* LOADING & SUCCESS PREVIEWS */}
          {!isCameraOpen && (status === "loading" || status === "success") && (
            <div className="space-y-5">
              {/* Image Preview Container */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] shadow-2xl">
                {image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image}
                    alt="Captured scene"
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Processing Overlay with Dynamic Step Progress */}
                {status === "loading" && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6 text-center text-white">
                    <div className="relative flex items-center justify-center">
                      <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <Sparkles className="absolute w-5 h-5 text-white animate-pulse" />
                    </div>

                    <p className="mt-5 text-sm font-semibold tracking-tight text-white">
                      Understanding Scene...
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{loadingStep}</span>
                    </div>

                    <p className="mt-3 text-[11px] text-white/50 max-w-xs leading-relaxed">
                      Zero-hallucination engine: verifying field evidence and web grounding.
                    </p>
                  </div>
                )}
              </div>

              {/* SUCCESS RESULTS VIEW */}
              {status === "success" && analysis && (
                <div className="space-y-5 animate-fade-in">
                  {/* Summary Card */}
                  <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 backdrop-blur-md shadow-sm">
                    <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-pill)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          {analysis.context.replace(/_/g, " ")}
                        </span>
                        {analysis.temporalState && analysis.temporalState !== "unknown" && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${
                              analysis.temporalState === "upcoming"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : analysis.temporalState === "ongoing"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-500"
                            }`}
                          >
                            {analysis.temporalState}
                          </span>
                        )}
                        {analysis.webGroundingUsed && (
                          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Web Grounded
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        {Math.round(analysis.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {analysis.title}
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                      {analysis.summary}
                    </p>

                    {/* Human-Like Key Takeaway Banner */}
                    {analysis.keyTakeaway && analysis.keyTakeaway !== analysis.summary && (
                      <div className="mt-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-[var(--text-primary)]">
                        <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5 flex items-center gap-1.5">
                          <Sparkles size={11} /> Key Takeaway
                        </p>
                        <p className="font-medium leading-relaxed">{analysis.keyTakeaway}</p>
                      </div>
                    )}

                    {/* Multilingual Translation Alert if detected */}
                    {analysis.languageDetected && analysis.languageDetected.code !== "en" && (
                      <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Languages size={14} className="text-amber-500 shrink-0" />
                          <span className="text-[11px]">
                            Detected: <strong>{analysis.languageDetected.name}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTranslationModalOpen(true)}
                          className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition"
                        >
                          View Translation
                        </button>
                      </div>
                    )}
                  </div>

                  {/* FIELD-LEVEL EVIDENCE & VERIFICATION CARD */}
                  <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <div className="mb-3.5 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Field Evidence &amp; Verification
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAllFields(!showAllFields)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      >
                        {showAllFields ? "Show Verified Only" : "Show All Fields"}
                      </button>
                    </div>

                    {/* Verified Items List */}
                    <div className="space-y-2 text-xs">
                      {verifiedFieldsList.length > 0 ? (
                        verifiedFieldsList.map(([key, field]) => {
                          const IconComp = FIELD_LABELS[key]?.icon || Sparkles;
                          return (
                            <div
                              key={key}
                              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] p-2.5 transition"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 text-[11px]">
                                  <IconComp size={12} className="text-[var(--text-muted)]" />
                                  {FIELD_LABELS[key]?.label || key}
                                </span>
                                {renderFieldBadge(field)}
                              </div>
                              <p className="text-sm font-semibold text-[var(--text-primary)] break-words">
                                {field.value}
                              </p>
                              {field.sourceCitation && (
                                <p className="mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                                  Source: {field.sourceCitation}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] py-2">
                          No specific verified entities detected in this image.
                        </p>
                      )}

                      {/* Optional All Fields List */}
                      {showAllFields && unmentionedFieldsList.length > 0 && (
                        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 opacity-60">
                          {unmentionedFieldsList.map(([key, field]) => {
                            const IconComp = FIELD_LABELS[key]?.icon || Sparkles;
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between py-1 px-1 text-[11px]"
                              >
                                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                  <IconComp size={11} /> {FIELD_LABELS[key]?.label || key}
                                </span>
                                {renderFieldBadge(field)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ITEMIZED BREAKDOWN CARD (RECEIPTS, MENUS, INVOICES, PRODUCTS) */}
                  {analysis.lineItems && analysis.lineItems.length > 0 && (
                    <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
                        Itemized Breakdown ({analysis.lineItems.length})
                      </p>
                      <div className="space-y-1.5 text-xs">
                        {analysis.lineItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]"
                          >
                            <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                            <span className="font-semibold text-[var(--accent-emerald)]">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SMART ACTIONS SECTION */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Suggested Actions ({analysis.actions.length})
                    </p>

                    {analysis.actions.length > 0 ? (
                      <div className="space-y-2.5">
                        {analysis.actions.map((action) => (
                          <div key={action.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => handleAction(action)}
                              disabled={actionLoadingId !== null}
                              className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition hover:border-[var(--border-medium)] hover:bg-[var(--bg-card-hover)] active:scale-[0.99] disabled:opacity-60 shadow-sm"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-pill)]">
                                  {getActionIcon(action.type)}
                                </div>

                                <div className="flex-1 pr-2">
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {actionLoadingId === action.id
                                      ? "Executing..."
                                      : action.label}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] leading-snug break-words">
                                    {action.description}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 transition group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5" />
                            </button>

                            {/* Secondary Download .ics button when action is Calendar */}
                            {action.type === "calendar" && (
                              <div className="mt-1.5 flex justify-end px-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const dateField = analysis.fields.date;
                                    const timeField = analysis.fields.time;
                                    const locField = analysis.fields.location;
                                    const titleField = analysis.fields.eventTitle;
                                    const title = titleField.status !== "not_mentioned" && titleField.value ? titleField.value : analysis.title;
                                    const time = timeField.status !== "not_mentioned" ? timeField.value : "";
                                    const location = locField.status !== "not_mentioned" ? locField.value : "";
                                    downloadICSFile(title, dateField.value, time, analysis.summary, location);
                                    setFeedbackMessage(`✓ Downloaded ${title}.ics calendar file.`);
                                  }}
                                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition"
                                >
                                  <Download size={11} /> Download .ics file fallback
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-center">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          No sensitive actions detected
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          No verifiable dates, numbers, or locations were visible.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* NATURAL LANGUAGE FOLLOW-UP ("ASK ABOUT THIS SCENE") */}
                  <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={14} className="text-[var(--text-secondary)]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                        Ask about this scene
                      </p>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[
                        "What time does this start?",
                        "Where is this located?",
                        "Translate this to Hindi",
                        "Translate this to Spanish",
                        "Summarize key points",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setChatInput(chip);
                          }}
                          className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-pill)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Conversation History */}
                    {chatMessages.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl p-2.5 text-xs ${
                              msg.sender === "user"
                                ? "bg-[var(--bg-pill)] text-[var(--text-primary)] ml-6 border border-[var(--border-subtle)]"
                                : "bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] mr-6 border border-[var(--border-subtle)]"
                            }`}
                          >
                            <p className="font-semibold text-[10px] text-[var(--text-muted)] mb-0.5">
                              {msg.sender === "user" ? "You" : "OneTap Assistant"}
                            </p>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat Input Form */}
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask anything about verified facts or translate..."
                        disabled={chatLoading}
                        className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-emerald)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatLoading}
                        aria-label="Send message"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] disabled:opacity-40 transition active:scale-95 shrink-0"
                      >
                        {chatLoading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--btn-primary-text)]/30 border-t-[var(--btn-primary-text)] animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Scan Again & Retake Actions Bar */}
                  <div className="pt-2 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={retakeScan}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-card)] py-3.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-[0.99] transition shadow-sm"
                    >
                      <Camera size={14} className="text-[var(--accent-emerald)]" />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-card)] py-3.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-[0.99] transition shadow-sm"
                    >
                      <RefreshCw size={14} />
                      <span>Scan Again</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Translation Modal */}
        {translationModalOpen && analysis?.languageDetected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-amber-500/30 bg-[var(--modal-bg)] p-6 shadow-2xl text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Languages size={20} />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {analysis.languageDetected.name} Translation
                  </h3>
                </div>
                <button
                  onClick={() => setTranslationModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Close translation"
                >
                  <X size={16} />
                </button>
              </div>

              {analysis.languageDetected.originalSnippet && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] p-3 text-xs mb-3">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                    Original ({analysis.languageDetected.name})
                  </p>
                  <p className="text-[var(--text-secondary)] leading-relaxed italic">
                    &ldquo;{analysis.languageDetected.originalSnippet}&rdquo;
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
                <p className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  English Translation
                </p>
                <p className="font-medium leading-relaxed">
                  {analysis.languageDetected.translatedEnglish}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTranslationModalOpen(false)}
                className="mt-5 w-full rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] py-2.5 text-xs font-semibold hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Scan History Modal */}
        {historyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-[var(--border-medium)] bg-[var(--modal-bg)] p-6 shadow-2xl max-h-[80vh] flex flex-col text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-[var(--accent-emerald)]" />
                  <h3 className="text-base font-bold">Recent Scans</h3>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Close history"
                >
                  <X size={16} />
                </button>
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {historyItems.length > 0 ? (
                  historyItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] p-3.5 hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-medium)] transition group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase font-semibold text-[var(--text-muted)] bg-[var(--bg-pill)] px-2 py-0.5 rounded-full">
                          {item.context.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(item.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition active:scale-90"
                            title="Delete this scan"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-emerald)] transition pr-4">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                        {item.summary}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 text-xs">
                    <div className="mx-auto w-12 h-12 rounded-full bg-[var(--bg-pill)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                      <History size={20} />
                    </div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">No scans yet</p>
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)] max-w-[200px] mx-auto leading-relaxed">
                      Your analyzed moments and verified details will appear here.
                    </p>
                  </div>
                )}
              </div>

              {historyItems.length > 0 && (
                <div className="pt-4 mt-2 border-t border-[var(--border-subtle)]">
                  {confirmClearOpen ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-center font-medium text-red-500">
                        Clear all {historyItems.length} scan{historyItems.length === 1 ? "" : "s"}?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmClearOpen(false)}
                          className="flex-1 rounded-xl bg-[var(--bg-pill)] py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={executeClearAllHistory}
                          className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white py-2 text-xs font-semibold transition"
                        >
                          Confirm Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(true)}
                        className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={13} /> Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(false)}
                        className="flex-1 rounded-xl bg-[var(--bg-pill)] py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Modal Workflow */}
        {emergencyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-red-500/30 bg-[var(--modal-bg)] p-6 shadow-2xl text-[var(--text-primary)]">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <ShieldAlert size={26} />
                <h3 className="text-base font-bold">
                  Emergency Assistant (Prototype)
                </h3>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This is an iQOO Hackathon prototype safety assistant. It does{" "}
                <strong className="text-[var(--text-primary)]">NOT</strong> automatically contact
                police or medical services.
              </p>

              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] p-3 text-xs">
                <p className="font-semibold">
                  {analysis?.title || "Incident detected"}
                </p>
                <p className="mt-1 text-[var(--text-muted)] text-[11px]">
                  {analysis?.summary}
                </p>
              </div>

              {/* Device Location Section */}
              <div className="mt-4 space-y-2">
                {deviceLocation ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Check size={14} /> Device Coordinates Verified
                    </p>
                    <p className="mt-1 text-[11px] font-mono">
                      {deviceLocation.lat.toFixed(5)}, {deviceLocation.lng.toFixed(5)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={requestEmergencyLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-pill)] py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                  >
                    <MapPin size={14} />
                    <span>
                      {locationLoading
                        ? "Acquiring GPS..."
                        : "Acquire My GPS Location"}
                    </span>
                  </button>
                )}
              </div>

              {/* Emergency Action Buttons */}
              <div className="mt-5 space-y-2">
                {deviceLocation && (
                  <a
                    href={`sms:?body=${encodeURIComponent(
                      `Possible emergency incident detected.\nLocation: https://maps.google.com/?q=${deviceLocation.lat},${deviceLocation.lng}\nSummary: ${analysis?.summary}`
                    )}`}
                    className="block text-center w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white transition"
                  >
                    Draft Emergency SMS with Location
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 text-center border-t border-[var(--border-subtle)]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
            See → Understand → Verify → Act
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AppErrorBoundary>
      <OneTapApp />
    </AppErrorBoundary>
  );
}
