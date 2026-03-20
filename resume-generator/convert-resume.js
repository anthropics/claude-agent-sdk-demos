import mammoth from 'mammoth';
import fs from 'fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'agent/custom_scripts/original_resume.md';

if (!inputPath) {
  console.error('Usage: node convert-resume.js <input.docx> [output.md]');
  process.exit(1);
}

mammoth.extractRawText({ path: inputPath })
  .then(result => {
    fs.mkdirSync('agent/custom_scripts', { recursive: true });
    fs.writeFileSync(outputPath, result.value);
    console.log(`Converted ${inputPath} to ${outputPath}`);
  })
  .catch(err => {
    console.error('Conversion error:', err);
    process.exit(1);
  });
