import { HtmlValidate, formatterFactory } from 'html-validate';
import { glob } from 'glob';
import plugin from './plugin.html-validate.mjs';

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync('build/**/*.html').sort();

// Initialize HtmlValidate instance
const htmlValidate = new HtmlValidate({
  extends: ['html-validate:prettier'],
  plugins: [plugin],
  rules: {
    'mailto-awesome': 'error',
    'external-links': 'error',
    'no-jquery': 'error',
    'canonical-link': 'error',
    'latest-packages': 'error',
    'https-links': 'error',
    'internal-links': 'error',
  },
});

const formatter = formatterFactory('stylish');
let allTestsPassed = true;

// Validate each target file
for (const target of targets) {
  try {
    const report = await htmlValidate.validateFile(target);
    if (!report.valid) {
      console.log(formatter(report.results));
      allTestsPassed = false;
    } else {
      console.log(`✅ ${target}`);
    }
  } catch (error) {
    console.error(`Error validating ${target}:`, error);
    allTestsPassed = false;
  }
}

if (allTestsPassed) {
  console.log('✨✨ All tests passed! ✨✨');
} else {
  process.exit(1);
}
