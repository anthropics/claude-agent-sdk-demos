// Job Dashboard State
let currentResume = null;
let savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
let applications = JSON.parse(localStorage.getItem('applications') || '[]');
let searchResults = [];

// Auto-apply state
let currentTailoringJob = null;
let autoApplyMode = false;
let autoApplyQueue = [];
let queueIndex = 0;
let queueProcessing = false;
let currentCoverLetterContent = '';

// WebSocket for real-time updates
let ws = null;

function connectWebSocket() {
  ws = new WebSocket(`ws://${window.location.host}`);
  ws.onopen = () => console.log('WebSocket connected');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  ws.onclose = () => setTimeout(connectWebSocket, 3000);
}

connectWebSocket();

function handleWebSocketMessage(data) {
  const progress = document.getElementById('tailorProgress');
  if (!progress) return;

  switch(data.type) {
    case 'status':
    case 'progress':
      progress.innerHTML += `<div class="text-blue-600">${data.message}</div>`;
      break;
    case 'tool':
      progress.innerHTML += `<div class="text-purple-600">🔧 ${data.name}</div>`;
      break;
    case 'complete':
      showTailorComplete(data.result);
      break;
    case 'error':
      progress.innerHTML += `<div class="text-red-600">❌ ${data.message}</div>`;
      break;
  }
  progress.scrollTop = progress.scrollHeight;
}

// Tab Switching
function switchDashboardTab(tab) {
  document.querySelectorAll('[id^="tab"]').forEach(btn => {
    btn.className = 'px-6 py-3 font-medium text-gray-600 hover:text-gray-800';
  });
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).className =
    'px-6 py-3 font-medium border-b-2 border-indigo-600 text-indigo-600';

  document.getElementById('searchResults').classList.add('hidden');
  document.getElementById('savedJobs').classList.add('hidden');
  document.getElementById('applications').classList.add('hidden');

  if (tab === 'search') {
    document.getElementById('searchResults').classList.remove('hidden');
  } else if (tab === 'saved') {
    document.getElementById('savedJobs').classList.remove('hidden');
    renderSavedJobs();
  } else if (tab === 'applications') {
    document.getElementById('applications').classList.remove('hidden');
    renderApplications();
  }
}

// Job Search
async function searchJobs() {
  const keywords = document.getElementById('searchKeywords').value.trim();
  if (!keywords) {
    alert('Please enter job keywords');
    return;
  }

  const location = document.getElementById('searchLocation').value.trim();
  const remote = document.getElementById('filterRemote').checked;
  const experience = document.getElementById('filterExperience').value;
  const jobType = document.getElementById('filterJobType').value;

  document.getElementById('jobsContainer').classList.add('hidden');
  document.getElementById('loadingJobs').classList.remove('hidden');

  try {
    const response = await fetch('/api/search-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, remote, experience, jobType })
    });

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    searchResults = data.jobs || [];
    renderSearchResults();
  } catch (error) {
    console.error('Search error:', error);
    alert('Job search failed. Using demo data...');
    loadDemoJobs(keywords, location);
  } finally {
    document.getElementById('loadingJobs').classList.add('hidden');
    document.getElementById('jobsContainer').classList.remove('hidden');
  }
}

function loadDemoJobs(keywords, location) {
  searchResults = [
    {
      id: 'demo1',
      title: `Senior ${keywords} Engineer`,
      company: 'Anthropic',
      location: location || 'San Francisco, CA',
      salary: '$200k - $350k',
      type: 'Full-time',
      remote: 'Hybrid',
      url: 'https://job-boards.greenhouse.io/anthropic/jobs/5098984008',
      description: `We're looking for a ${keywords} to join our team and work on cutting-edge AI systems...`,
      postedDate: '2 days ago',
      logo: '🤖'
    },
    {
      id: 'demo2',
      title: `${keywords} - ML Platform`,
      company: 'OpenAI',
      location: location || 'San Francisco, CA',
      salary: '$180k - $300k',
      type: 'Full-time',
      remote: 'Remote',
      url: 'https://openai.com/careers',
      description: `Join us to build the future of AI. Looking for experienced ${keywords}...`,
      postedDate: '1 week ago',
      logo: '⚡'
    },
    {
      id: 'demo3',
      title: `Lead ${keywords}`,
      company: 'Google DeepMind',
      location: location || 'London, UK',
      salary: '£120k - £200k',
      type: 'Full-time',
      remote: 'Hybrid',
      url: 'https://deepmind.google/careers',
      description: `Shape the future of AI research as a ${keywords}...`,
      postedDate: '3 days ago',
      logo: '🧠'
    }
  ];
  renderSearchResults();
}

