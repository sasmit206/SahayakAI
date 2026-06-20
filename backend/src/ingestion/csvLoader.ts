import fs from 'fs';
import csvParser from 'csv-parser';
import { normalizeRow, SchemeDocument } from './normalizer';

export function loadSchemes(csvPath: string): Promise<SchemeDocument[]> {
  return new Promise((resolve, reject) => {
    const results: SchemeDocument[] = [];
    let index = 0;

    if (!fs.existsSync(csvPath)) {
      return reject(new Error(`CSV file not found at path: ${csvPath}`));
    }

    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (data) => {
        try {
          const doc = normalizeRow(data, index);
          results.push(doc);
          index++;
        } catch (err) {
          console.warn(`Error processing CSV row index ${index}:`, err);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
