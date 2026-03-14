import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat } from 'docx';

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    }
  },
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  sections: [{
    properties: {
      page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
    },
    children: [
      // Name
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Alex Chen", bold: true, size: 32 })]
      }),
      // Contact Info
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "San Francisco, CA | ", size: 20 }),
          new TextRun({ text: "alex.chen@email.com", size: 20 }),
          new TextRun({ text: " | (555) 123-4567 | ", size: 20 }),
          new TextRun({ text: "linkedin.com/in/alexchen", size: 20 })
        ]
      }),

      // Professional Summary
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "Software Engineer with 5+ years of experience building scalable ML/AI systems and distributed infrastructure. Expertise in Python, cloud platforms, and production machine learning pipelines. Proven track record of deploying ML models serving millions of users and optimizing system performance at scale.",
          size: 22
        })]
      }),

      // Work Experience
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "WORK EXPERIENCE", bold: true, size: 24 })]
      }),

      // Job 1
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Senior Machine Learning Engineer", bold: true, size: 22 }),
          new TextRun({ text: " | TechVision AI", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "San Francisco, CA | March 2022 - Present", italics: true, size: 20 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Architected and deployed real-time recommendation engine processing 50M+ daily requests with 99.9% uptime, reducing latency by 40% through model optimization and caching strategies", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Built distributed training pipeline using Ray and PyTorch for large-scale NLP models, reducing training time from 72 hours to 12 hours", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Led migration of ML infrastructure to Kubernetes on AWS, implementing auto-scaling that reduced compute costs by 35% while improving model serving performance", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 150 },
        children: [new TextRun({ text: "Mentored 3 junior engineers on ML best practices and code review, establishing team standards for model evaluation and deployment", size: 22 })]
      }),

      // Job 2
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Machine Learning Engineer", bold: true, size: 22 }),
          new TextRun({ text: " | DataFlow Systems", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Seattle, WA | June 2020 - February 2022", italics: true, size: 20 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Developed computer vision models for document processing using TensorFlow and OpenCV, achieving 95% accuracy on production data", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Built scalable data pipeline processing 500GB daily using Apache Spark and Airflow, enabling efficient model training workflows", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Implemented MLOps practices including automated testing, CI/CD for models, and monitoring dashboards using Prometheus and Grafana", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 150 },
        children: [new TextRun({ text: "Collaborated with product and data science teams to define ML system requirements and deliver features that increased user engagement by 25%", size: 22 })]
      }),

      // Job 3
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Software Engineer", bold: true, size: 22 }),
          new TextRun({ text: " | CloudTech Inc.", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Austin, TX | July 2019 - May 2020", italics: true, size: 20 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Built RESTful APIs using Python/Flask and PostgreSQL serving 10K+ requests per second with sub-100ms response times", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Deployed microservices on GCP using Docker and Kubernetes, implementing health checks and auto-recovery mechanisms", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 150 },
        children: [new TextRun({ text: "Optimized database queries and implemented Redis caching, reducing API latency by 60% and improving system throughput", size: 22 })]
      }),

      // Education
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "EDUCATION", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: "Bachelor of Science in Computer Science", bold: true, size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({ text: "University of California, Berkeley | May 2019 | GPA: 3.8/4.0", size: 22 })]
      }),

      // Technical Skills
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "TECHNICAL SKILLS", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Languages: ", bold: true, size: 22 }),
          new TextRun({ text: "Python, JavaScript, TypeScript, SQL, Bash", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "ML/AI: ", bold: true, size: 22 }),
          new TextRun({ text: "PyTorch, TensorFlow, scikit-learn, Ray, Hugging Face, LangChain, OpenCV", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Cloud & Infrastructure: ", bold: true, size: 22 }),
          new TextRun({ text: "AWS (SageMaker, EC2, S3, Lambda), GCP, Docker, Kubernetes, Terraform", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Data & Databases: ", bold: true, size: 22 }),
          new TextRun({ text: "PostgreSQL, Redis, MongoDB, Apache Spark, Airflow, Kafka", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Tools & Frameworks: ", bold: true, size: 22 }),
          new TextRun({ text: "Git, FastAPI, Flask, Django, REST APIs, GraphQL, CI/CD, Prometheus, Grafana", size: 22 })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("resume-generator/examples/sample_resume.docx", buffer);
  console.log("Sample resume created successfully!");
});
