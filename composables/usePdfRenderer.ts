import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";

interface PdfCache {
  pdf: PDFDocumentProxy | null;
  numPages: number;
  loading: boolean;
  loadingPromise?: Promise<{ pdf: PDFDocumentProxy; numPages: number }>;
}

interface RenderJob {
  canvas: HTMLCanvasElement;
  task?: RenderTask;
  scale: number;
  pageNum: number;
}

const pdfCache = new Map<string, PdfCache>();
import * as pdfjsLib from "pdfjs-dist";
const renderJobs = new Map<string, RenderJob[]>();

export const usePdfRenderer = () => {
  const initPdfJs = async () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  };

  const loadPdf = async (
    src: string
  ): Promise<{ pdf: PDFDocumentProxy; numPages: number }> => {
    // Check cache first
    const cached = pdfCache.get(src);
    if (cached && !cached.loading && cached.pdf) {
      return { pdf: cached.pdf, numPages: cached.numPages };
    }
    // If already loading, wait for it
    if (cached?.loading) {
      if (cached.loadingPromise) {
        return cached.loadingPromise;
      }
    }

    // Mark as loading and store the loading promise
    let resolvePromise!: (value: {
      pdf: PDFDocumentProxy;
      numPages: number;
    }) => void;
    let rejectPromise!: (reason?: any) => void;
    const loadingPromise = new Promise<{
      pdf: PDFDocumentProxy;
      numPages: number;
    }>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    pdfCache.set(src, {
      pdf: null,
      numPages: 0,
      loading: true,
      loadingPromise,
    });

    await initPdfJs();

    try {
      const loadingTask = pdfjsLib.getDocument(src);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      // Cache the loaded PDF
      pdfCache.set(src, { pdf, numPages, loading: false });

      resolvePromise({ pdf, numPages });
      return { pdf, numPages };
    } catch (error) {
      // Remove from cache on error
      pdfCache.delete(src);
      rejectPromise(error);
      throw error;
    }
  };

  const cancelRenderJobs = (jobKey: string) => {
    const jobs = renderJobs.get(jobKey);
    if (jobs) {
      jobs.forEach((job) => {
        if (job.task && typeof job.task.cancel === "function") {
          try {
            job.task.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        }
      });
      renderJobs.delete(jobKey);
    }
  };

  const renderPdfToCanvas = async (
    src: string,
    canvas: HTMLCanvasElement,
    pageNum: number,
    scale: number,
    jobKey: string
  ): Promise<void> => {
    try {
      const { pdf } = await loadPdf(src);
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      const renderTask = page.render(renderContext);

      // Track render job
      const jobs = renderJobs.get(jobKey) || [];
      jobs.push({ canvas, pageNum, scale, task: renderTask });
      renderJobs.set(jobKey, jobs);

      await renderTask.promise;
    } catch (error: any) {
      if (error?.name !== "RenderingCancelledException") {
        throw error;
      }
    }
  };

  const clearCache = (src?: string) => {
    if (src) {
      const cached = pdfCache.get(src);
      if (cached?.pdf) {
        try {
          cached.pdf.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      pdfCache.delete(src);
    } else {
      // Clear all cache
      pdfCache.forEach((cached) => {
        if (cached?.pdf) {
          try {
            cached.pdf.destroy();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      pdfCache.clear();
    }
  };

  return {
    loadPdf,
    renderPdfToCanvas,
    cancelRenderJobs,
    clearCache,
  };
};
