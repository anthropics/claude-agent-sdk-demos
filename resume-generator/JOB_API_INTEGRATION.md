# Job API Integration Guide

The dashboard currently uses demo data. To integrate with real job search APIs, follow this guide.

## Recommended Job Search APIs

### 1. **JSearch by RapidAPI** (Recommended)
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
- **Features**: Aggregates Indeed, LinkedIn, Glassdoor, ZipRecruiter
- **Pricing**: Free tier with 1000 requests/month
- **Pros**: Single API for multiple sources

### 2. **Adzuna API**
- **URL**: https://developer.adzuna.com/
- **Features**: Global job search, salary data
- **Pricing**: Free tier available
- **Pros**: Good international coverage

### 3. **LinkedIn Jobs API**
- **URL**: https://learn.microsoft.com/en-us/linkedin/
- **Features**: Direct LinkedIn data
- **Pricing**: Requires LinkedIn partnership
- **Pros**: Most accurate LinkedIn data

### 4. **Indeed API**
- **URL**: https://indeed.com/api
- **Features**: Direct Indeed data
- **Pricing**: Partner program
- **Pros**: Largest job database

## Implementation

### Option 1: JSearch (RapidAPI) - Quick Start

1. **Sign up for RapidAPI**
   ```bash
   # Visit https://rapidapi.com
   # Create free account
   # Subscribe to JSearch API (free tier)
   # Copy your API key
   ```

2. **Install axios** (if not already installed)
   ```bash
   npm install axios
   ```

3. **Update server.ts**

Replace the job search endpoint with:

```typescript
import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'your-key-here';

app.post('/api/search-jobs', async (req, res) => {
  try {
    const { keywords, location, remote, experience, jobType } = req.body;

    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: `${keywords} ${location || ''}`.trim(),
        page: '1',
        num_pages: '1',
        date_posted: 'month',
        remote_jobs_only: remote ? 'true' : 'false',
        employment_types: jobType || '',
        job_requirements: experience || ''
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const jobs = response.data.data.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : 'Remote',
      salary: job.job_salary || 'Not specified',
      type: job.job_employment_type || 'Full-time',
      remote: job.job_is_remote ? 'Remote' : 'On-site',
      url: job.job_apply_link,
      description: job.job_description,
      postedDate: job.job_posted_at_datetime_utc,
      logo: job.employer_logo || '💼'
    }));

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

4. **Set environment variable**
   ```bash
   export RAPIDAPI_KEY="your-api-key-here"
   ```

### Option 2: Adzuna - Free Alternative

```typescript
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

app.post('/api/search-jobs', async (req, res) => {
  try {
    const { keywords, location } = req.body;

    const country = 'us'; // or 'gb', 'de', etc.
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;

    const response = await axios.get(url, {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_API_KEY,
        what: keywords,
        where: location || '',
        results_per_page: 10
      }
    });

    const jobs = response.data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      salary: job.salary_min && job.salary_max
        ? `$${job.salary_min} - $${job.salary_max}`
        : 'Not specified',
      type: job.contract_type || 'Full-time',
      remote: job.location.area[0] === 'Remote' ? 'Remote' : 'On-site',
      url: job.redirect_url,
      description: job.description,
      postedDate: job.created,
      logo: '💼'
    }));

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Option 3: Web Scraping (Advanced)

For sites without APIs, you can use web scraping:

```typescript
import * as cheerio from 'cheerio';

async function scrapeIndeed(keywords: string, location: string) {
  const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const jobs = [];

  $('.job_seen_beacon').each((i, element) => {
    jobs.push({
      id: $(element).attr('data-jk'),
      title: $(element).find('.jobTitle').text().trim(),
      company: $(element).find('.companyName').text().trim(),
      location: $(element).find('.companyLocation').text().trim(),
      url: `https://www.indeed.com/viewjob?jk=${$(element).attr('data-jk')}`,
      description: $(element).find('.job-snippet').text().trim()
    });
  });

  return jobs;
}
```

**Note**: Web scraping may violate Terms of Service. Use official APIs when available.

## Environment Variables

Create a `.env` file:

```bash
# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key

# Adzuna
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key

# LinkedIn (if you have access)
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

Load in server.ts:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();
```

## Testing

1. Start the server with API keys set
2. Open dashboard at http://localhost:3002/dashboard.html
3. Search for "Software Engineer"
4. Verify real job results appear

## Rate Limiting

Add rate limiting to avoid API quota issues:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 20 requests per windowMs
});

app.post('/api/search-jobs', searchLimiter, async (req, res) => {
  // ... search logic
});
```

## Caching

Cache search results to reduce API calls:

```typescript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.post('/api/search-jobs', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  // ... fetch from API

  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  res.json(result);
});
```

## Next Steps

1. Choose an API provider
2. Get API credentials
3. Update server.ts with implementation
4. Test thoroughly
5. Add error handling and fallbacks
6. Monitor API usage and costs

## Support

For issues:
- Check API provider documentation
- Verify API keys are correct
- Check rate limits and quotas
- Review server logs for errors
