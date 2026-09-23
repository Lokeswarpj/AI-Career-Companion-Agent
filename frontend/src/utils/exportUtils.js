import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, BorderStyle, Packer } from 'docx';

/**
 * Utility functions for exporting Resume & Cover Letter in PDF, DOCX, and Markdown formats.
 */

/**
 * Converts Markdown resume/cover-letter text into clean semantic HTML for Word export.
 */
export function markdownToHtml(markdown = '') {
  if (!markdown) return '';

  const lines = markdown.split(/\r?\n/);
  const htmlLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Check for list end
    if (inList && !line.startsWith('- ') && !line.startsWith('* ')) {
      htmlLines.push('</ul>');
      inList = false;
    }

    if (!line) {
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      htmlLines.push('<hr class="resume-divider" />');
      continue;
    }

    // Heading 1 (Candidate Name)
    if (line.startsWith('# ')) {
      const text = line.substring(2).trim();
      htmlLines.push(`<h1 class="resume-name">${formatInline(text)}</h1>`);
      continue;
    }

    // Heading 2 (Major Sections: Summary, Technical Competencies, Projects, Education)
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      htmlLines.push(`<h2 class="resume-section-title">${formatInline(text)}</h2>`);
      continue;
    }

    // Heading 3 (Project / Job Titles)
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      htmlLines.push(`<h3 class="resume-item-title">${formatInline(text)}</h3>`);
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul class="resume-bullet-list">');
        inList = true;
      }
      const text = line.substring(2).trim();
      htmlLines.push(`<li class="resume-bullet-item">${formatInline(text)}</li>`);
      continue;
    }

    // Regular paragraph
    htmlLines.push(`<p class="resume-paragraph">${formatInline(line)}</p>`);
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
}

/**
 * Formats inline bold, italics, links, and code snippets.
 */
function formatInline(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="resume-code">$1</code>');
}

/**
 * Downloads plain text / markdown file.
 */
export function downloadAsMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(filename.endsWith('.md') ? filename : `${filename}.md`, blob);
}

/**
 * Downloads as plain text.
 */
export function downloadAsText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(filename.endsWith('.txt') ? filename : `${filename}.txt`, blob);
}

/**
 * Downloads as a formatted genuine Microsoft Word (.docx) OpenXML document.
 * Generates an authentic OpenXML package that opens natively in Microsoft Word, Word Online, and Google Docs without security or unreadable content warnings.
 */
export async function downloadAsDocx(filename, markdownContent, title = 'Document') {
  try {
    const lines = (markdownContent || '').split(/\r?\n/);
    const children = [];

    // Helper to sanitize emoji characters for Word typography
    function sanitizeText(str = '') {
      return str
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
        .replace(/[📧📱📍🎯🛠️🚀🎓💡✓•📇]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) {
        children.push(new Paragraph({ spacing: { after: 100 } }));
        continue;
      }

      // Divider Line
      if (rawLine === '---' || rawLine === '***' || rawLine === '___') {
        children.push(
          new Paragraph({
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 4,
                style: BorderStyle.SINGLE,
                size: 6
              }
            },
            spacing: { after: 140 }
          })
        );
        continue;
      }

      // Heading 1: Candidate Name
      if (rawLine.startsWith('# ')) {
        const text = sanitizeText(rawLine.substring(2));
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text.toUpperCase(),
                bold: true,
                size: 36, // 18pt
                color: '0F172A',
                font: 'Calibri'
              })
            ],
            spacing: { before: 80, after: 80 }
          })
        );
        continue;
      }

      // Heading 2: Major Section Titles (e.g. PROFESSIONAL SUMMARY, TECHNICAL COMPETENCIES)
      if (rawLine.startsWith('## ')) {
        const text = sanitizeText(rawLine.substring(3));
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text.toUpperCase(),
                bold: true,
                size: 23, // 11.5pt
                color: '1E3A8A', // Navy
                font: 'Calibri'
              })
            ],
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 10
              }
            },
            spacing: { before: 200, after: 100 }
          })
        );
        continue;
      }

      // Heading 3: Project Titles / Subheadings
      if (rawLine.startsWith('### ')) {
        const text = sanitizeText(rawLine.substring(4)).replace(/\*\*/g, '').replace(/\*/g, '');
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 21, // 10.5pt
                color: '0F172A',
                font: 'Calibri'
              })
            ],
            spacing: { before: 120, after: 60 }
          })
        );
        continue;
      }

      // Bullet Points
      if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
        const bulletContent = sanitizeText(rawLine.substring(2));
        const textRuns = [];

        // Check for bold prefix (e.g. **Core Competencies**: ...)
        const boldMatch = bulletContent.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (boldMatch) {
          textRuns.push(
            new TextRun({
              text: boldMatch[1] + ': ',
              bold: true,
              size: 20, // 10pt
              color: '0F172A',
              font: 'Calibri'
            }),
            new TextRun({
              text: boldMatch[2],
              size: 20,
              color: '334155',
              font: 'Calibri'
            })
          );
        } else {
          // Parse inline bold/italic
          const parts = bulletContent.split(/(\*\*[^*]+\*\*)/g);
          for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
              textRuns.push(
                new TextRun({
                  text: part.slice(2, -2),
                  bold: true,
                  size: 20,
                  color: '0F172A',
                  font: 'Calibri'
                })
              );
            } else {
              textRuns.push(
                new TextRun({
                  text: part.replace(/\*/g, ''),
                  size: 20,
                  color: '334155',
                  font: 'Calibri'
                })
              );
            }
          }
        }

        children.push(
          new Paragraph({
            bullet: {
              level: 0
            },
            children: textRuns,
            spacing: { before: 40, after: 40 }
          })
        );
        continue;
      }

      // Regular Paragraphs / Sub-headers / Cover Letter Text
      const cleanLine = sanitizeText(rawLine);
      const textRuns = [];
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          textRuns.push(
            new TextRun({
              text: part.slice(2, -2),
              bold: true,
              size: 20,
              color: '0F172A',
              font: 'Calibri'
            })
          );
        } else {
          textRuns.push(
            new TextRun({
              text: part.replace(/\*/g, ''),
              size: 20,
              color: '334155',
              font: 'Calibri'
            })
          );
        }
      }

      children.push(
        new Paragraph({
          children: textRuns,
          spacing: { before: 50, after: 50 }
        })
      );
    }

    const doc = new Document({
      title: title,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,    // ~0.7 inch
                right: 1100,  // ~0.75 inch
                bottom: 1000,
                left: 1100
              }
            }
          },
          children: children
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const finalName = filename.replace(/\.(md|txt|docx)$/i, '') + '.docx';
    triggerDownload(finalName, blob);
  } catch (err) {
    console.error('Failed to generate DOCX:', err);
    throw err;
  }
}

