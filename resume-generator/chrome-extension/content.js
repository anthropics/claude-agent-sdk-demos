// Content script to extract job descriptions from web pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobDescription') {
    const jobText = extractJobDescription();
    sendResponse({ text: jobText });
  }
  return true;
});

function extractJobDescription() {
  // Try multiple strategies to extract job description

  // Strategy 1: Look for common job description containers
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    '[class*="description"]',
    'article',
    '[role="article"]',
    'main',
    '.content',
    '#content'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = extractText(element);
      if (text.length > 200) { // Minimum length for a job description
        return cleanText(text);
      }
    }
  }

  // Strategy 2: Get all text from body (fallback)
  const bodyText = extractText(document.body);
  return cleanText(bodyText);
}

function extractText(element) {
  // Clone the element to avoid modifying the page
  const clone = element.cloneNode(true);

  // Remove script and style elements
  const unwanted = clone.querySelectorAll('script, style, nav, header, footer, iframe');
  unwanted.forEach(el => el.remove());

  return clone.innerText || clone.textContent || '';
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim()
    .substring(0, 10000); // Limit to 10k characters
}
