"use client";

import React, { ChangeEvent, Component, ErrorInfo, ReactNode, useRef, useState } from "react";
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
  FileText,
  X,
  Upload,
  Info,
  ShieldAlert,
} from "lucide-react";

type ActionType =
  | "calendar"
  | "maps"
  | "call"
  | "explain"
  | "search"
  | "emergency"
  | "share";

type Action = {
  id: string;
  label: string;
  description: string;
  type: ActionType;
};

type Entities = {
  eventTitle: string;
  date: string;
  time: string;
  location: string;
  phoneNumber: string;
  productName: string;
  routeNumber: string;
  emergencyDetected: boolean;
};

type Analysis = {
  context: string;
  title: string;
  summary: string;
  confidence: number;
  entities: Entities;
  actions: Action[];
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

function openMaps(location: string) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  window.open(mapsUrl, "_blank", "noopener,noreferrer");
}

function openSearch(query: string) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(searchUrl, "_blank", "noopener,noreferrer");
}

function OneTapApp() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setFeedbackMessage("");
    setAnalysis(null);

    try {
      const base64 = await compressImage(file);
      setImage(base64);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      setAnalysis(data as Analysis);
      setStatus("success");
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
          const title = analysis.entities.eventTitle || analysis.title;
          const date = analysis.entities.date;
          const time = analysis.entities.time;
          const location = analysis.entities.location;

          if (!date) {
            throw new Error("No verified date was detected for calendar export.");
          }

          createCalendarFile(title, date, time, analysis.summary, location);
          setFeedbackMessage(`✓ Added "${title}" to calendar.`);
          break;
        }

        case "maps": {
          const loc = analysis.entities.location;
          if (!loc) {
            throw new Error("No verified location was detected.");
          }
          openMaps(loc);
          setFeedbackMessage(`✓ Opening Maps for "${loc}".`);
          break;
        }

        case "call": {
          const phone = analysis.entities.phoneNumber;
          if (!phone) {
            throw new Error("No verified phone number was detected.");
          }
          triggerPhoneCall(phone);
          setFeedbackMessage(`✓ Connecting to ${phone}...`);
          break;
        }

        case "search": {
          const query =
            analysis.entities.productName ||
            analysis.entities.routeNumber ||
            analysis.entities.location ||
            analysis.title;

          if (!query) {
            throw new Error("No search subject detected.");
          }
          openSearch(query);
          setFeedbackMessage(`✓ Searching Google for "${query}".`);
          break;
        }

        case "share": {
          const shareText = `🔍 OneTap Reality Insight:\n\n${analysis.title}\n${analysis.summary}${
            analysis.entities.location ? `\n📍 ${analysis.entities.location}` : ""
          }${analysis.entities.date ? `\n📅 ${analysis.entities.date}` : ""}${
            analysis.entities.phoneNumber ? `\n📞 ${analysis.entities.phoneNumber}` : ""
          }`;

          if (navigator.share) {
            try {
              await navigator.share({
                title: analysis.title,
                text: shareText,
              });
              setFeedbackMessage("✓ Shared successfully.");
            } catch (shareErr) {
              if (shareErr instanceof Error && shareErr.name !== "AbortError") {
                await navigator.clipboard.writeText(shareText);
                setFeedbackMessage("✓ Details copied to clipboard.");
              }
            }
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            setFeedbackMessage("✓ Details copied to clipboard.");
          } else {
            setFeedbackMessage(shareText);
          }
          break;
        }

        case "explain": {
          setFeedbackMessage(`💡 ${analysis.summary}`);
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

  function requestEmergencyLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser/device.");
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
        setErrorMessage(`Location access: ${geoErr.message}`);
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
    setDeviceLocation(null);
  }

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case "calendar":
        return <Calendar className="w-5 h-5 text-emerald-400" />;
      case "maps":
        return <MapPin className="w-5 h-5 text-sky-400" />;
      case "call":
        return <Phone className="w-5 h-5 text-green-400" />;
      case "search":
        return <Search className="w-5 h-5 text-amber-400" />;
      case "share":
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case "explain":
        return <FileText className="w-5 h-5 text-purple-400" />;
      case "emergency":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-white/70" />;
    }
  };

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
                  Try another photo.
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
                  Point your phone at the world. AI understands what matters and
                  turns it into useful actions.
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
                    Opens phone camera
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

                {/* Processing Overlay */}
                {status === "loading" && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md px-6 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <Sparkles className="absolute w-5 h-5 text-white animate-pulse" />
                    </div>

                    <p className="mt-5 text-sm font-semibold tracking-tight">
                      Understanding Scene...
                    </p>

                    <p className="mt-1.5 text-xs text-white/40 max-w-xs leading-relaxed">
                      Gemini 3.7 Flash is extracting verified entities &amp; actions
                    </p>
                  </div>
                )}
              </div>

              {/* SUCCESS RESULTS VIEW */}
              {status === "success" && analysis && (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                        {analysis.context}
                      </span>

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
                  </div>

                  {/* Detected Entities Card */}
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      Detected Information
                    </p>

                    <div className="space-y-2 text-xs">
                      {analysis.entities.eventTitle && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <Sparkles size={12} /> Event
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.eventTitle}
                          </span>
                        </div>
                      )}

                      {analysis.entities.date && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <Calendar size={12} /> Date
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.date}
                          </span>
                        </div>
                      )}

                      {analysis.entities.time && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <Clock size={12} /> Time
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.time}
                          </span>
                        </div>
                      )}

                      {analysis.entities.location && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <MapPin size={12} /> Location
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.location}
                          </span>
                        </div>
                      )}

                      {analysis.entities.phoneNumber && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <Phone size={12} /> Phone
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.phoneNumber}
                          </span>
                        </div>
                      )}

                      {analysis.entities.productName && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <FileText size={12} /> Product
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.productName}
                          </span>
                        </div>
                      )}

                      {analysis.entities.routeNumber && (
                        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <MapPin size={12} /> Route
                          </span>
                          <span className="text-right font-medium text-white/90">
                            {analysis.entities.routeNumber}
                          </span>
                        </div>
                      )}

                      {analysis.entities.emergencyDetected && (
                        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-red-200 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-400 shrink-0" />
                          <span className="font-semibold text-xs">
                            Possible emergency detected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
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
            See → Understand → Act
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
