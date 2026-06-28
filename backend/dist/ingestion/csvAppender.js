"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendSchemeToCsv = appendSchemeToCsv;
const fs_1 = __importDefault(require("fs"));
/**
 * Appends a new scheme row to the master CSV (updated_data.csv) using the
 * exact same column order as the existing file's header, so `csvLoader.ts`
 * picks it up automatically on the next server start / re-ingestion run —
 * no changes needed to the existing CSV-loading code.
 */
function appendSchemeToCsv(csvPath, fields) {
    const header = readHeader(csvPath);
    const row = header.map((col) => escapeCsvValue(fields[col] ?? ''));
    const line = row.join(',') + '\n';
    fs_1.default.appendFileSync(csvPath, line, 'utf-8');
}
function readHeader(csvPath) {
    const fd = fs_1.default.openSync(csvPath, 'r');
    const buf = Buffer.alloc(8192);
    const bytesRead = fs_1.default.readSync(fd, buf, 0, 8192, 0);
    fs_1.default.closeSync(fd);
    const firstLine = buf.slice(0, bytesRead).toString('utf-8').split('\n')[0];
    return firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
}
function escapeCsvValue(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
