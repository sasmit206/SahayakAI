"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchemes = loadSchemes;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const normalizer_1 = require("./normalizer");
function loadSchemes(csvPath) {
    return new Promise((resolve, reject) => {
        const results = [];
        let index = 0;
        if (!fs_1.default.existsSync(csvPath)) {
            return reject(new Error(`CSV file not found at path: ${csvPath}`));
        }
        fs_1.default.createReadStream(csvPath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => {
            try {
                const doc = (0, normalizer_1.normalizeRow)(data, index);
                results.push(doc);
                index++;
            }
            catch (err) {
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
