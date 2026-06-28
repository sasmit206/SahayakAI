import fs from 'fs';
import { RawSchemeFields } from './pdfFieldExtractor';

/**
 * Appends a new scheme row to the master CSV (updated_data.csv) using the
 * exact same column order as the existing file's header, so `csvLoader.ts`
 * picks it up automatically on the next server start / re-ingestion run —
 * no changes needed to the existing CSV-loading code.
 */
export function appendSchemeToCsv(csvPath: string, fields: RawSchemeFields): void {
  const header = readHeader(csvPath);
  const row = header.map((col) => escapeCsvValue((fields as any)[col] ?? ''));
  const line = row.join(',') + '\n';
  fs.appendFileSync(csvPath, line, 'utf-8');
}

function readHeader(csvPath: string): string[] {
  const fd = fs.openSync(csvPath, 'r');
  const buf = Buffer.alloc(8192);
  const bytesRead = fs.readSync(fd, buf, 0, 8192, 0);
  fs.closeSync(fd);
  const firstLine = buf.slice(0, bytesRead).toString('utf-8').split('\n')[0];
  return firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
}

function escapeCsvValue(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
