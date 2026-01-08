import fs from 'fs';
import path from 'path';

const INDEX_PATH = 'dist/index.html';
const DATA_PATH = 'src/data/offer.json';

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
}

console.log('--- Phase 6: Automated QA ---');

// 1. Check offer.json
console.log('Checking offer.json...');
const offerData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
assert(offerData.tiers.some(t => t.price === '£0'), 'Missing £0 tier in offer.json');

// 2. Check built index.html content
console.log(`Checking ${INDEX_PATH} content...`);
const indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');

console.log('Checking IDs and CTAs...');
assert(indexContent.includes('id="quiz"'), 'Missing id="quiz"');
assert(indexContent.includes('id="stats"'), 'Missing id="stats"');
assert(indexContent.includes('href="#quiz"'), 'Missing link to #quiz');
assert(indexContent.includes('href="#stats"'), 'Missing link to #stats');

console.log('Checking Banned Phrases...');
const bannedPhrases = [
    'OFFLINE',
    'BOOKING INTAKE',
    'QUALIFICATION PROTOCOL',
    'Next Phase Architecture'
];

bannedPhrases.forEach(phrase => {
    assert(!indexContent.includes(phrase), `Banned phrase "${phrase}" found in ${INDEX_PATH}`);
});

console.log('Checking Timeline Consistency...');
assert(!indexContent.includes('38 days'), `Found "38 days" in ${INDEX_PATH}`);

console.log('Checking Pricing Section...');
assert(indexContent.includes('id="pricing"'), 'Missing Pricing section ID');
assert(indexContent.includes('£0'), 'Missing free tier price (£0) in rendered HTML');

console.log('Checking Tally IDs...');
assert(indexContent.includes('OD4eKp'), 'Missing live quiz Tally ID OD4eKp');
assert(indexContent.includes('pbyXyJ'), 'Missing live stats Tally ID pbyXyJ');

console.log('--- PASS: All internal QA checks passed ---');
