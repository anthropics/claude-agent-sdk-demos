# PDF Processing Advanced Reference

This document contains advanced PDF processing features, detailed examples, and additional libraries not covered in the main skill instructions.

## pypdfium2 Library (Apache/BSD License)

### Overview
pypdfium2 is a Python binding for PDFium (Chromium's PDF library). It's excellent for fast PDF rendering, image generation, and serves as a PyMuPDF replacement.

### Render PDF to Images
```python
import pypdfium2 as pdfium
from PIL import Image

# Load PDF
pdf = pdfium.PdfDocument("document.pdf")

# Render page to image
page = pdf[0]  # First page
bitmap = page.render(
    scale=2.0,  # Higher resolution
    rotation=0  # No rotation
)

# Convert to PIL Image
img = bitmap.to_pil()
img.save("page_1.png", "PNG")

# Process multiple pages
for i, page in enumerate(pdf):
    bitmap = page.render(scale=1.5)
    img = bitmap.to_pil()
    img.save(f"page_{i+1}.jpg", "JPEG", quality=90)
```

### Extract Text with pypdfium2
```python
import pypdfium2 as pdfium

pdf = pdfium.PdfDocument("document.pdf")
for i, page in enumerate(pdf):
    text = page.get_text()
    print(f"Page {i+1} text length: {len(text)} chars")
```

## JavaScript Libraries

### pdf-lib (MIT License)

pdf-lib is a powerful JavaScript library for creating and modifying PDF documents in any JavaScript environment.

#### Load and Manipulate Existing PDF
```javascript
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function manipulatePDF() {
    // Load existing PDF
    const existingPdfBytes = fs.readFileSync('input.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get page count
    const pageCount = pdfDoc.getPageCount();
    console.log(`Document has ${pageCount} pages`);

    // Add new page
    const newPage = pdfDoc.addPage([600, 400]);
    newPage.drawText('Added by pdf-lib', {
        x: 100,
        y: 300,
        size: 16
    });

    // Save modified PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('modified.pdf', pdfBytes);
}
```

#### Create Complex PDFs from Scratch
```javascript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createPDF() {
    const pdfDoc = await PDFDocument.create();

    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add page
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Add text with styling
    page.drawText('Invoice #12345', {
        x: 50,
        y: height - 50,
        size: 18,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.8)
    });

    // Add rectangle (header background)
    page.drawRectangle({
        x: 40,
        y: height - 100,
        width: width - 80,
        height: 30,
        color: rgb(0.9, 0.9, 0.9)
    });

    // Add table-like content
    const items = [
        ['Item', 'Qty', 'Price', 'Total'],
        ['Widget', '2', '$50', '$100'],
        ['Gadget', '1', '$75', '$75']
    ];

    let yPos = height - 150;
    items.forEach(row => {
        let xPos = 50;
        row.forEach(cell => {
            page.drawText(cell, {
                x: xPos,
                y: yPos,
                size: 12,
                font: helveticaFont
            });
            xPos += 120;
        });
        yPos -= 25;
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('created.pdf', pdfBytes);
}
```

## Performance Optimization Tips

### 1. For Large PDFs
- Use streaming approaches instead of loading entire PDF in memory
- Use `qpdf --split-pages` for splitting large files
- Process pages individually with pypdfium2

### 2. For Text Extraction
- `pdftotext -bbox-layout` is fastest for plain text extraction
- Use pdfplumber for structured data and tables
- Avoid `pypdf.extract_text()` for very large documents

### 3. For Image Extraction
- `pdfimages` is much faster than rendering pages
- Use low resolution for previews, high resolution for final output

### 4. For Form Filling
- pdf-lib maintains form structure better than most alternatives
- Pre-validate form fields before processing

### 5. Memory Management
```python
# Process PDFs in chunks
def process_large_pdf(pdf_path, chunk_size=10):
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)

    for start_idx in range(0, total_pages, chunk_size):
        end_idx = min(start_idx + chunk_size, total_pages)
        writer = PdfWriter()

        for i in range(start_idx, end_idx):
            writer.add_page(reader.pages[i])

        # Process chunk
        with open(f"chunk_{start_idx//chunk_size}.pdf", "wb") as output:
            writer.write(output)
```

## Troubleshooting Common Issues

### Encrypted PDFs
```python
# Handle password-protected PDFs
from pypdf import PdfReader

try:
    reader = PdfReader("encrypted.pdf")
    if reader.is_encrypted:
        reader.decrypt("password")
except Exception as e:
    print(f"Failed to decrypt: {e}")
```

### Corrupted PDFs
```bash
# Use qpdf to repair
qpdf --check corrupted.pdf
qpdf --replace-input corrupted.pdf
```

### Text Extraction Issues
```python
# Fallback to OCR for scanned PDFs
import pytesseract
from pdf2image import convert_from_path

def extract_text_with_ocr(pdf_path):
    images = convert_from_path(pdf_path)
    text = ""
    for i, image in enumerate(images):
        text += pytesseract.image_to_string(image)
    return text
```

## License Information

- **pypdf**: BSD License
- **pdfplumber**: MIT License
- **pypdfium2**: Apache/BSD License
- **reportlab**: BSD License
- **poppler-utils**: GPL-2 License
- **qpdf**: Apache License
- **pdf-lib**: MIT License
- **pdfjs-dist**: Apache License
