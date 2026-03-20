/**
 * Sample Resume Creator
 * Creates a generic software engineer resume for testing the tailor tool
 */

const { Document, Paragraph, TextRun, AlignmentType, Packer } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
      },
    },
    children: [
      // Name
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Alex Chen",
            bold: true,
            size: 32,
          }),
        ],
      }),

      // Contact
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "alex.chen@email.com | (555) 123-4567 | github.com/alexchen | San Francisco, CA",
            size: 20,
          }),
        ],
      }),

      new Paragraph({ text: "" }), // Spacing

      // Summary
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: 24,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Software engineer with 6 years of experience building web applications and backend services. Skilled in full-stack development, system design, and team collaboration. Passionate about code quality and user experience.",
            size: 20,
          }),
        ],
      }),

      new Paragraph({ text: "" }),

      // Experience
      new Paragraph({
        children: [
          new TextRun({
            text: "EXPERIENCE",
            bold: true,
            size: 24,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Software Engineer II", bold: true, size: 22 }),
          new TextRun({ text: " | DataFlow Systems | ", size: 22 }),
          new TextRun({ text: "Jan 2021 - Present", italics: true, size: 22 }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Developed microservices handling 10M+ daily requests using Python and FastAPI",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Built real-time data pipeline processing 500GB daily using Apache Kafka and Spark",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Led migration to Kubernetes, improving deployment efficiency by 60%",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Mentored 3 junior developers and conducted code reviews",
            size: 20,
          }),
        ],
      }),

      new Paragraph({ text: "" }),

      new Paragraph({
        children: [
          new TextRun({ text: "Full Stack Developer", bold: true, size: 22 }),
          new TextRun({ text: " | WebTech Solutions | ", size: 22 }),
          new TextRun({ text: "Jun 2018 - Dec 2020", italics: true, size: 22 }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Created React-based dashboard serving 50k+ users with TypeScript and Redux",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Implemented RESTful APIs with Node.js and Express, integrated with PostgreSQL",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Improved application performance by 40% through optimization and caching",
            size: 20,
          }),
        ],
      }),

      new Paragraph({ text: "" }),

      // Education
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: 24,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "B.S. Computer Science", bold: true, size: 22 }),
          new TextRun({ text: " | University of California, Berkeley | ", size: 22 }),
          new TextRun({ text: "2018", italics: true, size: 22 }),
        ],
      }),

      new Paragraph({ text: "" }),

      // Skills
      new Paragraph({
        children: [
          new TextRun({
            text: "TECHNICAL SKILLS",
            bold: true,
            size: 24,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Languages: ",
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: "Python, TypeScript, JavaScript, Java, SQL",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Frameworks: ",
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: "React, Node.js, FastAPI, Django, Express",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Tools & Platforms: ",
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: "Docker, Kubernetes, AWS, PostgreSQL, Redis, Git, CI/CD",
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Data: ",
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: "Apache Kafka, Spark, pandas, data pipelines",
            size: 20,
          }),
        ],
      }),
    ],
  }],
});

// Save the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('examples/sample-resume.docx', buffer);
  console.log('✅ Sample resume created: examples/sample-resume.docx');
});
