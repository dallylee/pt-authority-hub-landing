import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const indexAstroPath = path.join(projectRoot, 'src/pages/index.astro');
const offerJsonPath = path.join(projectRoot, 'src/data/offer.json');
const whatYouGetPath = path.join(projectRoot, 'src/components/WhatYouGet.astro');
const quizWizardPath = path.join(projectRoot, 'src/components/QuizWizard.astro');

// Check if dist exists
const distQuizPath = path.join(projectRoot, 'dist/quiz/index.html');

const checks = [
    // M11 Brief checks (retained)
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
        name: "Copy: Spots remaining section removed",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            return !content.includes('id="spots-remaining"');
        }
    },

    // V1 Quiz Realignment checks
    {
        name: "V1: Homepage CTA 1 (Hero) has href=/quiz",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            // Line 67: href="/quiz" ... Start Free Audit
            return content.includes('href="/quiz"') && content.includes('Start Free Audit');
        }
    },
    {
        name: "V1: Homepage CTA 2 (Quiz Section) has href=/quiz",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            const matches = content.match(/href="\/quiz"/g);
            return matches && matches.length >= 2;
        }
    },
    {
        name: "V1: WhatYouGet CTA has href=/quiz",
        check: () => {
            const content = fs.readFileSync(whatYouGetPath, 'utf-8');
            return content.includes('href="/quiz"') && content.includes('Start Free Audit');
        }
    },
    {
        name: "V1: Pricing CTAs use href=/quiz",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            // Pricing section uses tier.cta which is "Start Free Audit" and href="/quiz"
            return content.includes('href="/quiz"') && content.includes('tier.cta');
        }
    },
    {
        name: "V1: dist/quiz/index.html exists",
        check: () => {
            return fs.existsSync(distQuizPath);
        }
    },
    {
        name: "V1: QuizWizard has budget question",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('monthly_budget') && content.includes('Under £150');
        }
    },
    {
        name: "V1: QuizWizard has upload choice question",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('wants_stats_upload') &&
                content.includes('Yes, I will upload my stats (recommended)') &&
                content.includes('No, just use my answers');
        }
    },
    {
        name: "V1: QuizWizard has data-upload-panel marker",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('data-upload-panel="1"');
        }
    },
    {
        name: "V1: QuizWizard references Tally embed pbyXyJ",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('pbyXyJ');
        }
    },
    {
        name: "V1: QuizWizard has email prefill in Tally URL",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('email=${email}') || content.includes('&email=');
        }
    }
];

let failed = 0;
console.log("Starting QA Checks (V1 Quiz Realignment)...\n");
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
