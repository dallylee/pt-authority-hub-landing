import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const indexAstroPath = path.join(projectRoot, 'src/pages/index.astro');
const offerJsonPath = path.join(projectRoot, 'src/data/offer.json');

const checks = [
    {
        name: "Hero: Dashboard Mock removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return !content.includes('See your progress in real numbers');
        }
    },
    {
        name: "Hero: Coach Identity present",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return content.includes('CoachIdentity');
        }
    },
    {
        name: "CTA: Label Consistency",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            const offer = fs.readFileSync(offerJsonPath, 'utf-8');
            // "Start Free Audit" should be the primary CTA.
            // We check if "Start the 2-Minute Audit" (old variant) is gone.
            return !content.includes('Start the 2-Minute Audit') &&
                offer.includes('Start Free Audit');
        }
    },
    {
        name: "Copy: Sync language removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return !content.includes('Sync your 30-day training data');
        }
    },
    {
        name: "Copy: Bank-level encryption removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return !content.includes('bank-level encryption');
        }
    },
    {
        name: "Copy: Clinical review removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            const offer = fs.readFileSync(offerJsonPath, 'utf-8');
            return !content.includes('Prices subject to clinical review') &&
                !offer.includes('Prices subject to clinical review');
        }
    },
    {
        name: "Copy: Slack monitoring removed",
        check: () => {
            const offer = fs.readFileSync(offerJsonPath, 'utf-8');
            return !offer.includes('Slack signal monitoring');
        }
    },
    {
        name: "Copy: Spots remaining section removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return !content.includes('id="spots-remaining"');
        }
    }
];

let failed = 0;
console.log("Starting QA Checks...");
checks.forEach(c => {
    try {
        const passed = c.check();
        if (passed) {
            console.log(`[PASS] ${c.name}`);
        } else {
            console.log(`[FAIL] ${c.name}`);
            failed++;
        }
    } catch (e) {
        console.log(`[ERROR] ${c.name}: ${e.message}`);
        failed++;
    }
});

if (failed > 0) {
    console.log(`\nQA FAILED: ${failed} checks failed.`);
    process.exit(1);
} else {
    console.log("\nQA PASSED: All checks passed.");
    process.exit(0);
}
