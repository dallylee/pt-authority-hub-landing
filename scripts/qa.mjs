import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const indexAstroPath = path.join(projectRoot, 'src/pages/index.astro');
const quizWizardPath = path.join(projectRoot, 'src/components/QuizWizard.astro');
const whatYouGetPath = path.join(projectRoot, 'src/components/WhatYouGet.astro');
const distQuizPath = path.join(projectRoot, 'dist/quiz/index.html');
const distIndexPath = path.join(projectRoot, 'dist/index.html');

const checks = [
    // M12: Hard ban on Tally Quiz (OD4eKp)
    {
        name: "M12: OD4eKp NOT in src/",
        check: () => {
            try {
                const result = execSync('findstr /s /i "OD4eKp" src\\*.astro src\\*.ts src\\*.json 2>nul', { encoding: 'utf-8' });
                return result.trim() === '';
            } catch (e) {
                // findstr returns 1 when no matches found
                return true;
            }
        }
    },
    {
        name: "M12: OD4eKp NOT in functions/",
        check: () => {
            try {
                const result = execSync('findstr /s /i "OD4eKp" functions\\*.ts 2>nul', { encoding: 'utf-8' });
                return result.trim() === '';
            } catch (e) {
                return true;
            }
        }
    },
    {
        name: "M12: PUBLIC_TALLY_QUIZ_FORM_ID NOT in src/",
        check: () => {
            try {
                const result = execSync('findstr /s /i "PUBLIC_TALLY_QUIZ_FORM_ID" src\\*.astro 2>nul', { encoding: 'utf-8' });
                return result.trim() === '';
            } catch (e) {
                return true;
            }
        }
    },

    // M12: Quiz page uses native QuizWizard
    {
        name: "M12: quiz.astro imports QuizWizard",
        check: () => {
            const content = fs.readFileSync(path.join(projectRoot, 'src/pages/quiz.astro'), 'utf-8');
            return content.includes("import QuizWizard from") && content.includes("<QuizWizard");
        }
    },

    // M12: CTAs point to /quiz
    {
        name: "M12: Homepage CTAs use href=/quiz",
        check: () => {
            const content = fs.readFileSync(indexAstroPath, 'utf-8');
            const matches = content.match(/href="\/quiz"/g);
            return matches && matches.length >= 3;
        }
    },
    {
        name: "M12: WhatYouGet CTA uses href=/quiz",
        check: () => {
            const content = fs.readFileSync(whatYouGetPath, 'utf-8');
            return content.includes('href="/quiz"');
        }
    },

    // M12: QuizWizard has required questions
    {
        name: "M12: QuizWizard has budget question",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('What is your monthly budget for personal training?');
        }
    },
    {
        name: "M12: QuizWizard has upload choice question",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('Optional: do you want to upload your 30-day summary');
        }
    },

    // M12: Tally upload pbyXyJ only
    {
        name: "M12: QuizWizard references pbyXyJ (upload only)",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('pbyXyJ');
        }
    },
    {
        name: "M12: QuizWizard has data-upload-panel marker",
        check: () => {
            const content = fs.readFileSync(quizWizardPath, 'utf-8');
            return content.includes('data-upload-panel="1"');
        }
    },

    // M12: dist checks
    {
        name: "M12: dist/quiz/index.html exists",
        check: () => fs.existsSync(distQuizPath)
    },
    {
        name: "M12: OD4eKp NOT in dist/",
        check: () => {
            try {
                const result = execSync('findstr /s /i "OD4eKp" dist\\*.html 2>nul', { encoding: 'utf-8' });
                return result.trim() === '';
            } catch (e) {
                return true;
            }
        }
    }
];

let failed = 0;
console.log("Starting QA Checks (M12 Native Quiz Restore)...\n");
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
