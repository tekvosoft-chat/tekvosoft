import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import DocumentAnnotator from "../DocumentAnnotator";
import { i18n } from "../../translate/i18n";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_UNRANGED_BYTES = 10 * 1024 * 1024; // 10 MB

const useStyles = makeStyles(() => ({
  // ── Thumbnail ──────────────────────────────────────────────────────────
  thumbnail: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    "&:hover $thumbnailOverlay": {
      opacity: 1
    }
  },
  thumbnailCanvas: {
    display: "block",
    width: "100%"
  },
  thumbnailOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.18)",
    opacity: 0,
    transition: "opacity 0.2s",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    pointerEvents: "none"
  },
  thumbnailFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.12))",
    pointerEvents: "none"
  },
  thumbnailMessage: {
    padding: "6px 8px",
    fontSize: "0.75rem",
    color: "#666"
  }
}));

// ── HEAD check ────────────────────────────────────────────────────────────────
// Conservative: presumes range requests are NOT supported unless the server
// explicitly confirms otherwise. Without range support we only allow loading
// when the file size is known and ≤ MAX_UNRANGED_BYTES, to avoid locking up
// the frontend with a huge unbounded download.
async function checkPdfUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const acceptRanges = res.headers.get("Accept-Ranges");
    const contentLength = res.headers.get("Content-Length");
    const fileSize = contentLength ? parseInt(contentLength, 10) : null;

    // Range support explicitly confirmed → always allow.
    if (acceptRanges && acceptRanges !== "none") {
      return { canLoad: true, supportsRange: true, fileSize };
    }

    // Range not supported or unknown → only allow when size is confirmed ≤ limit.
    if (fileSize !== null && fileSize <= MAX_UNRANGED_BYTES) {
      return { canLoad: true, supportsRange: false, fileSize };
    }

    return { canLoad: false, supportsRange: false, fileSize };
  } catch {
    // Request failed → cannot confirm range support; block to avoid lockup.
    return { canLoad: false, supportsRange: false, fileSize: null };
  }
}

// ── Thumbnail sub-component ───────────────────────────────────────────────────
function Thumbnail({ url, onOpen }) {
  const classes = useStyles();
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | done | error

  useEffect(() => {
    if (!url) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const pdf = await getDocument({
          url,
          // Only fetch what's needed for page 1 – don't pre-load the whole file.
          disableAutoFetch: true,
          disableStream: true,
          rangeChunkSize: 65536 // 64 KB chunks
        }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
          pdf.destroy();
          return;
        }

        const page = await pdf.getPage(1);
        if (cancelled) {
          pdf.destroy();
          return;
        }

        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Draw only the top half of the first page
        canvas.width = scaledViewport.width;
        canvas.height = Math.floor(scaledViewport.height / 2);
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: scaledViewport
        }).promise;

        if (!cancelled) setStatus("done");
        pdf.destroy();
      } catch (e) {
        if (!cancelled) {
          console.error("PdfPreview thumbnail error:", e);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className={classes.thumbnail} onClick={onOpen}>
      {status === "loading" && (
        <div className={classes.thumbnailMessage}>
          {i18n.t("annotator.loadingPreview")}
        </div>
      )}
      {status === "error" && (
        <div className={classes.thumbnailMessage}>
          {i18n.t("annotator.previewUnavailable")}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={classes.thumbnailCanvas}
        style={{ display: status === "done" ? "block" : "none" }}
      />
      {status === "done" && (
        <>
          <div className={classes.thumbnailFade} />
          <div className={classes.thumbnailOverlay}>
            {i18n.t("annotator.openAndAnnotate")}
          </div>
        </>
      )}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
function PdfPreview({ url, fileName, ticketId }) {
  const [open, setOpen] = useState(false);
  // null = pending, true = can load, false = blocked
  const [canLoad, setCanLoad] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setCanLoad(null);

    checkPdfUrl(url).then(result => {
      if (!cancelled) setCanLoad(result.canLoad);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // canLoad===null means HEAD check is still in-flight; canLoad===false means
  // range is unsupported and file exceeds 10 MB → fall back to the normal
  // document download button already rendered in the messages list.
  if (!canLoad) return null;

  return (
    <>
      <Thumbnail url={url} onOpen={() => setOpen(true)} />
      {open && (
        <DocumentAnnotator
          open={open}
          onClose={() => setOpen(false)}
          src={url}
          type="pdf"
          fileName={fileName}
          ticketId={ticketId}
        />
      )}
    </>
  );
}

export default PdfPreview;
