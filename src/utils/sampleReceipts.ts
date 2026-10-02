import { MedicalClaimRecord } from '../types/claim';

export interface SampleReceiptTemplate {
  title: string;
  clinic: string;
  address: string;
  phone: string;
  employee: string;
  patientId: string;
  date: string;
  invoiceNo: string;
  items: { description: string; amount: number }[];
  gstRate: number; // e.g. 0.09 for 9% GST
  illness: string;
}

export const SAMPLE_RECEIPT_TEMPLATES: SampleReceiptTemplate[] = [
  {
    title: 'Raffles Medical Group',
    clinic: 'Raffles Medical Clinic (Marina Bay)',
    address: '10 Collyer Quay, #02-01 Ocean Financial Centre',
    phone: '+65 6538 8833',
    employee: 'Alexander Tan Wei Ming',
    patientId: 'S8912345D',
    date: '2026-09-28',
    invoiceNo: 'RMG-2026-88192',
    items: [
      { description: 'Outpatient GP Consultation (Standard)', amount: 48.00 },
      { description: 'Amoxicillin 500mg Caps (14 caps)', amount: 24.50 },
      { description: 'Leftose / Cough Lozenges & Syrup', amount: 16.00 },
    ],
    gstRate: 0.09,
    illness: 'Acute Upper Respiratory Tract Infection (URTI) with Fever',
  },
  {
    title: 'Healthway Dental Specialists',
    clinic: 'Healthway Dental Surgery',
    address: '176 Orchard Road, #03-24 The Centrepoint',
    phone: '+65 6733 9922',
    employee: 'Sarah Jenkins',
    patientId: 'G1298451X',
    date: '2026-09-24',
    invoiceNo: 'HW-DENT-90412',
    items: [
      { description: 'Dental Oral Examination & Consultation', amount: 45.00 },
      { description: 'Full Mouth Scaling & Polishing', amount: 95.00 },
      { description: 'Topical Fluoride Therapy', amount: 30.00 },
    ],
    gstRate: 0.09,
    illness: 'Routine Dental Scaling and Gingivitis Treatment',
  },
  {
    title: 'Novena Skin & Allergy Clinic',
    clinic: 'Novena Dermatology & Allergy Centre',
    address: '38 Irrawaddy Road, #08-11 Mount Elizabeth Novena',
    phone: '+65 6397 2200',
    employee: 'Muhammad Farhan Bin Rahman',
    patientId: 'S9423812K',
    date: '2026-09-18',
    invoiceNo: 'NSAC-INV-44129',
    items: [
      { description: 'Specialist Dermatology Review', amount: 140.00 },
      { description: 'Desonide Cream 0.05% 30g', amount: 38.00 },
      { description: 'Cetirizine 10mg Tablets (30 tabs)', amount: 22.00 },
    ],
    gstRate: 0.09,
    illness: 'Acute Contact Dermatitis & Urticaria (Skin Allergy)',
  },
  {
    title: 'Parkway Shenton Medical',
    clinic: 'Parkway Shenton Clinic (Raffles Place)',
    address: '6 Battery Road, #01-08',
    phone: '+65 6223 5511',
    employee: 'Chloe Lim Shu Qi',
    patientId: 'S9618293B',
    date: '2026-09-12',
    invoiceNo: 'PS-MED-77144',
    items: [
      { description: 'Emergency Evening Consultation', amount: 65.00 },
      { description: 'Hyoscine Butylbromide (Buscopan) 10mg', amount: 18.00 },
      { description: 'Omeprazole 20mg & Oral Rehydration Salts', amount: 26.50 },
    ],
    gstRate: 0.09,
    illness: 'Acute Gastroenteritis & Abdominal Cramps',
  },
];

/**
 * Renders a crisp, realistic thermal paper / clinic receipt onto an HTML canvas and returns a JPEG data URL.
 */
