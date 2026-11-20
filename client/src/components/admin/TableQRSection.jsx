/**
 * TableQRSection.jsx — ServeSync Admin Table QR Code Management
 *
 * Renders inside the existing Admin Dashboard as the "Table QR Codes" section.
 *
 * Features:
 *  - Generate a unique QR code for any table number
 *  - Duplicate table prevention (persisted in localStorage)
 *  - Dynamically builds the menu URL using the current browser origin
 *    so it works in both development and production without any hardcoding
 *  - Download individual QR codes as PNG images (via canvas.toDataURL)
 *  - Print individual QR codes with their table number label
 *  - Regenerate a QR code (deletes old, re-creates same table number)
 *  - Delete a table's QR code
 *
 * Persistence: localStorage key `servesync_qr_tables`
 *   Stores an array of { tableNumber: number, createdAt: string }
 *   This avoids adding an unnecessary new MongoDB collection while still
 *   surviving page refreshes and browser sessions on the same machine.
 *
 * QR URL format: <window.location.origin>/menu?table=<tableNumber>
 *   Example: http://localhost:5173/menu?table=3
 *            https://servesync.vercel.app/menu?table=3
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  Plus,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  Info,
  Link,
} from 'lucide-react';

/* ─── Storage helpers ────────────────────────────────────────────────── */

const STORAGE_KEY = 'servesync_qr_tables';

/** Load table list from localStorage. Returns sorted array by tableNumber. */
function loadTables() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sort ascending by table number
    return parsed.sort((a, b) => a.tableNumber - b.tableNumber);
  } catch {
    return [];
  }
}

/** Persist table list to localStorage. */
function saveTables(tables) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  } catch {
    // Handle private browsing or storage quota gracefully
  }
}

/* ─── URL builder ────────────────────────────────────────────────────── */

/**
 * Builds the customer menu URL for a given table number.
 * Uses window.location.origin so it works in both dev and production
 * without hardcoding any domain.
 */
