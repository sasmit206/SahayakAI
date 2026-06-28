"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BM25Retriever = void 0;
const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
    'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
    'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
    'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
    'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
    'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
    'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
    'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
    'your', 'yours', 'yourself', 'yourselves'
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 1 && !STOPWORDS.has(token));
}
class BM25Retriever {
    documents = [];
    k1;
    b;
    avgDocLength = 0;
    docLengths = [];
    docTermFreqs = [];
    docCount = 0;
    idfs = new Map();
    constructor(documents, k1 = 1.5, b = 0.75) {
        this.documents = documents;
        this.k1 = k1;
        this.b = b;
        this.docCount = documents.length;
        if (this.docCount === 0)
            return;
        let totalLength = 0;
        for (const doc of documents) {
            const tokens = tokenize(doc.searchText);
            const length = tokens.length;
            this.docLengths.push(length);
            totalLength += length;
            const termFreqs = new Map();
            for (const token of tokens) {
                termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
            }
            this.docTermFreqs.push(termFreqs);
        }
        this.avgDocLength = totalLength / this.docCount;
        // Calculate IDFs
        const docFreqs = new Map();
        for (const termFreqs of this.docTermFreqs) {
            for (const term of termFreqs.keys()) {
                docFreqs.set(term, (docFreqs.get(term) || 0) + 1);
            }
        }
        for (const [term, freq] of docFreqs.entries()) {
            // BM25 standard IDF with smoothing
            const idf = Math.log((this.docCount - freq + 0.5) / (freq + 0.5) + 1);
            this.idfs.set(term, idf);
        }
    }
    search(query, limit = 30) {
        const queryTokens = tokenize(query);
        if (queryTokens.length === 0 || this.docCount === 0) {
            return this.documents.slice(0, limit).map(doc => ({ doc, score: 0 }));
        }
        const scores = [];
        for (let i = 0; i < this.docCount; i++) {
            let score = 0;
            const termFreqs = this.docTermFreqs[i];
            const docLen = this.docLengths[i];
            for (const token of queryTokens) {
                const tf = termFreqs.get(token) || 0;
                if (tf > 0) {
                    const idf = this.idfs.get(token) || 0;
                    // BM25 scoring formula
                    const numerator = tf * (this.k1 + 1);
                    const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
                    score += idf * (numerator / denominator);
                }
            }
            if (score > 0) {
                scores.push({ index: i, score });
            }
        }
        // Sort descending by score
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, limit).map(s => ({
            doc: this.documents[s.index],
            score: s.score
        }));
    }
}
exports.BM25Retriever = BM25Retriever;
exports.default = BM25Retriever;
