let selectedFile = null;
let jobDescription = null;
const API_URL = 'http://100.78.167.87:3002';

// UI Elements
const resumeFile = document.getElementById('resumeFile');
const extractBtn = document.getElementById('extractBtn');
const tailorBtn = document.getElementById('tailorBtn');
const enableWebSearch = document.getElementById('enableWebSearch');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const downloadLink = document.getElementById('downloadLink');
const extractedInfo = document.getElementById('extractedInfo');

// Handle resume file selection
resumeFile.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  updateTailorButton();
});

// Extract job description from current page
extractBtn.addEventListener('click', async () => {
  showStatus('Extracting job description from page...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script to extract JD
    chrome.tabs.sendMessage(tab.id, { action: 'extractJobDescription' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Could not extract from this page. Try copying the URL instead.', 'error');
        return;
      }

      if (response && response.text) {
        jobDescription = response.text;
        extractedInfo.style.display = 'block';
        extractBtn.textContent = '✓ Extracted from Page';
        extractBtn.style.background = '#48bb78';
        showStatus('Job description extracted successfully!', 'success');
        updateTailorButton();
      } else {
        showStatus('Could not find job description on this page', 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

// Tailor resume
tailorBtn.addEventListener('click', async () => {
  if (!selectedFile || !jobDescription) {
    showStatus('Please upload resume and extract job description', 'error');
    return;
  }

  tailorBtn.disabled = true;
  tailorBtn.textContent = '⏳ Processing...';
  showStatus('Sending to AI agent...', 'info');
  progress.classList.add('show');
  progress.innerHTML = '<div>Starting tailoring process...</div>';

  try {
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('jobDescription', jobDescription);
    formData.append('enableWebSearch', enableWebSearch.checked);

    const response = await fetch(`${API_URL}/api/tailor`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }

    const result = await response.json();

    if (result.success && result.files && result.files.resume) {
      showStatus('✅ Resume tailored successfully!', 'success');

      // Download the tailored resume
      const resumeUrl = `${API_URL}${result.files.resume}`;
      downloadLink.href = resumeUrl;
      downloadLink.classList.add('show');

      progress.innerHTML += '<div style="color: #48bb78; font-weight: 600;">✓ Complete! Click download button above.</div>';
    } else {
      showStatus('Tailoring completed but no resume file was generated', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    tailorBtn.disabled = false;
    tailorBtn.textContent = 'Tailor My Resume';
  }
});

function updateTailorButton() {
  tailorBtn.disabled = !(selectedFile && jobDescription);
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}

// Load saved settings
chrome.storage.local.get(['enableWebSearch'], (result) => {
  if (result.enableWebSearch !== undefined) {
    enableWebSearch.checked = result.enableWebSearch;
  }
});

// Save settings when changed
enableWebSearch.addEventListener('change', () => {
  chrome.storage.local.set({ enableWebSearch: enableWebSearch.checked });
});
