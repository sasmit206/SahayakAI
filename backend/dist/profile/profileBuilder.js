"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialProfile = createInitialProfile;
exports.mergeProfile = mergeProfile;
const profileExtractor_1 = require("./profileExtractor");
function createInitialProfile() {
    return { ...profileExtractor_1.INITIAL_PROFILE };
}
function mergeProfile(current, updates) {
    const merged = { ...current };
    for (const key in updates) {
        const field = key;
        if (updates[field] !== undefined && updates[field] !== null) {
            // TypeScript type asserting for assignment
            merged[field] = updates[field];
        }
    }
    return merged;
}
