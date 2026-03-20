// WebSocket connection
let ws;
let selectedFile = null;
let usingSampleResume = false;

// Load sample jobs on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/examples/sample_jobs.json');
    const jobs = await response.json();
    const select = document.getElementById('sampleJobSelect');

    jobs.forEach(job => {
      const option = document.createElement('option');
      option.value = job.url;
      option.textContent = `${job.title}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load sample jobs:', error);
  }
});

function handleSampleJobSelect(event) {
  const url = event.target.value;
  if (url) {
    document.getElementById('jobDescriptionUrl').value = url;
  }
}

async function useSampleResume() {
  try {
    const response = await fetch('/examples/sample_resume.docx');
    const blob = await response.blob();
    const file = new File([blob], 'sample_resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    selectedFile = file;
    usingSampleResume = true;

    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `
      <i class="fas fa-file-word text-4xl mb-2 text-blue-500"></i>
      <p class="font-medium text-gray-800">sample_resume.docx (Sample)</p>
      <p class="text-sm text-gray-500">Software Engineer - ML/AI Experience</p>
    `;
  } catch (error) {
    alert('Failed to load sample resume: ' + error.message);
  }
}

function connectWebSocket() {
  ws = new WebSocket(`ws://${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(connectWebSocket, 3000);
  };
}

connectWebSocket();

function switchTab(tab) {
  const urlTab = document.getElementById('urlTab');
  const textTab = document.getElementById('textTab');
  const urlInput = document.getElementById('urlInput');
  const textInput = document.getElementById('textInput');

  if (tab === 'url') {
    urlTab.className = 'px-4 py-2 font-medium text-indigo-600 border-b-2 border-indigo-600';
    textTab.className = 'px-4 py-2 font-medium text-gray-500 hover:text-gray-700';
    urlInput.classList.remove('hidden');
    textInput.classList.add('hidden');
  } else {
    textTab.className = 'px-4 py-2 font-medium text-indigo-600 border-b-2 border-indigo-600';
    urlTab.className = 'px-4 py-2 font-medium text-gray-500 hover:text-gray-700';
    textInput.classList.remove('hidden');
    urlInput.classList.add('hidden');
  }
}

function handleWebSocketMessage(data) {
  const progressLog = document.getElementById('progressLog');

  switch(data.type) {
    case 'status':
      addProgressMessage(data.message, 'info');
      break;
    case 'progress':
      addProgressMessage(data.message, 'text');
      break;
    case 'tool':
      addProgressMessage(`🔧 Using: ${data.name}`, 'tool');
      break;
    case 'complete':
      showResults(data.result);
      break;
    case 'error':
      addProgressMessage(`❌ Error: ${data.message}`, 'error');
      enableSubmitButton();
      break;
  }
}

function addProgressMessage(message, type = 'text') {
  const progressLog = document.getElementById('progressLog');
  const div = document.createElement('div');

  const colors = {
    info: 'text-blue-600 font-semibold',
    tool: 'text-purple-600',
    error: 'text-red-600 font-semibold',
    text: 'text-gray-700'
  };

  div.className = `p-2 ${colors[type] || colors.text}`;
  div.textContent = message;
  progressLog.appendChild(div);
  progressLog.scrollTop = progressLog.scrollHeight;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `
      <i class="fas fa-file-word text-4xl mb-2 text-green-500"></i>
      <p class="font-medium text-gray-800">${file.name}</p>
      <p class="text-sm text-gray-500">${(file.size / 1024).toFixed(1)} KB</p>
    `;
  }
}

async function tailorResume() {
  if (!selectedFile) {
    alert('Please upload your resume (.docx file)');
    return;
  }

  const jobDescriptionUrl = document.getElementById('jobDescriptionUrl').value.trim();
  const jobDescription = document.getElementById('jobDescription').value.trim();

  if (!jobDescriptionUrl && !jobDescription) {
    alert('Please provide either a job description URL or paste the job description text');
    return;
  }

  // Show progress section
  document.getElementById('progressSection').classList.remove('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('progressLog').innerHTML = '';

  // Disable submit button
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  document.getElementById('btnText').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  // Prepare form data
  const formData = new FormData();
  formData.append('resume', selectedFile);

  // Send URL if provided, otherwise send text
  if (jobDescriptionUrl) {
    formData.append('jobDescriptionUrl', jobDescriptionUrl);
  } else {
    formData.append('jobDescription', jobDescription);
  }

  // Send web search preference
  const enableWebSearch = document.getElementById('enableWebSearch').checked;
  formData.append('enableWebSearch', enableWebSearch);

  try {
    const response = await fetch('/api/tailor', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to tailor resume');
    }

    // Results will be shown via WebSocket
  } catch (error) {
    addProgressMessage(`Error: ${error.message}`, 'error');
    enableSubmitButton();
  }
}

function showResults(result) {
  enableSubmitButton();

  const resultsSection = document.getElementById('resultsSection');
  resultsSection.classList.remove('hidden');

  // Show download button
  if (result.files && result.files.resume) {
    const downloadBtn = document.getElementById('downloadResume');
    downloadBtn.href = result.files.resume;
    downloadBtn.download = 'tailored_resume.docx';
    downloadBtn.classList.remove('hidden');
  }

  // Show analysis button
  if (result.analysisContent) {
    document.getElementById('viewAnalysis').classList.remove('hidden');
    const analysisText = document.getElementById('analysisText');
    // Simple markdown rendering
    analysisText.innerHTML = result.analysisContent
      .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>');
  }

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function toggleAnalysis() {
  const content = document.getElementById('analysisContent');
  const btn = document.getElementById('viewAnalysis');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    btn.innerHTML = '<i class="fas fa-times mr-2"></i> Hide Analysis';
  } else {
    content.classList.add('hidden');
    btn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> View Analysis';
  }
}

function resetForm() {
  selectedFile = null;
  document.getElementById('resumeFile').value = '';
  document.getElementById('jobDescriptionUrl').value = '';
  document.getElementById('jobDescription').value = '';
  document.getElementById('fileInfo').innerHTML = `
    <i class="fas fa-cloud-upload-alt text-4xl mb-2 text-indigo-400"></i>
    <p class="font-medium">Click to upload or drag and drop</p>
    <p class="text-sm">Only .docx files supported</p>
  `;
  document.getElementById('progressSection').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('analysisContent').classList.add('hidden');
  switchTab('url'); // Reset to URL tab
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enableSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = false;
  document.getElementById('btnText').innerHTML = '<i class="fas fa-magic mr-2"></i> Tailor My Resume';
}
