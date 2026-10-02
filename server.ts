import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Handle large base64 receipt uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialized GenAI client
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// Receipt OCR extraction endpoint
app.post('/api/extract-receipt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', filename } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'No image data provided.' });
      return;
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const ai = getGenAI();

    const promptText = `You are a certified corporate medical claims OCR auditing specialist.
Analyze this medical invoice, clinic receipt, or doctor consultation bill with extreme precision.
Carefully extract and calculate:
1. Name of Employee / Patient: Look for "Patient Name", "Name", "Attending to", "Bill to", "Employee". If only a first name or patient identifier is present, extract it. If not found at all, return "Not Specified".
2. Clinic Name: Official name of the medical clinic, health center, specialist practice, dental clinic, or hospital (e.g. "Raffles Medical Clinic", "Healthway Medical", "Family Medicine Clinic").
3. Sub-Total: Total cost before GST/VAT/Sales Tax, or after itemized deductions. If only Grand Total and GST are provided, calculate Sub-Total = Grand Total - GST. Return as a positive numerical number (e.g. 55.00).
4. GST: Goods & Services Tax (or VAT / Sales Tax) amount. If explicitly zero or exempt, return 0.00. Return as a numerical number (e.g. 4.95).
5. Grand Total: The final payable amount or total paid by the employee. Return as a numerical number (e.g. 59.95).
6. Summary of illness: Diagnosis, symptoms, clinical reason, consultation reason, condition, or indication of prescribed medication (e.g., "Acute Upper Respiratory Tract Infection (URTI) with Fever", "Acute Gastroenteritis & Dehydration", "Dental Extraction and Scaling", "Hypertension & Hyperlipidemia Routine Review", "Contact Dermatitis"). If no formal diagnosis is written, summarize the clinical items, treatments, or symptoms described on the bill.

Also extract the receipt date, invoice/receipt number, and currency code if discernible.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction:
          'You are an expert medical receipt and invoice parser. Extract accurate medical claim data without hallucination. Format output strictly as JSON adhering to the provided schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            employeeName: {
              type: Type.STRING,
              description: 'Name of the employee or patient',
            },
            clinicName: {
              type: Type.STRING,
              description: 'Name of the clinic or medical institution',
            },
            subTotal: {
              type: Type.NUMBER,
              description: 'Sub-Total amount before GST/tax',
            },
            gst: {
              type: Type.NUMBER,
              description: 'GST / VAT / Sales Tax amount',
            },
            grandTotal: {
              type: Type.NUMBER,
              description: 'Grand Total amount',
            },
            summaryOfIllness: {
              type: Type.STRING,
              description: 'Summary of illness, diagnosis, or clinical reason for visit',
            },
            receiptDate: {
              type: Type.STRING,
              description: 'Date on the receipt (YYYY-MM-DD or as recorded)',
            },
            receiptNumber: {
              type: Type.STRING,
              description: 'Invoice or receipt number if available',
            },
            currency: {
              type: Type.STRING,
              description: 'Currency code or symbol (e.g. SGD, USD, RM, etc.)',
            },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Itemized medical services or prescriptions listed on the receipt',
            },
          },
          required: [
            'employeeName',
            'clinicName',
            'subTotal',
            'gst',
            'grandTotal',
            'summaryOfIllness',
          ],
        },
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      parsedData = {
        employeeName: 'Unknown Employee',
        clinicName: 'Medical Clinic',
        subTotal: 0,
        gst: 0,
        grandTotal: 0,
        summaryOfIllness: 'General Medical Consultation',
      };
    }

    // Sanitize and ensure numeric numbers
    const subTotalNum = Number(parsedData.subTotal) || 0;
    const gstNum = Number(parsedData.gst) || 0;
    let grandTotalNum = Number(parsedData.grandTotal) || 0;

    // Safety fallback for totals if grandTotal is 0 but subtotal is present
    if (grandTotalNum === 0 && subTotalNum > 0) {
      grandTotalNum = Number((subTotalNum + gstNum).toFixed(2));
    }

    res.json({
      success: true,
      data: {
        employeeName: (parsedData.employeeName || 'Not Specified').trim(),
        clinicName: (parsedData.clinicName || 'Clinic / Practice').trim(),
        subTotal: Number(subTotalNum.toFixed(2)),
        gst: Number(gstNum.toFixed(2)),
        grandTotal: Number(grandTotalNum.toFixed(2)),
        summaryOfIllness: (parsedData.summaryOfIllness || 'Outpatient Consultation').trim(),
        receiptDate: parsedData.receiptDate || new Date().toISOString().split('T')[0],
        receiptNumber: parsedData.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        currency: parsedData.currency || 'SGD',
        lineItems: Array.isArray(parsedData.lineItems) ? parsedData.lineItems : [],
        filename: filename || 'receipt.jpg',
      },
    });
  } catch (error: any) {
    console.error('Error during receipt OCR extraction:', error);
    res.status(500).json({
      error: error?.message || 'Failed to extract information from receipt.',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (devMode: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
