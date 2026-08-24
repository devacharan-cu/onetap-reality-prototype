"use client";

import React, {
  ChangeEvent,
  Component,
  ErrorInfo,
  FormEvent,
  ReactNode,
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
  LucideIcon,
} from "lucide-react";

export type FieldStatus = "verified" | "web_verified" | "not_mentioned" | "unverified";
export type FieldSource = "image" | "web" | "none";

export type ExtractedField = {
  value: string;
  status: FieldStatus;
  source: FieldSource;
  confidence: number;
  evidence?: string;
  sourceCitation?: string;
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
  confidence: number;
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
        <main className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-white/50 max-w-xs">
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="mt-6 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition"
          >
            Reload OneTap Reality
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

// Client-side image compression using Canvas for rapid mobile uploads
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

function escapeICS(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
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
    hasTime,
    yyyymmdd,
    dtstart: hasTime ? `${yyyymmdd}T${pad(hours)}${pad(minutes)}00` : yyyymmdd,
    dtend: hasTime ? `${yyyymmdd}T${pad((hours + 1) % 24)}${pad(minutes)}00` : yyyymmdd,
  };
}

function createCalendarFile(
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
  if (location) {
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
  
  // Emergency Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Translation Modal
  const [translationModalOpen, setTranslationModalOpen] = useState(false);

  // Scan History
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  function saveScanToHistory(newAnalysis: Analysis, thumbDataUrl?: string) {
    try {
      const newItem: HistoryItem = {
        id: `scan-${Date.now()}`,
        timestamp: Date.now(),
        context: newAnalysis.context,
        title: newAnalysis.title,
        summary: newAnalysis.summary,
        thumbnail: thumbDataUrl,
        analysis: newAnalysis,
      };
      const current = JSON.parse(localStorage.getItem("onetap_scan_history") || "[]");
      const updated = [newItem, ...current.slice(0, 9)];
      localStorage.setItem("onetap_scan_history", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Storage quota or parsing error
    }
  }

  function clearHistory() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("onetap_scan_history");
        window.dispatchEvent(new Event("storage"));
      }
      setFeedbackMessage("✓ Scan history cleared.");
    } catch {
      // Ignore
    }
  }

  function loadHistoryItem(item: HistoryItem) {
    setAnalysis(item.analysis);
    setImage(item.thumbnail || null);
    setStatus("success");
    setHistoryOpen(false);
    setChatMessages([]);
    setFeedbackMessage(`✓ Loaded "${item.title}"`);
  }

  async function processFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setStatus("loading");
    setLoadingStep("1. Preparing & optimizing image...");
    setErrorMessage("");
    setFeedbackMessage("");
    setAnalysis(null);
    setChatMessages([]);

    try {
      const base64 = await compressImage(file);
      setImage(base64);

      setLoadingStep("2. Gemini 3.7 Vision Scene Intelligence...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const stepTimer1 = setTimeout(() => {
        setLoadingStep("3. Grounding & Zero-Hallucination Verification...");
      }, 2000);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep("4. Synthesizing Safe Phone Actions...");
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

      const data = await response.json().catch(() => null);

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
      console.error("Processing error:", err);
      setStatus("error");
      if (err instanceof Error && err.name === "AbortError") {
        setErrorMessage("Request timed out. Please check your connection and try again.");
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not understand this image. Try another photo."
        );
      }
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = "";
  }

  function triggerCamera() {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }

  function triggerUpload() {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
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

          createCalendarFile(title, dateField.value, time, analysis.summary, location);
          setFeedbackMessage(`✓ Added "${title}" to calendar.`);
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
          const verifiedFields = Object.entries(analysis.fields)
            .filter(([, f]) => f.status !== "not_mentioned" && f.value)
            .map(([k, f]) => `• ${FIELD_LABELS[k]?.label || k}: ${f.value} (${f.status === "web_verified" ? "Web Verified" : "From Image"})`)
            .join("\n");

          const textToCopy = `📋 OneTap Reality — ${analysis.title}\n\n${analysis.summary}\n\nVerified Details:\n${verifiedFields || "None"}`;

          if (navigator.clipboard) {
            await navigator.clipboard.writeText(textToCopy);
            setFeedbackMessage("✓ Copied verified details to clipboard.");
          } else {
            setFeedbackMessage("✓ Clipboard not accessible.");
          }
          break;
        }

        case "share": {
          const verifiedFields = Object.entries(analysis.fields)
            .filter(([, f]) => f.status !== "not_mentioned" && f.value)
            .map(([k, f]) => `• ${FIELD_LABELS[k]?.label || k}: ${f.value}`)
            .join("\n");

          const shareText = `🔍 OneTap Reality Insight:\n\n${analysis.title}\n${analysis.summary}\n\n${verifiedFields}`;

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
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: analysis.context,
          title: analysis.title,
          summary: analysis.summary,
          fields: analysis.fields,
          image,
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

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case "calendar":
        return <Calendar className="w-5 h-5 text-emerald-400" />;
      case "maps":
        return <MapPin className="w-5 h-5 text-sky-400" />;
      case "directions":
        return <Compass className="w-5 h-5 text-teal-400" />;
      case "call":
        return <Phone className="w-5 h-5 text-green-400" />;
      case "email":
        return <Mail className="w-5 h-5 text-cyan-400" />;
      case "website":
        return <Globe className="w-5 h-5 text-blue-400" />;
      case "translate":
        return <Languages className="w-5 h-5 text-amber-400" />;
      case "search":
        return <Search className="w-5 h-5 text-yellow-400" />;
      case "copy":
        return <Copy className="w-5 h-5 text-slate-300" />;
      case "share":
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case "emergency":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-white/70" />;
    }
  };

  const renderFieldBadge = (field: ExtractedField) => {
    if (field.status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-400">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          FROM IMAGE
        </span>
      );
    }
    if (field.status === "web_verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-sky-400">
          <CheckCircle2 size={10} className="text-sky-400" />
          WEB VERIFIED
        </span>
      );
    }
    return (
      <span className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-white/30">
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
    <main className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-between">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      <div className="w-full max-w-md flex min-h-screen flex-col px-5 pb-8 pt-6">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                iQOO Vision AI
              </p>
            </div>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              OneTap Reality
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Scan History Button */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white transition active:scale-95 relative"
              title="Recent Scans"
            >
              <History size={15} />
              {historyItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {status !== "idle" && (
              <button
                type="button"
                onClick={reset}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white transition active:scale-95"
                title="Reset scene"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </header>

        {/* Feedback Message Toast */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between shadow-lg backdrop-blur-md">
            <span>{feedbackMessage}</span>
            <button
              onClick={() => setFeedbackMessage("")}
              className="text-emerald-400 hover:text-emerald-200 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {status === "error" && errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-xs text-red-200 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-red-100">
                  Could not understand this image.
                </p>
                <p className="mt-1 text-red-300/90 leading-relaxed">
                  {errorMessage}
                </p>
                <p className="mt-1 text-red-400/80 font-medium">
                  Try another photo or clearer angle.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 py-2.5 text-xs font-semibold text-white transition"
            >
              <RefreshCw size={13} />
              <span>Scan something else</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <section className="flex flex-1 flex-col justify-center py-6">
          {/* IDLE VIEW */}
          {status === "idle" && (
            <div className="flex flex-col items-center text-center">
              <div className="my-8">
                <p className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
                  SEE IT.
                  <br />
                  UNDERSTAND IT.
                  <br />
                  <span className="text-white/40">DO SOMETHING.</span>
                </p>

                <p className="mt-4 text-xs leading-6 text-white/50 max-w-xs mx-auto">
                  Point your phone at the physical world. AI extracts verified facts,
                  verifies missing data, and generates instant phone actions.
                </p>
              </div>

              {/* Primary Mobile Capture Button */}
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={triggerCamera}
                  className="group relative w-full flex flex-col items-center justify-center rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl transition hover:border-white/30 hover:from-white/[0.12] active:scale-[0.98]"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-xl transition group-hover:scale-105 group-active:scale-95">
                    <Camera size={34} strokeWidth={2} />
                  </div>

                  <span className="text-base font-semibold tracking-tight text-white">
                    Point &amp; Capture
                  </span>

                  <span className="mt-1 text-[11px] text-white/40">
                    Opens device camera
                  </span>
                </button>

                {/* Secondary Gallery Upload */}
                <button
                  type="button"
                  onClick={triggerUpload}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white transition active:scale-[0.99]"
                >
                  <Upload size={14} />
                  <span>Choose from Gallery / Files</span>
                </button>
              </div>

              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/35">
                <Info size={13} />
                <span>Zero hallucinations — Verified evidence only</span>
              </div>
            </div>
          )}

          {/* LOADING & SUCCESS PREVIEWS */}
          {(status === "loading" || status === "success") && (
            <div className="space-y-5">
              {/* Image Preview Container */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl">
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
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6 text-center">
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

                    <p className="mt-3 text-[11px] text-white/40 max-w-xs leading-relaxed">
                      Zero-hallucination engine: verifying field evidence and web grounding.
                    </p>
                  </div>
                )}
              </div>

              {/* SUCCESS RESULTS VIEW */}
              {status === "success" && analysis && (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md">
                    <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                          {analysis.context.replace(/_/g, " ")}
                        </span>
                        {analysis.webGroundingUsed && (
                          <span className="rounded-full border border-sky-500/30 bg-sky-950/40 px-2 py-0.5 text-[9px] font-semibold text-sky-300 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Web Grounded
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-medium text-emerald-400/90 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {Math.round(analysis.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {analysis.title}
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-white/60">
                      {analysis.summary}
                    </p>

                    {/* Multilingual Translation Alert if detected */}
                    {analysis.languageDetected && analysis.languageDetected.code !== "en" && (
                      <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Languages size={14} className="text-amber-400 shrink-0" />
                          <span className="text-[11px]">
                            Detected: <strong>{analysis.languageDetected.name}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTranslationModalOpen(true)}
                          className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/30 transition"
                        >
                          View Translation
                        </button>
                      </div>
                    )}
                  </div>

                  {/* FIELD-LEVEL EVIDENCE & VERIFICATION CARD */}
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5">
                    <div className="mb-3.5 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        Field Evidence &amp; Verification
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAllFields(!showAllFields)}
                        className="text-[10px] text-white/40 hover:text-white/80 transition"
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
                              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 transition"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white/40 flex items-center gap-1.5 text-[11px]">
                                  <IconComp size={12} className="text-white/60" />
                                  {FIELD_LABELS[key]?.label || key}
                                </span>
                                {renderFieldBadge(field)}
                              </div>
                              <p className="text-sm font-semibold text-white/95 break-words">
                                {field.value}
                              </p>
                              {field.sourceCitation && (
                                <p className="mt-1 text-[10px] text-sky-400/70 font-mono">
                                  Source: {field.sourceCitation}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-white/40 py-2">
                          No specific verified entities detected in this image.
                        </p>
                      )}

                      {/* Optional All Fields List */}
                      {showAllFields && unmentionedFieldsList.length > 0 && (
                        <div className="pt-2 border-t border-white/[0.04] space-y-1.5 opacity-60">
                          {unmentionedFieldsList.map(([key, field]) => {
                            const IconComp = FIELD_LABELS[key]?.icon || Sparkles;
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between py-1 px-1 text-[11px]"
                              >
                                <span className="text-white/30 flex items-center gap-1.5">
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

                  {/* SMART ACTIONS SECTION */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      Suggested Actions ({analysis.actions.length})
                    </p>

                    {analysis.actions.length > 0 ? (
                      <div className="space-y-2.5">
                        {analysis.actions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleAction(action)}
                            disabled={actionLoadingId !== null}
                            className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.99] disabled:opacity-60"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                {getActionIcon(action.type)}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {actionLoadingId === action.id
                                    ? "Executing..."
                                    : action.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-white/40 leading-snug">
                                  {action.description}
                                </p>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-white/30 transition group-hover:text-white group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
                        <p className="text-sm font-medium text-white/80">
                          No sensitive actions detected
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          No verifiable dates, numbers, or locations were visible.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* NATURAL LANGUAGE FOLLOW-UP ("ASK ABOUT THIS") */}
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={14} className="text-white/60" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Ask about this scene
                      </p>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {["What time does this start?", "Where is this located?", "Translate this", "Summarize key points"].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setChatInput(chip);
                          }}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition"
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
                                ? "bg-white/10 text-white ml-6 border border-white/10"
                                : "bg-white/[0.04] text-white/80 mr-6 border border-white/5"
                            }`}
                          >
                            <p className="font-semibold text-[10px] text-white/40 mb-0.5">
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
                        placeholder="Ask anything about what's visible..."
                        disabled={chatLoading}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatLoading}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-40 transition active:scale-95 shrink-0"
                      >
                        {chatLoading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Scan Another Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] py-3.5 text-xs font-semibold text-white hover:bg-white/10 active:scale-[0.99] transition"
                    >
                      <Camera size={14} />
                      <span>Scan something else</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Translation Modal */}
        {translationModalOpen && analysis?.languageDetected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-amber-500/30 bg-[#121008] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Languages size={20} />
                  <h3 className="text-base font-bold text-white">
                    {analysis.languageDetected.name} Translation
                  </h3>
                </div>
                <button
                  onClick={() => setTranslationModalOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {analysis.languageDetected.originalSnippet && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs mb-3">
                  <p className="text-[10px] uppercase font-semibold text-white/40 mb-1">
                    Original ({analysis.languageDetected.name})
                  </p>
                  <p className="text-white/80 leading-relaxed italic">
                    &ldquo;{analysis.languageDetected.originalSnippet}&rdquo;
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs">
                <p className="text-[10px] uppercase font-semibold text-amber-400/80 mb-1">
                  English Translation
                </p>
                <p className="text-white font-medium leading-relaxed">
                  {analysis.languageDetected.translatedEnglish}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTranslationModalOpen(false)}
                className="mt-5 w-full rounded-xl bg-white text-black py-2.5 text-xs font-semibold hover:bg-white/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Scan History Modal */}
        {historyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-white/15 bg-[#0f0f0f] p-6 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Recent Scans</h3>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {historyItems.length > 0 ? (
                  historyItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.06] hover:border-white/15 transition group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase font-semibold text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                          {item.context.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {new Date(item.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                        {item.summary}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/40 text-xs">
                    <p>No recent scans saved yet.</p>
                    <p className="mt-1 text-[11px] text-white/25">
                      Scans are stored securely on this device.
                    </p>
                  </div>
                )}
              </div>

              {historyItems.length > 0 && (
                <div className="pt-4 mt-2 border-t border-white/[0.06] flex gap-2">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex-1 rounded-xl border border-red-500/20 bg-red-950/20 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/40 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Clear History
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Modal Workflow */}
        {emergencyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2rem] border border-red-500/30 bg-[#120808] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <ShieldAlert size={26} />
                <h3 className="text-base font-bold text-white">
                  Emergency Assistant (Prototype)
                </h3>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                This is an iQOO Hackathon prototype safety assistant. It does{" "}
                <strong className="text-white">NOT</strong> automatically contact
                police or medical services.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                <p className="font-semibold text-white/90">
                  {analysis?.title || "Incident detected"}
                </p>
                <p className="mt-1 text-white/50 text-[11px]">
                  {analysis?.summary}
                </p>
              </div>

              {/* Device Location Section */}
              <div className="mt-4 space-y-2">
                {deviceLocation ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Check size={14} /> Device Coordinates Verified
                    </p>
                    <p className="mt-1 text-[11px] font-mono text-emerald-300/80">
                      {deviceLocation.lat.toFixed(5)}, {deviceLocation.lng.toFixed(5)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={requestEmergencyLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition"
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
                  className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 hover:text-white transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 text-center border-t border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/25">
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