function buildMenuUrl(tableNumber) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/menu?table=${tableNumber}`;
}

/* ─── Single QR Card ────────────────────────────────────────────────── */

function QRCard({ entry, onDelete, onRegenerate }) {
  const { tableNumber, createdAt } = entry;
  const menuUrl = buildMenuUrl(tableNumber);
  const canvasId = `qr-canvas-table-${tableNumber}`;

  /** Download the QR code canvas as a PNG file */
  const handleDownload = useCallback(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // Briefly upsample to 4× for a sharp, print-quality PNG
    const size = 512;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size + 60; // extra height for the label
    const ctx = offscreen.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw the QR canvas (upscaled)
    ctx.drawImage(canvas, 0, 0, size, size);

    // Draw "Table X" label below QR
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Table ${tableNumber}`, size / 2, size + 42);

    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ServeSync-Table-${tableNumber}-QR.png`;
    a.click();
  }, [canvasId, tableNumber]);

  /** Open a minimal print window with just this QR code and table label */
  const handlePrint = useCallback(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ServeSync — Table ${tableNumber} QR Code</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              padding: 32px;
            }
            .brand {
              font-size: 13px;
              color: #666;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              border: 1px solid #eee;
              border-radius: 12px;
              padding: 12px;
            }
            .table-label {
              margin-top: 18px;
              font-size: 28px;
              font-weight: 900;
              color: #111;
              letter-spacing: -0.5px;
            }
            .url-label {
              margin-top: 10px;
              font-size: 10px;
              color: #999;
              word-break: break-all;
              text-align: center;
              max-width: 260px;
            }
            .instructions {
              margin-top: 14px;
              font-size: 11px;
              color: #555;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <p class="brand">ServeSync</p>
          <img class="qr-img" src="${dataUrl}" alt="Table ${tableNumber} QR Code" />
          <p class="table-label">Table ${tableNumber}</p>
          <p class="url-label">${menuUrl}</p>
          <p class="instructions">Scan to order from your table</p>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [canvasId, tableNumber, menuUrl]);

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article
      data-testid={`qr-card-table-${tableNumber}`}
      className="
        flex flex-col bg-[#1C211F] border border-[#38443C] rounded-2xl overflow-hidden
        hover:border-[#82B895]/50 transition-all duration-200 shadow-md
      "
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#38443C] bg-[#171A19]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#24543A] flex items-center justify-center">
            <TableIcon className="w-3.5 h-3.5 text-[#82B895]" />
          </div>
          <div>
            <p className="text-sm font-black text-[#F5F5F0] leading-tight">
              Table {tableNumber}
            </p>
            {dateLabel && (
              <p className="text-[10px] text-[#68736A] leading-tight">
                Generated {dateLabel}
              </p>
            )}
          </div>
        </div>
        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(tableNumber)}
          aria-label={`Delete Table ${tableNumber} QR code`}
          title="Delete this QR code"
          className="p-1.5 rounded-lg text-[#68736A] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center px-5 py-6 bg-[#F5F0E6] relative">
        <QRCodeCanvas
          id={canvasId}
          value={menuUrl}
          size={180}
          level="H"
          includeMargin={true}
          bgColor="#F5F0E6"
          fgColor="#171A19"
        />
      </div>

      {/* URL label */}
      <div className="px-4 py-2.5 border-t border-[#38443C] bg-[#171A19]">
        <div className="flex items-start gap-1.5">
          <Link className="w-3 h-3 text-[#68736A] mt-0.5 shrink-0" />
          <p
            className="text-[10px] text-[#68736A] break-all leading-relaxed font-mono"
            title={menuUrl}
          >
            {menuUrl}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 divide-x divide-[#38443C] border-t border-[#38443C]">
        <button
          type="button"
          onClick={handleDownload}
          aria-label={`Download Table ${tableNumber} QR code as PNG`}
          title="Download PNG"
          className="
            flex flex-col items-center gap-1 py-3 text-[#A8B3AA]
            hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[#82B895] focus:ring-inset
          "
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Download</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          aria-label={`Print Table ${tableNumber} QR code`}
          title="Print QR code"
          className="
            flex flex-col items-center gap-1 py-3 text-[#A8B3AA]
            hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[#82B895] focus:ring-inset
          "
        >
          <Printer className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Print</span>
        </button>

        <button
          type="button"
          onClick={() => onRegenerate(tableNumber)}
          aria-label={`Regenerate Table ${tableNumber} QR code`}
          title="Regenerate (same table number, new timestamp)"
          className="
            flex flex-col items-center gap-1 py-3 text-[#A8B3AA]
            hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[#82B895] focus:ring-inset
          "
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Regenerate</span>
        </button>
      </div>
    </article>
  );
}

/* ─── Main TableQRSection ────────────────────────────────────────────── */

export default function TableQRSection() {
  const [tables, setTables] = useState(() => loadTables());
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef(null);

  // Persist to localStorage whenever tables change
  useEffect(() => {
    saveTables(tables);
  }, [tables]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  /** Validate and generate a new table QR code */
  const handleGenerate = useCallback(() => {
    setInputError('');
    setSuccessMsg('');

    const raw = inputValue.trim();
    if (raw === '') {
      setInputError('Please enter a table number.');
      inputRef.current?.focus();
      return;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
      setInputError('Table number must be a whole number between 1 and 999.');
      inputRef.current?.focus();
      return;
    }

    // Duplicate check
    const alreadyExists = tables.some((t) => t.tableNumber === parsed);
    if (alreadyExists) {
      setInputError(
        `Table ${parsed} already has a QR code. Use Regenerate on that card to refresh it.`
      );
      return;
    }

    const newEntry = { tableNumber: parsed, createdAt: new Date().toISOString() };
    setTables((prev) =>
      [...prev, newEntry].sort((a, b) => a.tableNumber - b.tableNumber)
    );
    setInputValue('');
    setSuccessMsg(`QR code for Table ${parsed} generated successfully!`);
    inputRef.current?.focus();
  }, [inputValue, tables]);

  /** Handle Enter key in the input */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleGenerate();
    },
    [handleGenerate]
  );

  /** Delete a table's QR entry */
  const handleDelete = useCallback((tableNumber) => {
    setTables((prev) => prev.filter((t) => t.tableNumber !== tableNumber));
  }, []);

  /**
   * Regenerate — removes the old entry and re-creates it with the same
   * table number but a fresh timestamp. The QR URL itself does not change
   * (it's deterministic: /menu?table=N), so the existing printed/saved QR
   * codes remain valid — regenerate is just for refreshing the admin record.
   */
  const handleRegenerate = useCallback((tableNumber) => {
    setTables((prev) => {
      const without = prev.filter((t) => t.tableNumber !== tableNumber);
      const refreshed = {
        tableNumber,
        createdAt: new Date().toISOString(),
      };
      return [...without, refreshed].sort((a, b) => a.tableNumber - b.tableNumber);
    });
    setSuccessMsg(`QR code for Table ${tableNumber} regenerated.`);
  }, []);

  const exampleUrl = buildMenuUrl('N');

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* ── Section Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#24543A] border border-[#326B4B] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#82B895]" />
            </div>
            <h1 className="text-2xl font-black text-[#F5F5F0] tracking-tight">
              Table QR Codes
            </h1>
          </div>
          <p className="text-sm text-[#A8B3AA] leading-relaxed max-w-xl">
            Generate scannable QR codes for each restaurant table. Customers scan
            the code to open the menu with their table automatically selected.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#68736A] bg-[#1C211F] border border-[#38443C] rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0 text-[#82B895]" />
          <span>
            {tables.length} table{tables.length !== 1 ? 's' : ''} configured
          </span>
        </div>
      </div>

      {/* ── URL Info Banner ── */}
      <div className="mb-6 flex items-start gap-3 p-4 bg-[#1C211F] border border-[#38443C] rounded-xl text-sm">
        <Link className="w-4 h-4 text-[#82B895] shrink-0 mt-0.5" />
        <div>
          <p className="text-[#F5F5F0] font-semibold mb-0.5">QR Code URL Format</p>
          <p className="text-[#A8B3AA] text-xs font-mono break-all">{exampleUrl}</p>
          <p className="text-[#68736A] text-xs mt-1">
            URLs are built from your current browser origin — they work in
            development and production automatically.
          </p>
        </div>
      </div>

      {/* ── Generate Form ── */}
      <div className="mb-8 p-5 bg-[#1C211F] border border-[#38443C] rounded-2xl">
        <h2 className="text-sm font-bold text-[#F5F5F0] mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#82B895]" />
          Generate New Table QR Code
        </h2>

        <div className="flex flex-wrap gap-3 items-start">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label
              htmlFor="table-number-input"
              className="block text-xs text-[#A8B3AA] font-semibold mb-1.5 uppercase tracking-wider"
            >
              Table Number
            </label>
            <input
              ref={inputRef}
              id="table-number-input"
              type="number"
              min="1"
              max="999"
              step="1"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 5"
              aria-label="Table number to generate QR code for"
              aria-describedby={inputError ? 'table-input-error' : undefined}
              className="
                w-full px-4 py-2.5 rounded-xl bg-[#171A19] border
                text-[#F5F5F0] text-sm placeholder:text-[#38443C]
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
                transition-colors
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                ${inputError ? 'border-rose-700/70' : 'border-[#38443C] hover:border-[#82B895]/50'}
              "
            />
            {inputError && (
              <p
                id="table-input-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {inputError}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <div className="mb-[22px]" aria-hidden="true" />
            <button
              type="button"
              onClick={handleGenerate}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-sm font-semibold
                border border-[#326B4B] transition-colors cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
                shadow-sm shadow-[#24543A]/30
              "
            >
              <QrCode className="w-4 h-4" />
              Generate QR Code
            </button>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 text-sm text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}
      </div>

      {/* ── QR Cards Grid ── */}
      {tables.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1C211F] border border-[#38443C] rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-[#171A19] border border-[#38443C] flex items-center justify-center mb-4">
            <QrCode className="w-7 h-7 text-[#38443C]" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F0] mb-1.5">
            No QR codes yet
          </h3>
          <p className="text-sm text-[#68736A] max-w-sm">
            Enter a table number above and click &ldquo;Generate QR Code&rdquo; to
            create the first table QR code.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#68736A] mb-4">
            {tables.length} Generated QR Code{tables.length !== 1 ? 's' : ''}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tables.map((entry) => (
              <QRCard
                key={entry.tableNumber}
                entry={entry}
                onDelete={handleDelete}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