export function generateReceiptImage(template: SampleReceiptTemplate): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 680;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Receipt Paper Background (light warm off-white paper texture)
    ctx.fillStyle = '#fbfbfa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper edge border
    ctx.strokeStyle = '#e2e2dd';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Top Header
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';

    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(template.title.toUpperCase(), canvas.width / 2, 55);

    ctx.font = 'normal 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(template.address, canvas.width / 2, 80);
    ctx.fillText(`Tel: ${template.phone}  |  GST Reg No: M9-0018241-K`, canvas.width / 2, 100);

    // Dashed divider
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(35, 120);
    ctx.lineTo(canvas.width - 35, 120);
    ctx.stroke();
    ctx.setLineDash([]);

    // Receipt Meta Details
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('OFFICIAL TAX INVOICE & RECEIPT', 35, 145);

    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#334155';

    ctx.fillText(`Date: ${template.date}`, 35, 172);
    ctx.fillText(`Tax Invoice No: ${template.invoiceNo}`, 35, 192);

    ctx.fillText(`Employee / Patient Name:`, 35, 222);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(template.employee, 215, 222);

    ctx.fillStyle = '#334155';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Patient ID: ${template.patientId}`, 35, 244);
    ctx.fillText(`Attending Clinic: ${template.clinic}`, 35, 266);

    // Clinical illness summary / Diagnosis
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(35, 282, canvas.width - 70, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`CLINICAL REASON / DIAGNOSIS:`, 45, 302);
    ctx.font = 'normal 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(template.illness, 250, 302);

    // Table Header
    let y = 345;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(35, y - 20, canvas.width - 70, 26);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('ITEM / SERVICE DESCRIPTION', 45, y - 3);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT (SGD)', canvas.width - 45, y - 3);

    // Items
    ctx.textAlign = 'left';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#1e293b';

    let subTotal = 0;
    template.items.forEach((item) => {
      y += 32;
      ctx.textAlign = 'left';
      ctx.fillText(item.description, 45, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.amount.toFixed(2), canvas.width - 45, y);
      subTotal += item.amount;
    });

    const gstAmount = Number((subTotal * template.gstRate).toFixed(2));
    const grandTotal = Number((subTotal + gstAmount).toFixed(2));

    // Summary calculations box
    y += 40;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(canvas.width - 35, y);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 30;
    ctx.textAlign = 'right';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Sub-Total:', canvas.width - 150, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`$${subTotal.toFixed(2)}`, canvas.width - 45, y);

    y += 26;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`GST (${(template.gstRate * 100).toFixed(0)}%):`, canvas.width - 150, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`$${gstAmount.toFixed(2)}`, canvas.width - 45, y);

    y += 32;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(canvas.width - 300, y - 22, 265, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Grand Total:', canvas.width - 150, y);
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText(`$${grandTotal.toFixed(2)}`, canvas.width - 45, y);

    // Payment method footer
    y += 65;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Payment Method: Corporate Insurance / NETS Direct', 45, y);
    ctx.fillText('Status: PAID IN FULL', 45, y + 18);

    // Barcode dummy
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`* ${template.invoiceNo} *`, canvas.width / 2, canvas.height - 45);
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Thank you for choosing our clinic. Keep this receipt for corporate tax and insurance claims.', canvas.width / 2, canvas.height - 25);

    resolve(canvas.toDataURL('image/jpeg', 0.92));
  });
}

/**
 * Pre-constructed default records to allow immediate zero-friction exploration
 */
export function getDefaultSampleRecords(): MedicalClaimRecord[] {
  return [
    {
      id: 'claim-sample-1',
      employeeName: 'Alexander Tan Wei Ming',
      clinicName: 'Raffles Medical Clinic (Marina Bay)',
      subTotal: 88.50,
      gst: 7.97,
      grandTotal: 96.47,
      summaryOfIllness: 'Acute Upper Respiratory Tract Infection (URTI) with Fever',
      receiptDate: '2026-09-28',
      receiptNumber: 'RMG-2026-88192',
      currency: 'SGD',
      lineItems: ['Outpatient GP Consultation', 'Amoxicillin 500mg (14 caps)', 'Leftose Cough Lozenges & Syrup'],
      isVerified: true,
      createdAt: '2026-09-28T10:15:00Z',
    },
    {
      id: 'claim-sample-2',
      employeeName: 'Sarah Jenkins',
      clinicName: 'Healthway Dental Surgery',
      subTotal: 170.00,
      gst: 15.30,
      grandTotal: 185.30,
      summaryOfIllness: 'Routine Dental Scaling and Gingivitis Treatment',
      receiptDate: '2026-09-24',
      receiptNumber: 'HW-DENT-90412',
      currency: 'SGD',
      lineItems: ['Oral Consultation', 'Scaling & Polishing', 'Topical Fluoride Therapy'],
      isVerified: true,
      createdAt: '2026-09-24T14:30:00Z',
    },
    {
      id: 'claim-sample-3',
      employeeName: 'Muhammad Farhan Bin Rahman',
      clinicName: 'Novena Dermatology & Allergy Centre',
      subTotal: 200.00,
      gst: 18.00,
      grandTotal: 218.00,
      summaryOfIllness: 'Acute Contact Dermatitis & Urticaria (Skin Allergy)',
      receiptDate: '2026-09-18',
      receiptNumber: 'NSAC-INV-44129',
      currency: 'SGD',
      lineItems: ['Specialist Dermatology Review', 'Desonide Cream 0.05%', 'Cetirizine 10mg Tablets'],
      isVerified: true,
      createdAt: '2026-09-18T16:45:00Z',
    },
  ];
}