function renderSearchResults() {
  const container = document.getElementById('jobsContainer');
  if (searchResults.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-12">
        <i class="fas fa-search text-4xl mb-3"></i>
        <p>No jobs found. Try different keywords.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = searchResults.map(job => createJobCard(job)).join('');
}

function createJobCard(job) {
  const isSaved = savedJobs.some(j => j.id === job.id);
  const hasApplied = applications.some(a => a.jobId === job.id);
  const resumeDisabled = !currentResume;

  return `
    <div class="border rounded-lg p-5 hover:shadow-md transition bg-white">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-start gap-3">
            <div class="text-3xl">${job.logo || '💼'}</div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-800">${job.title}</h3>
              <p class="text-gray-600">${job.company}</p>
              <div class="flex gap-3 mt-2 text-sm text-gray-500">
                <span><i class="fas fa-map-marker-alt mr-1"></i>${job.location}</span>
                <span><i class="fas fa-briefcase mr-1"></i>${job.type}</span>
                ${job.remote ? `<span><i class="fas fa-home mr-1"></i>${job.remote}</span>` : ''}
                ${job.salary ? `<span><i class="fas fa-dollar-sign mr-1"></i>${job.salary}</span>` : ''}
              </div>
              <p class="mt-3 text-sm text-gray-600 line-clamp-2">${job.description}</p>
              <p class="text-xs text-gray-400 mt-2">Posted: ${job.postedDate}</p>
              ${hasApplied ? '<span class="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"><i class="fas fa-check mr-1"></i>Applied</span>' : ''}
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 ml-4">
          <button
            onclick="toggleSaveJob('${job.id}')"
            class="p-2 rounded ${isSaved ? 'text-red-500' : 'text-gray-400'} hover:bg-gray-100"
            title="${isSaved ? 'Unsave' : 'Save'} job"
          >
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
      <div class="flex gap-2 mt-4 pt-4 border-t">
        <button
          onclick="tailorForJob('${job.id}')"
          class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm ${resumeDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
          ${resumeDisabled ? 'disabled title="Upload resume first"' : ''}
        >
          <i class="fas fa-magic mr-1"></i>Tailor Resume
        </button>
        <button
          onclick="autoApplyForJob('${job.id}')"
          class="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm ${resumeDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
          ${resumeDisabled ? 'disabled title="Upload resume first"' : ''}
        >
          <i class="fas fa-robot mr-1"></i>Auto Apply
        </button>
        <a
          href="${job.url}"
          target="_blank"
          class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
        >
          <i class="fas fa-external-link-alt mr-1"></i>View
        </a>
      </div>
    </div>
  `;
}

function toggleSaveJob(jobId) {
  const job = searchResults.find(j => j.id === jobId) || savedJobs.find(j => j.id === jobId);
  if (!job) return;

  const index = savedJobs.findIndex(j => j.id === jobId);
  if (index >= 0) {
    savedJobs.splice(index, 1);
  } else {
    savedJobs.push(job);
  }

  localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
  renderSearchResults();
  renderSavedJobs();
}

function renderSavedJobs() {
  const container = document.getElementById('savedJobsContainer');
  const batchBar = document.getElementById('batchAutoApplyBar');

  if (savedJobs.length === 0) {
    batchBar.classList.add('hidden');
    container.innerHTML = `
      <div class="text-center text-gray-500 py-12">
        <i class="fas fa-heart text-4xl mb-3"></i>
        <p>No saved jobs yet</p>
        <p class="text-sm mt-2">Click the heart icon on any job to save it</p>
      </div>
    `;
    return;
  }

  if (currentResume && savedJobs.length > 1) {
    batchBar.classList.remove('hidden');
  } else {
    batchBar.classList.add('hidden');
  }

  container.innerHTML = savedJobs.map(job => createJobCard(job)).join('');
}

function renderApplications() {
  const container = document.getElementById('applicationsContainer');
  if (applications.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-12">
        <i class="fas fa-paper-plane text-4xl mb-3"></i>
        <p>No applications tracked yet</p>
        <p class="text-sm mt-2">Use Auto Apply or Tailor Resume on any job to track applications</p>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => `
    <div class="border rounded-lg p-5 bg-white">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-bold">${app.jobTitle}</h3>
          <p class="text-gray-600">${app.company}</p>
          <p class="text-sm text-gray-500 mt-1">Applied: ${app.date}</p>
          ${app.autoApplied ? '<span class="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"><i class="fas fa-robot mr-1"></i>Auto Applied</span>' : ''}
        </div>
        <div class="flex gap-2 flex-wrap justify-end">
          ${app.resumeUrl ? `
            <a href="${app.resumeUrl}" download class="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600">
              <i class="fas fa-file-word mr-1"></i>Resume
            </a>
          ` : ''}
          ${app.coverLetterUrl ? `
            <a href="${app.coverLetterUrl}" target="_blank" class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
              <i class="fas fa-envelope mr-1"></i>Cover Letter
            </a>
          ` : ''}
          ${app.jobUrl ? `
            <a href="${app.jobUrl}" target="_blank" class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
              <i class="fas fa-external-link-alt mr-1"></i>Job Posting
            </a>
          ` : ''}
          <select
            onchange="updateApplicationStatus('${app.id}', this.value)"
            class="px-3 py-1 border rounded text-sm"
          >
            <option value="tailored" ${app.status === 'tailored' ? 'selected' : ''}>Tailored</option>
            <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
            <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
            <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

function updateApplicationStatus(appId, status) {
  const app = applications.find(a => a.id === appId);
  if (app) {
    app.status = status;
    localStorage.setItem('applications', JSON.stringify(applications));
  }
}

// Resume Upload
function showUploadModal() {
  document.getElementById('uploadModal').classList.remove('hidden');
}

function hideUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden');
}

function uploadResume() {
  const file = document.getElementById('dashboardResumeFile').files[0];
  if (!file) {
    alert('Please select a resume file');
    return;
  }

  currentResume = file;
  hideUploadModal();

  // Refresh job cards to enable buttons now that resume is uploaded
  renderSearchResults();
  renderSavedJobs();
  renderApplications();
}

// Tailor Resume for Job (manual mode)
async function tailorForJob(jobId) {
  if (!currentResume) {
    alert('Please upload your resume first');
    showUploadModal();
    return;
  }

  const job = searchResults.find(j => j.id === jobId) || savedJobs.find(j => j.id === jobId);
  if (!job) return;

  currentTailoringJob = job;
  autoApplyMode = false;
  showTailorModal(job, false);

  const formData = new FormData();
  formData.append('resume', currentResume);
  formData.append('jobDescriptionUrl', job.url);
  formData.append('enableWebSearch', 'true');
  formData.append('jobTitle', job.title);
  formData.append('companyName', job.company);

  try {
    await fetch('/api/tailor', { method: 'POST', body: formData });
  } catch (error) {
    document.getElementById('tailorProgress').innerHTML +=
      `<div class="text-red-600">Error: ${error.message}</div>`;
  }
}

// Auto Apply for Job (generates resume + cover letter + opens job URL)
async function autoApplyForJob(jobId) {
  if (!currentResume) {
    alert('Please upload your resume first');
    showUploadModal();
    return;
  }

  const job = searchResults.find(j => j.id === jobId) || savedJobs.find(j => j.id === jobId);
  if (!job) return;

  currentTailoringJob = job;
  autoApplyMode = true;
  showTailorModal(job, true);

  const formData = new FormData();
  formData.append('resume', currentResume);
  formData.append('jobDescriptionUrl', job.url);
  formData.append('enableWebSearch', 'true');
  formData.append('generateCoverLetter', 'true');
  formData.append('jobTitle', job.title);
  formData.append('companyName', job.company);

  try {
    await fetch('/api/tailor', { method: 'POST', body: formData });
  } catch (error) {
    document.getElementById('tailorProgress').innerHTML +=
      `<div class="text-red-600">Error: ${error.message}</div>`;
  }
}

// Batch Auto Apply — queues all saved jobs
function startBatchAutoApply() {
  if (!currentResume) {
    alert('Please upload your resume first');
    showUploadModal();
    return;
  }

  if (savedJobs.length === 0) return;

  const unapplied = savedJobs.filter(j => !applications.some(a => a.jobId === j.id));
  if (unapplied.length === 0) {
    alert('All saved jobs have already been applied to!');
    return;
  }

  autoApplyQueue = [...unapplied];
  queueIndex = 0;
  queueProcessing = true;
  processNextQueueItem();
}

function processNextQueueItem() {
  if (queueIndex >= autoApplyQueue.length) {
    queueProcessing = false;
    updateQueueStatus();
    document.getElementById('tailorProgress').innerHTML +=
      `<div class="text-green-600 font-bold">✅ All ${autoApplyQueue.length} jobs processed!</div>`;
    return;
  }

  const job = autoApplyQueue[queueIndex];
  updateQueueStatus();

  currentTailoringJob = job;
  autoApplyMode = true;

  document.getElementById('tailorProgress').innerHTML = `
    <div class="text-blue-600">Starting auto apply for: ${job.title} at ${job.company}...</div>
  `;
  document.getElementById('tailorResult').classList.add('hidden');

  const formData = new FormData();
  formData.append('resume', currentResume);
  formData.append('jobDescriptionUrl', job.url);
  formData.append('enableWebSearch', 'true');
  formData.append('generateCoverLetter', 'true');
  formData.append('jobTitle', job.title);
  formData.append('companyName', job.company);

  fetch('/api/tailor', { method: 'POST', body: formData }).catch(error => {
    document.getElementById('tailorProgress').innerHTML +=
      `<div class="text-red-600">Error: ${error.message}</div>`;
  });
}

function updateQueueStatus() {
  const queueStatus = document.getElementById('queueStatus');
  const queueStatusText = document.getElementById('queueStatusText');

  if (queueProcessing && autoApplyQueue.length > 0) {
    queueStatus.classList.remove('hidden');
    const remaining = autoApplyQueue.length - queueIndex;
    queueStatusText.textContent = `Queue: Job ${queueIndex + 1} of ${autoApplyQueue.length} — ${remaining} remaining`;
  } else {
    queueStatus.classList.add('hidden');
  }
}

function showTailorModal(job, isAutoApply) {
  document.getElementById('tailorModal').classList.remove('hidden');
  document.getElementById('tailorModalTitle').textContent = isAutoApply
    ? `Auto Applying: ${job.title}`
    : 'Tailoring Resume';

  const badge = document.getElementById('autoApplyBadge');
  if (isAutoApply) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  document.getElementById('tailorProgress').innerHTML = `
    <div class="text-blue-600">Starting for: ${job.title} at ${job.company}...</div>
  `;
  document.getElementById('tailorResult').classList.add('hidden');
  document.getElementById('openJobBtn').classList.add('hidden');
  document.getElementById('downloadCoverLetterBtn').classList.add('hidden');
  document.getElementById('nextQueueBtn').classList.add('hidden');

  updateQueueStatus();
}

function hideTailorModal() {
  document.getElementById('tailorModal').classList.add('hidden');
  // If cancelling during queue, stop queue
  queueProcessing = false;
}

function showTailorComplete(result) {
  const job = currentTailoringJob;

  if (result.files && result.files.resume) {
    document.getElementById('tailorResult').classList.remove('hidden');

    const downloadBtn = document.getElementById('downloadTailoredBtn');
    downloadBtn.onclick = () => { window.location.href = result.files.resume; };

    // Show cover letter button if available
    if (result.files.coverLetter) {
      currentCoverLetterContent = result.coverLetterContent || '';
      const clBtn = document.getElementById('downloadCoverLetterBtn');
      clBtn.classList.remove('hidden');
      clBtn.onclick = () => showCoverLetterModal(result.files.coverLetter, result.coverLetterContent);
    }

    // Show open job button in auto-apply mode
    if (autoApplyMode && job) {
      const openBtn = document.getElementById('openJobBtn');
      openBtn.classList.remove('hidden');
      openBtn.onclick = () => window.open(job.url, '_blank');
    }

    // Track application
    if (job) {
      // Remove any existing application for this job to avoid duplicates
      const existingIdx = applications.findIndex(a => a.jobId === job.id);
      if (existingIdx >= 0) applications.splice(existingIdx, 1);

      applications.push({
        id: `app-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        date: new Date().toLocaleDateString(),
        status: autoApplyMode ? 'applied' : 'tailored',
        autoApplied: autoApplyMode,
        resumeUrl: result.files.resume,
        coverLetterUrl: result.files.coverLetter || null
      });
      localStorage.setItem('applications', JSON.stringify(applications));
      renderSearchResults();
      renderSavedJobs();
    }

    // Auto-open job URL in auto-apply mode (single job)
    if (autoApplyMode && !queueProcessing && job) {
      setTimeout(() => window.open(job.url, '_blank'), 800);
    }

    // Queue mode: show "Next Job" button
    if (queueProcessing) {
      const nextBtn = document.getElementById('nextQueueBtn');
      const nextJob = autoApplyQueue[queueIndex + 1];
      nextBtn.classList.remove('hidden');
      nextBtn.textContent = nextJob
        ? `Continue to Next: ${nextJob.title} at ${nextJob.company}`
        : 'Finish Queue';
      nextBtn.onclick = () => {
        queueIndex++;
        processNextQueueItem();
      };
    }
  }
}

// Cover Letter Modal
function showCoverLetterModal(url, content) {
  document.getElementById('coverLetterModal').classList.remove('hidden');
  document.getElementById('coverLetterContent').textContent = content || 'Cover letter not available.';
  document.getElementById('coverLetterDownloadLink').href = url;
}

function hideCoverLetterModal() {
  document.getElementById('coverLetterModal').classList.add('hidden');
}

function copyCoverLetter() {
  const content = document.getElementById('coverLetterContent').textContent;
  navigator.clipboard.writeText(content).then(() => {
    const btn = document.querySelector('#coverLetterModal button[onclick="copyCoverLetter()"]');
    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy'; }, 2000);
  });
}

// Initialize
renderSavedJobs();
renderApplications();
