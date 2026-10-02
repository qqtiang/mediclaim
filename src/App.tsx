import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { MedicalClaimRecord } from './types/claim';
import { ReceiptDropzone } from './components/ReceiptDropzone';
import { ClaimsTable } from './components/ClaimsTable';
import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { EditClaimModal } from './components/EditClaimModal';
import { ReceiptLightboxModal } from './components/ReceiptLightboxModal';
import { getDefaultSampleRecords } from './utils/sampleReceipts';
import { exportClaimsToExcel } from './utils/excelExport';

const LOCAL_STORAGE_KEY = 'medclaim_submissions_v1';

export default function App() {
  const [records, setRecords] = useState<MedicalClaimRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse local storage records:', e);
    }
    return getDefaultSampleRecords();
  });

  const [activeEditingClaim, setActiveEditingClaim] = useState<MedicalClaimRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [activeViewingClaim, setActiveViewingClaim] = useState<MedicalClaimRecord | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to localStorage:', e);
    }
  }, [records]);

  const handleClaimExtracted = (newClaim: MedicalClaimRecord) => {
    setRecords((prev) => [newClaim, ...prev]);
  };

  const handleSaveClaim = (updatedClaim: MedicalClaimRecord) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === updatedClaim.id);
      if (exists) {
        return prev.map((r) => (r.id === updatedClaim.id ? updatedClaim : r));
      }
      return [updatedClaim, ...prev];
    });
    setIsEditModalOpen(false);
    setActiveEditingClaim(null);
  };

  const handleDeleteClaim = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setRecords([]);
  };

  const handleLoadSamples = () => {
    setRecords(getDefaultSampleRecords());
  };

  const handleEditClick = (record: MedicalClaimRecord) => {
    setActiveEditingClaim(record);
    setIsNewRecord(false);
    setIsEditModalOpen(true);
  };

  const handleOpenManualModal = () => {
    setActiveEditingClaim(null);
    setIsNewRecord(true);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#18181A] selection:bg-[#2563EB] selection:text-[#F8F7F4]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Top Header Matching Variation 1 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-4 border-b border-[rgba(24,24,26,0.08)]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl font-display tracking-tight text-[#18181A]">
              MedClaim
            </span>
          </div>

          <nav className="flex items-center gap-6 label-caps text-[#18181A]/70">
            <span className="text-[#18181A] font-bold cursor-default">Claims Submission</span>
            <span
              className="hover:text-[#18181A] transition-colors cursor-pointer"
              onClick={() => window.scrollTo({ top: 440, behavior: 'smooth' })}
            >
              Submitted Records ({records.length})
            </span>
            <span
              className="hover:text-[#18181A] transition-colors cursor-pointer"
              onClick={() => exportClaimsToExcel(records)}
            >
              Export Excel
            </span>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenManualModal}
              className="px-3.5 py-2 text-xs font-semibold text-[#18181A] bg-white hover:bg-[#eae8e3] border border-[rgba(24,24,26,0.12)] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>

            <button
              type="button"
              onClick={() => exportClaimsToExcel(records)}
              disabled={records.length === 0}
              className="px-4 py-2 rounded-lg font-medium text-xs text-white bg-[#18181A] hover:bg-[#2d2d30] disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .xlsx</span>
            </button>
          </div>
        </header>

        {/* Main Section */}
        <main>
          {/* Hero Section */}
          <section className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="label-caps text-[#2563EB] mb-1 font-semibold">
                Corporate Health & Medical Reimbursements
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold font-display tracking-tight leading-[1.05] text-[#18181A] my-2">
                Medical Cost<br />Submission Portal
              </h1>
              <p className="max-w-[620px] text-[#666666] text-base leading-relaxed mt-3">
                Upload or drag and drop doctor bills and clinic receipts. Gemini multimodal OCR extracts the 6 required
                fields: <span className="text-[#18181A] font-medium">Employee Name</span>, <span className="text-[#18181A] font-medium">Clinic Name</span>, <span className="text-[#18181A] font-medium">Sub-Total</span>, <span className="text-[#18181A] font-medium">GST</span>, <span className="text-[#18181A] font-medium">Grand Total</span>, and <span className="text-[#18181A] font-medium">Summary of Illness</span>.
              </p>
            </div>

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleLoadSamples}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#666666] hover:text-[#18181A] bg-white border border-[rgba(24,24,26,0.12)] rounded-lg transition-colors shadow-2xs"
                title="Reset to 3 demo records"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Demo Records</span>
              </button>
            )}
          </section>

          {/* 4 Financial Stat Cards Matching Variation 1 */}
          <FinancialSummaryCards records={records} />

          {/* Upload Dropzone */}
          <ReceiptDropzone
            onClaimExtracted={handleClaimExtracted}
            onOpenManualModal={handleOpenManualModal}
            onLoadAllSamples={handleLoadSamples}
            currentRecordsCount={records.length}
          />

          {/* Claims Table */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-lg font-bold font-display text-[#18181A]">
                  Submitted Claims
                </h2>
                <p className="text-xs text-[#666666]">
                  Click receipt thumbnails to inspect image, or edit fields to verify amounts.
                </p>
              </div>
              <div className="label-caps text-[#18181A]/60">
                {records.length} {records.length === 1 ? 'RECORD' : 'RECORDS'}
              </div>
            </div>

            <ClaimsTable
              records={records}
              onEdit={handleEditClick}
              onDelete={handleDeleteClaim}
              onClearAll={handleClearAll}
              onViewImage={(record) => setActiveViewingClaim(record)}
            />
          </section>
        </main>

        {/* Footer Matching Variation 1 */}
        <footer className="mt-16 pt-6 border-t border-[rgba(24,24,26,0.1)] label-caps text-[#18181A]/60 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>MedClaim System · Compliant with Corporate Insurance & IRAS GST Audits</div>
          <div className="text-[11px] text-[#18181A]/40">Export format: Excel (.xlsx) & CSV</div>
        </footer>
      </div>

      {/* Edit / Manual Add Modal */}
      <EditClaimModal
        claim={activeEditingClaim}
        isOpen={isEditModalOpen}
        isNew={isNewRecord}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveEditingClaim(null);
        }}
        onSave={handleSaveClaim}
      />

      {/* Receipt Image Lightbox Modal */}
      <ReceiptLightboxModal
        claim={activeViewingClaim}
        onClose={() => setActiveViewingClaim(null)}
      />
    </div>
  );
}
