import { useState, useCallback, useRef, useEffect } from 'react';
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
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'dinning_room_qr_tables';

function loadTables() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('servesync_qr_tables');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => a.tableNumber - b.tableNumber);
  } catch {
    return [];
  }
}

function saveTables(tables) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  } catch {
  }
}

function buildMenuUrl(tableNumber) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/menu?table=${tableNumber}`;
}

function QRCard({ entry, onDelete, onRegenerate }) {
  const { tableNumber, createdAt } = entry;
  const menuUrl = buildMenuUrl(tableNumber);
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 200, 200);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(menuUrl)}`;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 200, 200);
      setQrLoaded(true);
    };
    img.onerror = () => {
      ctx.fillStyle = '#EFF1EA';
      ctx.fillRect(10, 10, 180, 180);
      ctx.fillStyle = '#526B50';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Table #${tableNumber}`, 100, 95);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#74796F';
      ctx.fillText('QR Code', 100, 115);
      setQrLoaded(true);
    };
  }, [menuUrl, tableNumber]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 480;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size + 80;
    const ctx = offscreen.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 20, 20, size - 40, size - 40);

    ctx.fillStyle = '#20251F';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Dinning Room · Table #${tableNumber}`, size / 2, size + 40);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#74796F';
    ctx.fillText('Scan to order from table', size / 2, size + 62);

    const a = document.createElement('a');
    a.href = offscreen.toDataURL('image/png');
    a.download = `Dinning-Room-Table-${tableNumber}-QR.png`;
    a.click();
  }, [tableNumber]);

  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank', 'width=420,height=520');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dinning Room — Table ${tableNumber} QR</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              padding: 24px;
            }
            .brand {
              font-size: 16px;
              color: #20251F;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              margin-bottom: 16px;
              font-weight: 800;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              border: 1px solid #E6E8E1;
              border-radius: 8px;
              padding: 8px;
            }
            .table-label {
              margin-top: 14px;
              font-size: 24px;
              font-weight: 800;
              color: #20251F;
            }
            .instructions {
              margin-top: 6px;
              font-size: 12px;
              color: #74796F;
            }
          </style>
        </head>
        <body>
          <p class="brand">Dinning Room</p>
          <img class="qr-img" src="${dataUrl}" alt="Table ${tableNumber} QR Code" />
          <p class="table-label">Table #${tableNumber}</p>
          <p class="instructions">Scan to view menu &amp; order</p>
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
  }, [tableNumber]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(menuUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article className="flex flex-col bg-white border border-[#E6E8E1] rounded-xl overflow-hidden shadow-xs hover:border-[#CBD0C5] transition-all">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E8E1] bg-[#FAFBF8]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#EFF1EA] text-[#526B50] flex items-center justify-center">
            <TableIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#20251F] leading-tight">
              Table #{tableNumber}
            </p>
            {dateLabel && (
              <p className="text-[10px] text-[#74796F] leading-tight mt-0.5">
                {dateLabel}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(tableNumber)}
          aria-label={`Delete Table ${tableNumber} QR code`}
          className="p-1.5 rounded-md text-[#74796F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-5 bg-white">
        <canvas
          ref={canvasRef}
          className="w-44 h-44 rounded-md border border-[#E6E8E1]"
        />
      </div>

      <div className="px-4 py-2 border-t border-[#E6E8E1] bg-[#FAFBF8] flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#74796F] truncate font-mono">
          {menuUrl}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-semibold text-[#526B50] hover:underline cursor-pointer shrink-0"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="p-3 border-t border-[#E6E8E1] flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] text-xs font-semibold text-[#20251F] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#526B50]" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#526B50] hover:bg-[#40563F] text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={() => onRegenerate(tableNumber)}
          title="Regenerate QR"
          className="p-2 rounded-md border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#74796F] hover:text-[#20251F] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}

export default function TableQRSection() {
  const [tables, setTables] = useState(() => loadTables());
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    saveTables(tables);
  }, [tables]);

  const handleGenerate = () => {
    setInputError('');
    setSuccessMsg('');

    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError('Please enter a table number.');
      return;
    }

    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1 || num > 999) {
      setInputError('Table number must be an integer between 1 and 999.');
      return;
    }

    if (tables.some((t) => t.tableNumber === num)) {
      setInputError(`Table ${num} already has a generated QR code.`);
      return;
    }

    const newEntry = {
      tableNumber: num,
      createdAt: new Date().toISOString(),
    };

    setTables((prev) => [...prev, newEntry].sort((a, b) => a.tableNumber - b.tableNumber));
    setInputValue('');
    setSuccessMsg(`QR code generated for Table #${num}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (num) => {
    setTables((prev) => prev.filter((t) => t.tableNumber !== num));
  };

  const handleRegenerate = (num) => {
    setTables((prev) =>
      prev.map((t) =>
        t.tableNumber === num ? { ...t, createdAt: new Date().toISOString() } : t
      )
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#20251F] mb-1">
            Table QR Codes
          </h2>
          <p className="text-sm text-[#74796F]">
            Generate and manage tabletop QR ordering codes for tables.
          </p>
        </div>
      </div>

      <div className="mb-8 p-5 bg-white border border-[#E6E8E1] rounded-xl shadow-xs">
        <h3 className="text-sm font-bold text-[#20251F] mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#526B50]" />
          Create New Table Code
        </h3>

        <div className="flex flex-wrap gap-3 items-start">
          <div className="w-full sm:w-64">
            <label
              htmlFor="table-number-input"
              className="block text-xs font-semibold text-[#74796F] mb-1"
            >
              Table Number
            </label>
            <input
              ref={inputRef}
              id="table-number-input"
              type="number"
              min="1"
              max="999"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 rounded-md bg-white border border-[#E6E8E1] text-sm text-[#20251F] focus:outline-none focus:ring-2 focus:ring-[#526B50]/30 focus:border-[#526B50]"
            />
            {inputError && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {inputError}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <div className="hidden sm:block mb-[22px]" />
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              Generate QR Code
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}
      </div>

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#E6E8E1] rounded-xl border-dashed">
          <QrCode className="w-8 h-8 text-[#74796F] opacity-40 mb-3" />
          <h3 className="text-sm font-bold text-[#20251F] mb-1">No QR Codes Generated</h3>
          <p className="text-xs text-[#74796F] max-w-xs">
            Enter a table number above to generate your first tabletop QR code.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#74796F] mb-3">
            {tables.length} Active Table{tables.length !== 1 ? 's' : ''}
          </h3>
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
