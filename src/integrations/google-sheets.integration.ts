import { google, sheets_v4 } from 'googleapis';
import { logger } from '../lib';
import fs from 'fs';

interface PaymentRow {
  date: string;
  childName: string;
  amount: number;
  paymentMethod: string;
  balance: number;
}

export class GoogleSheetsIntegration {
  private sheets: sheets_v4.Sheets | null = null;

  constructor(
    private readonly credentialsPath: string,
    private readonly spreadsheetId: string,
  ) {}

  private async getClient(): Promise<sheets_v4.Sheets> {
    if (this.sheets) return this.sheets;

    if (!fs.existsSync(this.credentialsPath)) {
      throw new Error(`Google credentials file not found: ${this.credentialsPath}`);
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: this.credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    return this.sheets;
  }

  async appendPaymentRow(row: PaymentRow): Promise<void> {
    try {
      const client = await this.getClient();
      await client.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Payments!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[row.date, row.childName, row.amount, row.paymentMethod, row.balance]],
        },
      });
      logger.debug('Row appended to Google Sheets');
    } catch (error) {
      logger.error('Google Sheets append failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async ensureSheetExists(): Promise<void> {
    try {
      const client = await this.getClient();
      const response = await client.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const hasPaymentsSheet = response.data.sheets?.some(
        (s) => s.properties?.title === 'Payments',
      );

      if (!hasPaymentsSheet) {
        await client.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: 'Payments' },
                },
              },
            ],
          },
        });

        await client.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Payments!A1:E1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Date', 'Child Name', 'Amount', 'Payment Method', 'Balance']],
          },
        });
      }
    } catch (error) {
      logger.error('Failed to ensure sheet exists', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
