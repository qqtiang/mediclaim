import { MedicalClaimRecord } from '../types/claim';

interface FinancialSummaryCardsProps {
  records: MedicalClaimRecord[];
}

export function FinancialSummaryCards({ records }: FinancialSummaryCardsProps) {
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  const uniqueEmployees = new Set(
    records.map((r) => r.employeeName?.trim().toLowerCase()).filter(Boolean)
  ).size;

  const uniqueClinics = new Set(
    records.map((r) => r.clinicName?.trim().toLowerCase()).filter(Boolean)
  ).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Grand Total */}
      <div className="bg-white border border-[rgba(24,24,26,0.1)] rounded-xl p-5 sm:p-6 shadow-2xs transition-all hover:border-[rgba(24,24,26,0.2)]">
        <div className="label-caps text-[#18181A]/60">5. Grand Total</div>
        <div className="text-2xl sm:text-3xl font-bold font-display text-[#18181A] tracking-tight tabular-nums mt-2">
          ${totalGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-[#666666] mt-1">
          Total reimbursable medical claim
        </div>
      </div>

      {/* 2. Sub-Total */}
      <div className="bg-white border border-[rgba(24,24,26,0.1)] rounded-xl p-5 sm:p-6 shadow-2xs transition-all hover:border-[rgba(24,24,26,0.2)]">
        <div className="label-caps text-[#18181A]/60">3. Sub-Total</div>
        <div className="text-2xl sm:text-3xl font-bold font-display text-[#18181A] tracking-tight tabular-nums mt-2">
          ${totalSubTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-[#666666] mt-1">
          Consultations & medication before tax
        </div>
      </div>

      {/* 3. Total GST */}
      <div className="bg-white border border-[rgba(24,24,26,0.1)] rounded-xl p-5 sm:p-6 shadow-2xs transition-all hover:border-[rgba(24,24,26,0.2)]">
        <div className="label-caps text-[#18181A]/60">4. Total GST</div>
        <div className="text-2xl sm:text-3xl font-bold font-display text-[#18181A] tracking-tight tabular-nums mt-2">
          ${totalGst.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-[#666666] mt-1">
          Reclaimable GST tax breakdown
        </div>
      </div>

      {/* 4. Records Count */}
      <div className="bg-white border border-[rgba(24,24,26,0.1)] rounded-xl p-5 sm:p-6 shadow-2xs transition-all hover:border-[rgba(24,24,26,0.2)]">
        <div className="label-caps text-[#18181A]/60">Records</div>
        <div className="text-2xl sm:text-3xl font-bold font-display text-[#18181A] tracking-tight tabular-nums mt-2">
          {records.length}
        </div>
        <div className="text-[11px] text-[#666666] mt-1 truncate">
          {uniqueEmployees} {uniqueEmployees === 1 ? 'employee' : 'employees'} · {uniqueClinics} {uniqueClinics === 1 ? 'clinic' : 'clinics'}
        </div>
      </div>
    </div>
  );
}