/**
 * Generates and directly downloads an ATS-formatted vector PDF file.
 * Uses native jsPDF layout engine for crisp text rendering, accurate page breaks,
 * and 100% searchability for Applicant Tracking Systems.
 */
export async function downloadAsPdf(filename, markdownContent, title = 'Tailored Document') {
  const cleanFilename = filename.replace(/\.(md|txt|pdf)$/i, '') + '.pdf';

  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 18; // 18mm standard ATS margins
    const contentWidth = pageWidth - (margin * 2); // 174mm

    let currentY = margin + 2;

    function checkPageBreak(neededHeight) {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin + 5;
      }
    }

    // Sanitize emoji and unicode symbols for standard PDF Helvetica font
    function sanitizeText(str = '') {
      return str
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
        .replace(/[📧📱📍🎯🛠️🚀🎓💡✓•📇]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const lines = (markdownContent || '').split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i].trim();
      if (!rawLine) {
        currentY += 2.2;
        continue;
      }

      // Horizontal Divider
      if (rawLine === '---' || rawLine === '***' || rawLine === '___') {
        checkPageBreak(5);
        currentY += 1;
        doc.setDrawColor(226, 232, 240); // #e2e8f0
        doc.setLineWidth(0.35);
        doc.line(margin, currentY, margin + contentWidth, currentY);
        currentY += 4.5;
        continue;
      }

      // Heading 1: Candidate Name
      if (rawLine.startsWith('# ')) {
        const text = sanitizeText(rawLine.substring(2));
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // #0f172a
        doc.text(text.toUpperCase(), margin, currentY);
        currentY += 6.5;
        continue;
      }

      // Heading 2: Major Section Titles (PROFESSIONAL SUMMARY, TECHNICAL COMPETENCIES, etc.)
      if (rawLine.startsWith('## ')) {
        const rawText = sanitizeText(rawLine.substring(3));
        checkPageBreak(12);
        currentY += 2.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138); // #1e3a8a
        doc.text(rawText.toUpperCase(), margin, currentY);
        currentY += 1.8;
        doc.setDrawColor(203, 213, 225); // #cbd5e1
        doc.setLineWidth(0.4);
        doc.line(margin, currentY, margin + contentWidth, currentY);
        currentY += 4.5;
        continue;
      }

      // Heading 3: Project Titles / Subheadings
      if (rawLine.startsWith('### ')) {
        let rawText = sanitizeText(rawLine.substring(4)).replace(/\*\*/g, '').replace(/\*/g, '');
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(rawText, margin, currentY);
        currentY += 4.5;
        continue;
      }

      // Bullet Points
      if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
        let bulletContent = sanitizeText(rawLine.substring(2));
        
        let prefix = '';
        let remaining = bulletContent;
        const boldMatch = bulletContent.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (boldMatch) {
          prefix = boldMatch[1] + ': ';
          remaining = boldMatch[2];
        } else {
          remaining = bulletContent.replace(/\*\*/g, '').replace(/\*/g, '');
        }

        checkPageBreak(7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        // Bullet marker
        doc.text('•', margin + 1, currentY);

        const indent = 6;
        const fullText = prefix ? (prefix + remaining) : remaining;
        const wrapped = doc.splitTextToSize(fullText, contentWidth - indent);

        for (let j = 0; j < wrapped.length; j++) {
          checkPageBreak(4.5);
          if (j === 0 && prefix) {
            doc.setFont('helvetica', 'bold');
            doc.text(prefix, margin + indent, currentY);
            const pWidth = doc.getTextWidth(prefix);
            doc.setFont('helvetica', 'normal');
            const restOfLine = wrapped[j].substring(prefix.length);
            doc.text(restOfLine, margin + indent + pWidth, currentY);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(wrapped[j], margin + indent, currentY);
          }
          currentY += 4.2;
        }
        currentY += 0.8;
        continue;
      }

      // Regular Text / Sub-headers / Cover Letter Paragraphs
      let text = sanitizeText(rawLine).replace(/\*\*/g, '').replace(/\*/g, '');
      checkPageBreak(6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.8);
      doc.setTextColor(51, 65, 85); // #334155

      const wrapped = doc.splitTextToSize(text, contentWidth);
      for (const wLine of wrapped) {
        checkPageBreak(4.8);
        doc.text(wLine, margin, currentY);
        currentY += 4.6;
      }
      currentY += 1.5;
    }

    // Save and download PDF directly
    doc.save(cleanFilename);
  } catch (err) {
    console.error('PDF export error:', err);
    throw err;
  }
}

/**
 * Helper to trigger file download via temporary anchor element.
 */
function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}


