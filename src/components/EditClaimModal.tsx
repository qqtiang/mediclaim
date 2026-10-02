import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calculator } from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';

interface EditClaimModalProps {
  claim: MedicalClaimRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClaim: MedicalClaimRecord) => void;
  isNew?: boolean;
}

export function EditClaimModal({
  claim,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}: EditClaimModalProps) {
  const [formData, setFormData] = useState<Partial<MedicalClaimRecord>>({
    employeeName: '',
    clinicName: '',
    subTotal: 0,
    gst: 0,
    grandTotal: 0,
    summaryOfIllness: '',
    receiptDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    currency: 'SGD',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (claim) {
      setFormData({
        ...claim,
      });
    } else {
      setFormData({
        id: `claim-manual-${Date.now()}`,
        employeeName: '',
        clinicName: '',
        subTotal: 0,
        gst: 0,
        grandTotal: 0,
        summaryOfIllness: '',
        receiptDate: new Date().toISOString().split('T')[0],
        receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        currency: 'SGD',
        createdAt: new Date().toISOString(),
      });
    }
    setError(null);
  }, [claim, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof MedicalClaimRecord, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubTotalOrGstChange = (subTotalVal?: number, gstVal?: number) => {
    const s = subTotalVal !== undefined ? subTotalVal : Number(formData.subTotal) || 0;
    const g = gstVal !== undefined ? gstVal : Number(formData.gst) || 0;
    const computedGrand = Number((s + g).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      subTotal: s,
      gst: g,
      grandTotal: computedGrand,
    }));
  };

  const handleAutoCalculateGst = (gstRatePercent = 9) => {
    const s = Number(formData.subTotal) || 0;
    const calculatedGst = Number(((s * gstRatePercent) / 100).toFixed(2));
    const calculatedGrand = Number((s + calculatedGst).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      gst: calculatedGst,
      grandTotal: calculatedGrand,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName?.trim()) {
      setError('Please provide the Employee Name.');
      return;
    }
    if (!formData.clinicName?.trim()) {
      setError('Please provide the Clinic Name.');
      return;
    }
    if ((Number(formData.grandTotal) || 0) <= 0) {
      setError('Grand Total must be greater than 0.00.');
      return;
    }
    if (!formData.summaryOfIllness?.trim()) {
      setError('Please provide a Summary of Illness.');
      return;
    }

    const updated: MedicalClaimRecord = {
      id: formData.id || `claim-${Date.now()}`,
      employeeName: formData.employeeName.trim(),
      clinicName: formData.clinicName.trim(),
      subTotal: Number(Number(formData.subTotal || 0).toFixed(2)),
      gst: Number(Number(formData.gst || 0).toFixed(2)),
      grandTotal: Number(Number(formData.grandTotal || 0).toFixed(2)),
      summaryOfIllness: formData.summaryOfIllness.trim(),
      receiptDate: formData.receiptDate || new Date().toISOString().split('T')[0],
      receiptNumber: formData.receiptNumber || 'N/A',
      currency: formData.currency || 'SGD',
      lineItems: formData.lineItems || [],
      imagePreviewUrl: formData.imagePreviewUrl,
      filename: formData.filename,
      isVerified: true,
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[rgba(24,24,26,0.15)] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(24,24,26,0.1)] bg-[#F8F7F4]/60">
          <div>
            <h2 className="text-base font-bold font-display text-[#18181A]">
              {isNew ? 'Add Medical Claim Record' : 'Edit Medical Claim Record'}
            </h2>
            <p className="label-caps text-[#18181A]/60 mt-0.5">
              Review and update the 6 required medical submission fields
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#18181A] hover:bg-[#F8F7F4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. Name of Employee */}
          <div>
            <label className="block label-caps text-[#18181A] mb-1">
              1. Name of Employee <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alexander Tan Wei Ming"
              value={formData.employeeName || ''}
              onChange={(e) => handleInputChange('employeeName', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
            />
          </div>

          {/* 2. Clinic Name */}
          <div>
            <label className="block label-caps text-[#18181A] mb-1">
              2. Clinic Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Raffles Medical Clinic (Marina Bay)"
              value={formData.clinicName || ''}
              onChange={(e) => handleInputChange('clinicName', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
            />
          </div>

          {/* Financial Breakdown (Sub-Total, GST, Grand Total) */}
          <div className="p-3.5 bg-[#F8F7F4] border border-[rgba(24,24,26,0.1)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[#18181A]">Financial Breakdown</span>
              <button
                type="button"
                onClick={() => handleAutoCalculateGst(9)}
                className="inline-flex items-center gap-1 label-caps text-[#2563EB] hover:text-blue-800 bg-white px-2 py-1 rounded border border-blue-200 transition-colors shadow-2xs"
              >
                <Calculator className="w-3 h-3" />
                <span>Auto 9% GST</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 3. Sub-Total */}
              <div>
                <label className="block label-caps text-[#18181A]/70 mb-1">
                  3. Sub-Total ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.subTotal ?? ''}
                  onChange={(e) =>
                    handleSubTotalOrGstChange(parseFloat(e.target.value) || 0, undefined)
                  }
                  className="w-full px-3 py-1.5 font-display text-sm bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] tabular-nums text-[#18181A]"
                />
              </div>

              {/* 4. GST */}
              <div>
                <label className="block label-caps text-[#18181A]/70 mb-1">
                  4. GST ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.gst ?? ''}
                  onChange={(e) =>
                    handleSubTotalOrGstChange(undefined, parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-1.5 font-display text-sm bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] tabular-nums text-[#18181A]"
                />
              </div>

              {/* 5. Grand Total */}
              <div>
                <label className="block label-caps text-[#18181A] mb-1">
                  5. Grand Total ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.grandTotal ?? ''}
                  onChange={(e) =>
                    handleInputChange('grandTotal', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-1.5 font-display font-bold text-sm bg-white border-2 border-[#18181A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] tabular-nums text-[#18181A]"
                />
              </div>
            </div>
          </div>

          {/* 6. Summary of Illness */}
          <div>
            <label className="block label-caps text-[#18181A] mb-1">
              6. Summary of Illness / Diagnosis <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI) with Fever and Sore Throat"
              value={formData.summaryOfIllness || ''}
              onChange={(e) => handleInputChange('summaryOfIllness', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
            />
          </div>

          {/* Extra Meta: Date & Receipt Number */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block label-caps text-[#18181A]/70 mb-1">Receipt Date</label>
              <input
                type="date"
                value={formData.receiptDate || ''}
                onChange={(e) => handleInputChange('receiptDate', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
              />
            </div>
            <div>
              <label className="block label-caps text-[#18181A]/70 mb-1">Receipt / Invoice #</label>
              <input
                type="text"
                value={formData.receiptNumber || ''}
                onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                placeholder="e.g. INV-98124"
                className="w-full px-3 py-1.5 font-mono text-xs bg-white border border-[rgba(24,24,26,0.2)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18181A] text-[#18181A]"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(24,24,26,0.1)] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#666666] hover:text-[#18181A] hover:bg-[#F8F7F4] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18181A] hover:bg-[#2d2d30] rounded-lg shadow-2xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Add Record' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
