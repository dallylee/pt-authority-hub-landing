import fs from 'fs';
import path from 'path';

const INDEX_PATH = 'dist/index.html';
const PRIVACY_PATH = 'dist/privacy/index.html';
const TERMS_PATH = 'dist/terms/index.html';
const DATA_PATH = 'src/data/offer.json';

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('--- PT Authority Hub: Comprehensive QA (Pack C) ---');

// 1. Check data files
console.log('Checking offer.json...');
const offerData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
assert(offerData.tiers.some(t => t.price === '£0'), 'Missing £0 tier in offer.json');

// 2. Check built index.html
if (!fs.existsSync(INDEX_PATH)) {
    console.error(`FAIL: ${INDEX_PATH} not found. Did you run npm run build?`);
    process.exit(1);
}
const indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');

console.log('Checking Funnel Wiring (IDs and CTAs)...');
assert(indexContent.includes('id="quiz"'), 'Missing id="quiz"');
assert(indexContent.includes('id="stats"'), 'Missing id="stats"');
assert(indexContent.includes('href="#quiz"'), 'Missing link to #quiz');
assert(indexContent.includes('href="#stats"'), 'Missing link to #stats');

console.log('Checking Section Presence (Repair Pack B & C)...');
assert(indexContent.toLowerCase().includes('how it works'), 'Missing "How it works" section');
assert(indexContent.toLowerCase().includes('the methodology'), 'Missing "The Why" methodology section');
assert(indexContent.toLowerCase().includes('trusted by professionals from'), 'Missing "Trusted By" / logos section');
assert(indexContent.toLowerCase().includes('transformations'), 'Missing "Transformations" section');
assert(indexContent.toLowerCase().includes('common performance problems we solve'), 'Missing "Common Performance Problems We Solve" section');

console.log('Checking FAQ Content...');
assert(indexContent.includes('Do I need to live in London?'), 'FAQ: Missing London question');
assert(indexContent.includes('Do I need fancy equipment?'), 'FAQ: Missing equipment question');
assert(indexContent.includes('Can I cancel anytime?'), 'FAQ: Missing cancel question');

console.log('Checking Legal Page Links...');
assert(indexContent.includes('href="/privacy"'), 'Missing link to /privacy');
assert(indexContent.includes('href="/terms"'), 'Missing link to /terms');

console.log('Checking Built Legal Pages...');
assert(fs.existsSync(PRIVACY_PATH), 'Missing dist/privacy/index.html');
assert(fs.existsSync(TERMS_PATH), 'Missing dist/terms/index.html');

console.log('Checking Language Simplification & Banned Phrases...');
const bannedPhrases = [
    'OFFLINE',
    'BOOKING INTAKE',
    'QUALIFICATION PROTOCOL',
    'Next Phase Architecture',
    'Clinical Resolution',
    'Deterministic 30-day roadmap'
];
bannedPhrases.forEach(phrase => {
    assert(!indexContent.includes(phrase), `Banned phrase "${phrase}" found in ${INDEX_PATH}`);
});
assert(!indexContent.includes('38 days'), `Found "38 days" in ${INDEX_PATH}`);

console.log('--- PASS: All Repair Pack C QA checks passed ---');
