import { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpDown,
  FileText,
  Check,
} from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';
import { exportClaimsToExcel, exportClaimsToCsv } from '../utils/excelExport';

interface ClaimsTableProps {
  records: MedicalClaimRecord[];
  onEdit: (record: MedicalClaimRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onViewImage: (record: MedicalClaimRecord) => void;
}

type SortField = 'employeeName' | 'clinicName' | 'grandTotal' | 'receiptDate';
type SortOrder = 'asc' | 'desc';

export function ClaimsTable({
  records,
  onEdit,
  onDelete,
  onClearAll,
  onViewImage,
}: ClaimsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('receiptDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filter & sort records
  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.employeeName?.toLowerCase().includes(q) ||
        r.clinicName?.toLowerCase().includes(q) ||
        r.summaryOfIllness?.toLowerCase().includes(q) ||
        r.receiptNumber?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'grandTotal') {
        comparison = (a.grandTotal || 0) - (b.grandTotal || 0);
      } else if (sortField === 'employeeName') {
        comparison = (a.employeeName || '').localeCompare(b.employeeName || '');
      } else if (sortField === 'clinicName') {
        comparison = (a.clinicName || '').localeCompare(b.clinicName || '');
      } else if (sortField === 'receiptDate') {
        comparison = (a.receiptDate || '').localeCompare(b.receiptDate || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [records, searchQuery, sortField, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected claim record(s)?`
      )
    ) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      const success = exportClaimsToExcel(records);
      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsv = () => {
    exportClaimsToCsv(records);
  };

  const sumSubTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const sumGst = filteredRecords.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const sumGrandTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  const allSelected =
    filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;

  return (
    <div className="bg-white rounded-xl border border-[rgba(24,24,26,0.1)] shadow-2xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[rgba(24,24,26,0.1)] bg-[#F8F7F4]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, clinic, illness..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[rgba(24,24,26,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {records.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 text-xs font-medium text-[#18181A] bg-white hover:bg-[#F8F7F4] border border-[rgba(24,24,26,0.15)] rounded-lg transition-colors"
                title="Download CSV format"
              >
                CSV
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#18181A] hover:bg-[#2d2d30] rounded-lg shadow-2xs transition-colors"
              >
                {exportSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Download .xlsx</span>
                  </>
                )}
              </button>
            </>
          )}

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all records?')) {
                  onClearAll();
                  setSelectedIds(new Set());
                }
              }}
              className="px-2.5 py-1.5 text-xs text-[#666666] hover:text-[#18181A] hover:bg-[#F8F7F4] rounded-lg transition-colors"
              title="Clear all records"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-[#18181A] bg-white">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-[rgba(24,24,26,0.3)] text-[#18181A] focus:ring-[#18181A]"
                  aria-label="Select all rows"
                />
              </th>
              <th className="py-3 px-2 w-10 text-center label-caps text-[#18181A]/40">#</th>
              <th className="py-3 px-3 min-w-[170px]">
                <button
                  type="button"
                  onClick={() => handleSort('employeeName')}
                  className="flex items-center gap-1 label-caps text-[#18181A] hover:text-[#2563EB] group text-left"
                >
                  <span>1. Employee</span>
                  <ArrowUpDown className="w-3 h-3 text-[#18181A]/40 group-hover:text-[#2563EB]" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleSort('clinicName')}
                  className="flex items-center gap-1 label-caps text-[#18181A] hover:text-[#2563EB] group text-left"
                >
                  <span>2. Clinic</span>
                  <ArrowUpDown className="w-3 h-3 text-[#18181A]/40 group-hover:text-[#2563EB]" />
                </button>
              </th>
              <th className="py-3 px-3 text-right min-w-[100px] label-caps text-[#18181A]">
                <span>3. Sub-Total</span>
              </th>
              <th className="py-3 px-3 text-right min-w-[90px] label-caps text-[#18181A]">
                <span>4. GST</span>
              </th>
              <th className="py-3 px-3 text-right min-w-[110px]">
                <button
                  type="button"
                  onClick={() => handleSort('grandTotal')}
                  className="flex items-center gap-1 justify-end w-full label-caps text-[#18181A] hover:text-[#2563EB] group"
                >
                  <span>5. Total</span>
                  <ArrowUpDown className="w-3 h-3 text-[#18181A]/40 group-hover:text-[#2563EB]" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[240px] label-caps text-[#18181A]">
                <span>6. Summary of Illness</span>
              </th>
              <th className="py-3 px-3 text-center min-w-[70px] label-caps text-[#18181A]">
                Receipt
              </th>
              <th className="py-3 px-3 text-right min-w-[70px] label-caps text-[#18181A]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(24,24,26,0.08)]">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-[#666666]">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto">
                    <FileText className="w-10 h-10 text-slate-300 stroke-1" />
                    <p className="text-sm font-semibold text-[#18181A] font-display">No medical records yet</p>
                    <p className="text-xs text-[#666666]">
                      Upload or drag and drop medical receipts above, or test with a sample receipt.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const isSelected = selectedIds.has(record.id);

                const mathMismatch =
                  Math.abs(record.subTotal + record.gst - record.grandTotal) > 0.05;

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-[#F8F7F4]/60 transition-colors ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(record.id)}
                        className="rounded border-[rgba(24,24,26,0.3)] text-[#18181A] focus:ring-[#18181A]"
                        aria-label={`Select claim for ${record.employeeName}`}
                      />
                    </td>

                    {/* Row Index */}
                    <td className="py-3.5 px-2 text-center text-[#18181A]/40 font-mono text-[11px] tabular-nums">
                      {index + 1}
                    </td>

                    {/* 1. Name of Employee */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#18181A] truncate max-w-[190px]">
                        {record.employeeName || '—'}
                      </div>
                      <div className="label-caps text-[#18181A]/40 mt-0.5">
                        {record.receiptDate} {record.receiptNumber ? `· #${record.receiptNumber}` : ''}
                      </div>
                    </td>

                    {/* 2. Clinic Name */}
                    <td className="py-3.5 px-3">
                      <div className="text-[#18181A] font-normal truncate max-w-[210px]" title={record.clinicName}>
                        {record.clinicName || '—'}
                      </div>
                    </td>

                    {/* 3. Sub-Total */}
                    <td className="py-3.5 px-3 text-right font-display tabular-nums text-[#18181A]">
                      ${record.subTotal.toFixed(2)}
                    </td>

                    {/* 4. GST */}
                    <td className="py-3.5 px-3 text-right font-display tabular-nums text-[#666666]">
                      ${record.gst.toFixed(2)}
                    </td>

                    {/* 5. Grand Total */}
                    <td className="py-3.5 px-3 text-right font-display tabular-nums font-bold text-[#18181A] text-sm">
                      <div className="flex items-center justify-end gap-1">
                        {mathMismatch && (
                          <span
                            title="Sub-Total + GST does not match Grand Total. Click Edit to verify."
                            className="text-amber-600 cursor-help"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span>${record.grandTotal.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* 6. Summary of Illness */}
                    <td className="py-3.5 px-3">
                      <div
                        className="text-[#555555] font-normal line-clamp-2 max-w-[280px]"
                        title={record.summaryOfIllness}
                      >
                        {record.summaryOfIllness || '—'}
                      </div>
                    </td>

                    {/* Receipt Image Thumbnail */}
                    <td className="py-3.5 px-3 text-center">
                      {record.imagePreviewUrl ? (
                        <button
                          type="button"
                          onClick={() => onViewImage(record)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[rgba(24,24,26,0.15)] overflow-hidden bg-slate-50 hover:border-[#18181A] transition-colors group relative"
                          title="View original receipt image"
                        >
                          <img
                            src={record.imagePreviewUrl}
                            alt="Receipt"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewImage(record)}
                          className="p-1.5 text-slate-400 hover:text-[#18181A] rounded transition-colors"
                          title="View claim details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                    {/* Actions (Edit / Delete) */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(record)}
                          className="p-1.5 text-slate-500 hover:text-[#18181A] hover:bg-[#F8F7F4] rounded transition-colors"
                          title="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-[#F8F7F4]/70 font-semibold text-[#18181A] border-t-2 border-[#18181A]">
                <td colSpan={4} className="py-3 px-4 text-left label-caps">
                  <span>TOTAL ({filteredRecords.length} records)</span>
                </td>
                <td className="py-3 px-3 text-right font-display tabular-nums text-[#18181A]">
                  ${sumSubTotal.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-display tabular-nums text-[#666666]">
                  ${sumGst.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-display tabular-nums font-bold text-[#18181A] text-sm">
                  ${sumGrandTotal.toFixed(2)}
                </td>
                <td colSpan={3} className="py-3 px-3 label-caps text-[#18181A]/50">
                  ALL AMOUNTS NORMALIZED TO SGD
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
