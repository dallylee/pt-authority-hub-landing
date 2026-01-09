import fs from 'fs';

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

console.log('Checking built routes...');
assert(fs.existsSync('dist/quiz/index.html'), 'Missing dist/quiz/index.html');
assert(fs.existsSync('dist/upload/index.html'), 'Missing dist/upload/index.html');

console.log('Checking Funnel Wiring (IDs and CTAs)...');
assert(indexContent.includes('href="/quiz"'), 'Missing link to /quiz');
assert(indexContent.includes('href="/upload"'), 'Missing link to /upload');

console.log('Checking Tally iframe src URLs...');
const uploadContent = fs.readFileSync('dist/upload/index.html', 'utf-8');
assert(uploadContent.includes('https://tally.so/embed/pbyXyJ'), 'Missing Stats iframe src in upload page');
assert(!indexContent.includes('tally.so/embed/OD4eKp'), 'Quiz iframe should not be on homepage');

console.log('Checking Section Presence (Repair Pack B, C & D)...');
assert(indexContent.toLowerCase().includes('how it works'), 'Missing "How it works" section');
assert(indexContent.toLowerCase().includes('the methodology'), 'Missing "The Why" methodology section');
assert(indexContent.toLowerCase().includes('trusted by professionals from'), 'Missing "Trusted By" / logos section');
assert(indexContent.toLowerCase().includes('transformations'), 'Missing "Transformations" section');
assert(indexContent.toLowerCase().includes('common performance problems we solve'), 'Missing "Common Performance Problems We Solve" section');

console.log('Checking Trust Automation UI Hooks (Repair Pack D)...');
assert(indexContent.includes('id="google-reviews-card"'), 'Missing id="google-reviews-card"');
assert(indexContent.includes('id="google-reviews-meta"'), 'Missing id="google-reviews-meta"');
assert(indexContent.includes('id="spots-count"'), 'Missing id="spots-count"');
assert(indexContent.includes('id="spots-updated"'), 'Missing id="spots-updated"');

console.log('Checking Endpoint References...');
assert(indexContent.includes('/api/reviews'), 'Missing reference to /api/reviews');
assert(indexContent.includes('/api/spots'), 'Missing reference to /api/spots');
assert(!indexContent.includes('/spots.json'), 'Still referencing legacy /spots.json');

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
