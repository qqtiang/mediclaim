export interface MedicalClaimRecord {
  id: string;
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  summaryOfIllness: string;
  receiptDate: string;
  receiptNumber: string;
  currency: string;
  lineItems?: string[];
  imagePreviewUrl?: string;
  filename?: string;
  isVerified?: boolean;
  createdAt: string;
}

export interface ProcessingItem {
  id: string;
  filename: string;
  fileSize: number;
  previewUrl: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  progressMessage?: string;
  errorMessage?: string;
}
