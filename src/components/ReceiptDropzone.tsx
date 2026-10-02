import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Loader2,
  Plus,
  Layers,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { MedicalClaimRecord, ProcessingItem } from '../types/claim';
import {
  SAMPLE_RECEIPT_TEMPLATES,
  generateReceiptImage,
  SampleReceiptTemplate,
} from '../utils/sampleReceipts';

interface ReceiptDropzoneProps {
  onClaimExtracted: (claim: MedicalClaimRecord) => void;
  onOpenManualModal: () => void;
  onLoadAllSamples: () => void;
  currentRecordsCount: number;
}

export function ReceiptDropzone({
  onClaimExtracted,
  onOpenManualModal,
  onLoadAllSamples,
  currentRecordsCount,
}: ReceiptDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<ProcessingItem[]>([]);
  const [isProcessingSample, setIsProcessingSample] = useState(false);
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler to let users paste screenshot receipts
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        handleFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process uploaded files through Gemini OCR API
  const processImage = async (
    fileOrDataUrl: File | string,
    filename: string,
    fileSize = 0,
    mimeType = 'image/jpeg'
  ) => {
    const itemId = `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let base64Data = '';
    let previewUrl = '';

    if (typeof fileOrDataUrl === 'string') {
      previewUrl = fileOrDataUrl;
      base64Data = fileOrDataUrl;
    } else {
      previewUrl = URL.createObjectURL(fileOrDataUrl);
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      });
      mimeType = fileOrDataUrl.type || 'image/jpeg';
    }

    const newItem: ProcessingItem = {
      id: itemId,
      filename,
      fileSize,
      previewUrl,
      status: 'processing',
      progressMessage: 'Extracting medical details via OCR...',
    };

    setProcessingQueue((prev) => [newItem, ...prev]);

    try {
      const response = await fetch('/api/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          filename,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      const extracted = result.data;

      const record: MedicalClaimRecord = {
        id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeName: extracted.employeeName || 'Not Specified',
        clinicName: extracted.clinicName || 'Medical Practice',
        subTotal: Number(extracted.subTotal) || 0,
        gst: Number(extracted.gst) || 0,
        grandTotal: Number(extracted.grandTotal) || 0,
        summaryOfIllness: extracted.summaryOfIllness || 'Outpatient Consultation',
        receiptDate: extracted.receiptDate || new Date().toISOString().split('T')[0],
        receiptNumber: extracted.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        currency: extracted.currency || 'SGD',
        lineItems: extracted.lineItems || [],
        imagePreviewUrl: previewUrl,
        filename,
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: 'success', progressMessage: 'Extracted successfully!' }
            : item
        )
      );

      onClaimExtracted(record);

      setTimeout(() => {
        setProcessingQueue((prev) => prev.filter((item) => item.id !== itemId));
      }, 4000);
    } catch (err: any) {
      console.error('OCR processing failed:', err);
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: 'error',
                errorMessage: err?.message || 'Failed to extract data. Please retry or enter manually.',
              }
            : item
        )
      );
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/')) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      alert('Please upload valid image files (JPEG, PNG, WEBP).');
      return;
    }

    validFiles.forEach((f) => processImage(f, f.name, f.size, f.type));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleTestSample = async (template: SampleReceiptTemplate) => {
    setSampleDropdownOpen(false);
    setIsProcessingSample(true);
    try {
      const sampleImageUrl = await generateReceiptImage(template);
      if (sampleImageUrl) {
        await processImage(
          sampleImageUrl,
          `${template.title.toLowerCase().replace(/\s+/g, '_')}_receipt.jpg`,
          128000,
          'image/jpeg'
        );
      }
    } finally {
      setIsProcessingSample(false);
    }
  };

  const dismissQueueItem = (id: string) => {
    setProcessingQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Upload Box Container Matching Variation 1 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 bg-white shadow-2xs ${
          isDragging
            ? 'border-[#2563EB] bg-blue-50/20 scale-[1.005]'
            : 'border-[rgba(24,24,26,0.18)] hover:border-[rgba(24,24,26,0.35)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
          }}
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F8F7F4] border border-[rgba(24,24,26,0.08)] flex items-center justify-center text-[#18181A] mb-3">
            <UploadCloud className="w-6 h-6 text-[#18181A]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#18181A] tracking-tight">
            Drop medical receipts here, or browse
          </h2>

          <p className="label-caps text-[#18181A]/60 mt-1">
            JPG, PNG, WEBP supported · Auto OCR extraction
          </p>

          <p className="text-xs text-[#666666] mt-2 max-w-md leading-relaxed">
            Extracts <strong className="text-[#18181A] font-semibold">1. Employee</strong>, <strong className="text-[#18181A] font-semibold">2. Clinic</strong>, <strong className="text-[#18181A] font-semibold">3. Sub-Total</strong>, <strong className="text-[#18181A] font-semibold">4. GST</strong>, <strong className="text-[#18181A] font-semibold">5. Grand Total</strong>, and <strong className="text-[#18181A] font-semibold">6. Illness Summary</strong>.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#18181A] hover:bg-[#2d2d30] rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <FileImage className="w-4 h-4" />
              <span>Choose Image Files</span>
            </button>

            {/* Test Sample Receipt Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSampleDropdownOpen(!sampleDropdownOpen)}
                disabled={isProcessingSample}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2563EB] bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/80 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isProcessingSample ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                )}
                <span>Test OCR with Sample Receipt</span>
              </button>

              {sampleDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[rgba(24,24,26,0.12)] py-2 z-30 text-left animate-in fade-in duration-100">
                  <div className="px-3 py-1 label-caps text-[#18181A]/50">
                    Select a sample bill
                  </div>
                  {SAMPLE_RECEIPT_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTestSample(tpl)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#F8F7F4] transition-colors flex flex-col"
                    >
                      <span className="font-semibold text-[#18181A]">{tpl.title}</span>
                      <span className="text-[11px] text-[#666666] truncate">
                        {tpl.employee} · {tpl.illness}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#18181A] bg-[#F8F7F4] hover:bg-[#eae8e3] border border-[rgba(24,24,26,0.1)] rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* Quick Tip / Paste helper */}
          <div className="flex items-center gap-3 mt-4 label-caps text-[#18181A]/50">
            <span>Supports multiple files</span>
            <span aria-hidden="true">·</span>
            <span>Paste from clipboard (Ctrl+V / ⌘V)</span>
            {currentRecordsCount === 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onLoadAllSamples}
                  className="text-[#2563EB] hover:underline font-semibold"
                >
                  Load 3 Demo Records
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Processing Queue Drawer */}
      {processingQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#18181A] px-1">
            <span className="flex items-center gap-1.5 label-caps text-[#18181A]/80">
              <Layers className="w-3.5 h-3.5 text-[#18181A]" />
              <span>Processing Queue ({processingQueue.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {processingQueue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 bg-white rounded-xl border shadow-2xs transition-all ${
                  item.status === 'processing'
                    ? 'border-blue-200 bg-blue-50/20'
                    : item.status === 'success'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-[#F8F7F4] overflow-hidden shrink-0 border border-[rgba(24,24,26,0.08)] flex items-center justify-center">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#18181A] truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    {item.status === 'processing' && (
                      <span className="flex items-center gap-1 text-[11px] text-[#2563EB] font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>OCR Running</span>
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Extracted</span>
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#666666] mt-0.5 truncate">
                    {item.status === 'processing'
                      ? item.progressMessage
                      : item.status === 'success'
                      ? 'Added to table · Ready for export'
                      : item.errorMessage}
                  </p>
                </div>

                {item.status === 'error' && (
                  <button
                    onClick={() => dismissQueueItem(item.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Dismiss"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
