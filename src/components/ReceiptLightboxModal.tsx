import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText, CheckCircle2 } from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';

interface ReceiptLightboxModalProps {
  claim: MedicalClaimRecord | null;
  onClose: () => void;
}

export function ReceiptLightboxModal({ claim, onClose }: ReceiptLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!claim) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col lg:flex-row w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-[rgba(24,24,26,0.15)]">
        {/* Left Side: Receipt Image Viewer */}
        <div className="relative flex-1 flex flex-col bg-[#18181A] items-center justify-center min-h-[350px] lg:min-h-[550px] p-4 overflow-hidden select-none">
          {/* Controls Bar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-[#18181A]/90 backdrop-blur border border-white/20 rounded-lg p-1 text-white text-xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <span className="px-2 text-white/60 font-mono text-[11px] tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {claim.imagePreviewUrl ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={claim.imagePreviewUrl}
                alt={`Receipt for ${claim.clinicName}`}
                className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 ease-out shadow-2xl rounded"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white/50 gap-3 p-8 text-center">
              <FileText className="w-16 h-16 stroke-1 text-white/30" />
              <p className="text-sm font-medium text-white/80 font-display">No receipt image attached</p>
              <p className="text-xs text-white/50 max-w-xs">
                This record was added manually or loaded from a sample template.
              </p>
            </div>
          )}

          {claim.imagePreviewUrl && (
            <a
              href={claim.imagePreviewUrl}
              download={`${claim.receiptNumber || 'receipt'}.jpg`}
              className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </a>
          )}
        </div>

        {/* Right Side: Extracted Metadata Audit Panel */}
        <div className="w-full lg:w-96 flex flex-col bg-[#F8F7F4] border-t lg:border-t-0 lg:border-l border-[rgba(24,24,26,0.1)] p-6 overflow-y-auto">
          <div className="flex items-start justify-between pb-4 border-b border-[rgba(24,24,26,0.1)]">
            <div>
              <div className="flex items-center gap-1.5 label-caps text-[#2563EB]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Extracted Record Audit</span>
              </div>
              <h3 className="text-base font-bold font-display text-[#18181A] mt-1">
                {claim.employeeName}
              </h3>
              <p className="text-xs text-[#666666]">{claim.clinicName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-[#18181A] hover:bg-white rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Extracted Attributes */}
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <span className="label-caps text-[#18181A]/60 block">1. Employee</span>
              <span className="text-sm font-semibold text-[#18181A] block mt-0.5">
                {claim.employeeName || '—'}
              </span>
            </div>

            <div>
              <span className="label-caps text-[#18181A]/60 block">2. Clinic Name</span>
              <span className="text-sm font-semibold text-[#18181A] block mt-0.5">
                {claim.clinicName || '—'}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[rgba(24,24,26,0.1)] shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="label-caps text-[#18181A]/70">3. Sub-Total:</span>
                <span className="font-display font-medium text-[#18181A] tabular-nums">
                  ${claim.subTotal.toFixed(2)} {claim.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="label-caps text-[#18181A]/70">4. GST:</span>
                <span className="font-display font-medium text-[#18181A] tabular-nums">
                  ${claim.gst.toFixed(2)} {claim.currency}
                </span>
              </div>
              <div className="h-px bg-[rgba(24,24,26,0.1)] my-1" />
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="label-caps text-[#18181A]">5. Grand Total:</span>
                <span className="font-display text-[#18181A] tabular-nums font-bold">
                  ${claim.grandTotal.toFixed(2)} {claim.currency}
                </span>
              </div>
            </div>

            <div>
              <span className="label-caps text-[#18181A]/60 block">6. Summary of Illness</span>
              <div className="mt-1 p-3 bg-white border border-[rgba(24,24,26,0.1)] rounded-xl text-[#18181A] text-xs leading-relaxed font-normal shadow-2xs">
                {claim.summaryOfIllness || 'No illness summary recorded'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-[#666666]">
              <div>
                <span className="label-caps text-[#18181A]/40 block text-[10px]">Receipt Date</span>
                <span className="font-medium text-[#18181A]">{claim.receiptDate || '—'}</span>
              </div>
              <div>
                <span className="label-caps text-[#18181A]/40 block text-[10px]">Invoice / Receipt #</span>
                <span className="font-mono text-[#18181A]">{claim.receiptNumber || '—'}</span>
              </div>
            </div>

            {claim.lineItems && claim.lineItems.length > 0 && (
              <div className="pt-2">
                <span className="label-caps text-[#18181A]/60 block mb-1.5">Detected Items</span>
                <ul className="space-y-1 list-disc list-inside text-[#555555] bg-white p-2.5 rounded-xl border border-[rgba(24,24,26,0.1)]">
                  {claim.lineItems.map((item, idx) => (
                    <li key={idx} className="text-[11px] truncate">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-xs font-semibold text-[#18181A] bg-white hover:bg-[#eae8e3] border border-[rgba(24,24,26,0.15)] rounded-lg transition-colors shadow-2xs"
            >
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
