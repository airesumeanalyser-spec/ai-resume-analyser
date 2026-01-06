// @ts-ignore - Vite ?url import provides string URL at build time
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function resolveWorkerSrc(): string {
  try {
    if (typeof workerUrl === "string" && workerUrl) {
      return workerUrl as string;
    }
  } catch {}
  const base = (import.meta as any)?.env?.BASE_URL ?? "/";
  // Ensure trailing slash behavior by relying on URL API
  return new URL("pdf.worker.min.mjs", new URL(base, window.location.origin)).toString();
}

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  if (typeof window === "undefined") {
    throw new Error("PDF rendering is only available in the browser");
  }

  // @ts-expect-error pdfjs-dist ESM path
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib: any) => {
    try {
      lib.GlobalWorkerOptions.workerSrc = resolveWorkerSrc();
    } catch {
      try { lib.GlobalWorkerOptions.workerSrc = undefined; } catch {}
      try { lib.disableWorker = true; } catch {}
    }
    pdfjsLib = lib;
    return lib;
  }).catch((err) => {
    // Reset for retry
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

// Delay utility for retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function convertPdfToImage(file: File, maxRetries: number = 3): Promise<PdfConversionResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await attemptPdfConversion(file);
      if (result.error && attempt < maxRetries) {
        console.warn(`PDF conversion attempt ${attempt} failed: ${result.error}. Retrying...`);
        await delay(500 * attempt); // Exponential backoff
        continue;
      }
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`PDF conversion attempt ${attempt} threw error: ${err?.message}. Retrying...`);
      if (attempt < maxRetries) {
        await delay(500 * attempt);
      }
    }
  }
  
  return {
    imageUrl: "",
    file: null,
    error: `Failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  };
}

async function attemptPdfConversion(file: File): Promise<PdfConversionResult> {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { imageUrl: "", file: null, error: "Not running in a browser context" };
    }

    // Validate file before processing
    if (!file || file.size === 0) {
      return { imageUrl: "", file: null, error: "Invalid or empty file" };
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return { imageUrl: "", file: null, error: "File is not a PDF" };
    }

    const lib = await loadPdfJs();

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (e: any) {
      return { imageUrl: "", file: null, error: `Failed to read file: ${e?.message || String(e)}` };
    }

    if (arrayBuffer.byteLength === 0) {
      return { imageUrl: "", file: null, error: "File is empty" };
    }

    // Helper to create a fresh copy for each attempt to avoid detached ArrayBuffer reuse
    const makeData = () => new Uint8Array(arrayBuffer.slice(0));
    let data = makeData();

    let pdf: any;
    try {
      pdf = await lib.getDocument({ data }).promise;
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/(worker|postmessage|detached|transfer)/i.test(msg)) {
        // Retry without worker and with a fresh data buffer
        try { lib.GlobalWorkerOptions.workerSrc = undefined; } catch {}
        try { lib.disableWorker = true; } catch {}
        data = makeData();
        try {
          pdf = await lib.getDocument({ data }).promise;
        } catch (retryErr: any) {
          return { imageUrl: "", file: null, error: `PDF parsing failed: ${retryErr?.message || String(retryErr)}` };
        }
      } else {
        return { imageUrl: "", file: null, error: `PDF parsing failed: ${msg}` };
      }
    }

    if (!pdf || pdf.numPages === 0) {
      return { imageUrl: "", file: null, error: "PDF has no pages" };
    }

    const page = await pdf.getPage(1);

    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 2000; // aim for ~2k width
    const scale = Math.min(4, Math.max(1, targetWidth / baseViewport.width));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return { imageUrl: "", file: null, error: "Could not get 2D canvas context" };
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    context.imageSmoothingEnabled = true;
    // @ts-ignore
    context.imageSmoothingQuality = "high";

    await page.render({ canvasContext: context, viewport }).promise;

    const blob: Blob | null = await new Promise((resolve) => {
      if (!("toBlob" in canvas)) {
        resolve(null);
        return;
      }
      canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    let finalBlob = blob;
    if (!finalBlob) {
      try {
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const [meta, b64] = dataUrl.split(",");
        const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        finalBlob = new Blob([u8], { type: mime });
      } catch {
        return { imageUrl: "", file: null, error: "Failed to create image blob" };
      }
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const imageFile = new File([finalBlob], `${originalName}.png`, { type: "image/png" });

    return {
      imageUrl: URL.createObjectURL(finalBlob),
      file: imageFile,
    };
  } catch (err: any) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err?.message || String(err)}`,
    };
  }
}