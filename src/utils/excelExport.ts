import * as XLSX from 'xlsx';
import { MedicalClaimRecord } from '../types/claim';

export function exportClaimsToExcel(records: MedicalClaimRecord[], filenamePrefix = 'Medical_Claims_Submission') {
  if (records.length === 0) {
    return false;
  }

  // Calculate totals
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrand = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  // Prepare data rows
  const header = [
    'No.',
    'Name of Employee',
    'Clinic Name',
    'Sub-Total',
    'GST',
    'Grand Total',
    'Summary of Illness',
    'Receipt Date',
    'Receipt No.',
    'Currency',
  ];

  const rows: (string | number)[][] = [
    header,
    ...records.map((rec, index) => [
      index + 1,
      rec.employeeName || 'Not Specified',
      rec.clinicName || 'Not Specified',
      Number(rec.subTotal.toFixed(2)),
      Number(rec.gst.toFixed(2)),
      Number(rec.grandTotal.toFixed(2)),
      rec.summaryOfIllness || 'N/A',
      rec.receiptDate || '',
      rec.receiptNumber || '',
      rec.currency || 'SGD',
    ]),
  ];

  // Append empty row and Total row
  rows.push([]);
  rows.push([
    'TOTAL',
    `Count: ${records.length} records`,
    '',
    Number(totalSubTotal.toFixed(2)),
    Number(totalGst.toFixed(2)),
    Number(totalGrand.toFixed(2)),
    'Corporate Medical Claims Summary',
    '',
    '',
    '',
  ]);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Configure column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // No.
    { wch: 24 }, // Name of Employee
    { wch: 28 }, // Clinic Name
    { wch: 14 }, // Sub-Total
    { wch: 12 }, // GST
    { wch: 16 }, // Grand Total
    { wch: 38 }, // Summary of Illness
    { wch: 14 }, // Receipt Date
    { wch: 16 }, // Receipt No.
    { wch: 10 }, // Currency
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Claims');

  // Generate filename with current date
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filenamePrefix}_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, fullFilename);
  return true;
}

export function exportClaimsToCsv(records: MedicalClaimRecord[], filenamePrefix = 'Medical_Claims_Submission') {
  if (records.length === 0) return false;

  const headers = [
    'No.',
    'Name of Employee',
    'Clinic Name',
    'Sub-Total',
    'GST',
    'Grand Total',
    'Summary of Illness',
    'Receipt Date',
    'Receipt No.',
    'Currency',
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = records.map((rec, i) => [
    i + 1,
    escapeCsv(rec.employeeName),
    escapeCsv(rec.clinicName),
    rec.subTotal.toFixed(2),
    rec.gst.toFixed(2),
    rec.grandTotal.toFixed(2),
    escapeCsv(rec.summaryOfIllness),
    escapeCsv(rec.receiptDate),
    escapeCsv(rec.receiptNumber),
    escapeCsv(rec.currency),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
