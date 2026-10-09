const USER_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/User/login'; 
const JOB_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/JobApplication';
const HEALTH_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/health';

// Theme Toggle Logic

// Initializes the theme from localStorage, defaulting to dark like the web app
function initializeTheme() {
    setTheme(localStorage.getItem('joblog-theme') || 'dark');
}

// Sets the theme
function setTheme(theme) {
    const body = document.body;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (theme === 'light') {
        body.classList.add('light');
        body.classList.remove('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        body.classList.add('dark');
        body.classList.remove('light');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }
    localStorage.setItem('joblog-theme', theme);
}

// Toggles the theme between light and dark.
function toggleTheme() {
    const currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

initializeTheme();

// Helper Functions

// Helper function to set a status line (type: info, error or success)
function setStatusAlert(element, type, message) {
    element.textContent = message;
    element.classList.remove('hidden', 'status-error', 'status-success');
    if (type !== 'info') {
        element.classList.add(`status-${type}`);
    }
}

// Helper function to show/hide validation errors
function setInputError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (message) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    } else {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
    }
}

// Helper to clear all errors in a form
function clearAllFormErrors(formType) {
    if (formType === 'login') {
        setInputError('emailError', '');
        setInputError('passwordError', '');
        document.getElementById('loginStatus').classList.add('hidden');
    } else if (formType === 'job') {
        setInputError('companyError', '');
        setInputError('roleError', '');
        document.getElementById('statusMessage').classList.add('hidden');
    }
}

// Helper regex for email check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Saves a renewed token if the backend extended the session
async function storeRefreshedToken(response) {
    const refreshedToken = response.headers.get('X-Refreshed-Token');
    if (refreshedToken) {
        await chrome.storage.local.set({ jwtToken: refreshedToken });
    }
}

// Fire-and-forget ping so the backend starts waking up while the user reviews the form.
// Sends the stored token too, so simply opening the popup keeps the session alive.
async function warmUpBackend() {
    try {
        const { jwtToken } = await chrome.storage.local.get('jwtToken');
        const response = await fetch(HEALTH_API_ENDPOINT, {
            headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}
        });
        await storeRefreshedToken(response);
    } catch (error) {
        // Ignore: this request only exists to wake the server
    }
}

function scheduleWakingUpMessage(element) {
    return setTimeout(() => setStatusAlert(element, 'info', 'Waking up the server, this can take a few seconds...'), 3500);
}

// Function to check authorisation and render adding data
async function checkAuthAndRender() {
    const result = await chrome.storage.local.get('jwtToken');
    const isLoggedIn = !!result.jwtToken;
    const statusMessage = document.getElementById('statusMessage');
    const loginStatus = document.getElementById('loginStatus');
    const headerLogoutBtn = document.getElementById('header-logout-btn'); 

    document.getElementById('loginContainer').classList.toggle('hidden', isLoggedIn);
    document.getElementById('jobAddContainer').classList.toggle('hidden', !isLoggedIn);
    
    headerLogoutBtn.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        loginStatus.classList.add('hidden');
        statusMessage.textContent = '';
    }
}

// Function to handle login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginStatus = document.getElementById('loginStatus');
    const loginBtn = document.getElementById('loginBtn');

    clearAllFormErrors('login');

    let hasError = false;
    if (!email) {
        setInputError('emailError', "Email is required.");
        hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
        setInputError('emailError', "Please enter a valid email address.");
        hasError = true;
    }
    if (!password) {
        setInputError('passwordError', "Password is required.");
        hasError = true;
    }

    if (hasError) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
        return;
    }

    loginStatus.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging In...';

    const cancelWakingUp = scheduleWakingUpMessage(loginStatus);

    try {
        const response = await fetch(USER_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                await chrome.storage.local.set({ jwtToken: data.token });
                await checkAuthAndRender();
                await scrapeAndFillForm();
            } else {
                setStatusAlert(loginStatus, 'error', 'Something went wrong while logging in. Please try again.');
            }
        } else {
            setStatusAlert(loginStatus, 'error', data.message || 'Invalid email or password.');
        }
    } catch (error) {
        setStatusAlert(loginStatus, 'error', "Couldn't reach JobLog. Please try again in a moment.");
        console.error('Login fetch error:', error);
    } finally {
        clearTimeout(cancelWakingUp);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
    }
}

// Function to handle log out
async function handleLogout(message = "You've been logged out.") {
    await chrome.storage.local.remove('jwtToken');
    await checkAuthAndRender();
    setStatusAlert(document.getElementById('loginStatus'), 'info', message);
}

// Function to prepare and send data to backend
async function sendToBackend(jobData) {
    const statusMessage = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');
    const jobFormContainer = document.getElementById('jobFormContainer');
    const finalStatus = 'Applied';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const cancelWakingUp = scheduleWakingUpMessage(statusMessage);

    const result = await chrome.storage.local.get('jwtToken');
    const jwtToken = result.jwtToken;

    if (!jwtToken) {
        clearTimeout(cancelWakingUp);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Application';
        handleLogout('Please log in first.');
        return;
    }

    try {
        const payload = {
            company: jobData.companyName,
            role: jobData.jobTitle,
            jobPostingUrl: jobData.jobURL,
            notes: jobData.notes || '',
            status: finalStatus, 
            dateApplied: new Date().toISOString().substring(0, 10) 
        };
        
        const response = await fetch(JOB_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}` 
            },
            body: JSON.stringify(payload)
        });

        await storeRefreshedToken(response);

        if (response.ok) {
            setStatusAlert(statusMessage, 'success', `Saved ${jobData.jobTitle} at ${jobData.companyName} to JobLog.`);
            jobFormContainer.classList.add('hidden');
            document.getElementById('rescanBtn').classList.add('hidden');

            setTimeout(() => {
                window.close();
            }, 1500);

        } else if (response.status === 401) {
            handleLogout('Your session has expired. Please log in again.');
        } else {
            const errorBody = await response.json().catch(() => ({}));
            setStatusAlert(statusMessage, 'error', errorBody.message || "Couldn't save the application. Please try again.");
        }
    } catch (error) {
        setStatusAlert(statusMessage, 'error', "Couldn't reach JobLog. Please try again in a moment.");
    } finally {
        clearTimeout(cancelWakingUp);
        if (!statusMessage.classList.contains('status-success')) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Application';
        }
    }
}

async function scrapeJobFromPage() {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    function scrapeLinkedIn(jobData) {
        try {
            const panel = document.querySelector('.job-view-layout, .jobs-search__job-details--container') || document;

            const titleEl = panel.querySelector('h1 a, h1, h2.top-card-layout__title, .job-details-jobs-unified-top-card__job-title');
            if (titleEl) {
                jobData.jobTitle = titleEl.textContent.trim();
            }

            for (const el of panel.querySelectorAll('[aria-label^="Company, "]')) {
                if (el.tagName !== 'svg') {
                    jobData.companyName = el.getAttribute('aria-label').replace(/^Company,\s*/, '').replace(/\.$/, '').trim();
                    break;
                }
            }

            if (!jobData.companyName) {
                const companySelectors = [
                    '.job-details-jobs-unified-top-card__company-name a',
                    '.job-details-jobs-unified-top-card__company-name',
                    '.job-details-jobs-unified-top-card__primary-description a.app-aware-link',
                    '.job-details-jobs-unified-top-card__subtitle-primary-grouping a.app-aware-link',
                    'a.topcard__flavor--link',
                    'a.topcard__org-name-link',
                    '.job-details-jobs-unified-top-card a[href*="/company/"]'
                ];
                for (const selector of companySelectors) {
                    const el = panel.querySelector(selector);
                    if (el && el.textContent.trim()) {
                        const text = el.textContent.replace(/\s+/g, ' ').trim();
                        if (text && !['Save', 'Apply'].includes(text)) {
                            jobData.companyName = text;
                            break;
                        }
                    }
                }
            }

            const locationSelectors = [
                '.job-details-jobs-unified-top-card__primary-description span:nth-of-type(2)',
                '.job-details-jobs-unified-top-card__subtitle-primary-grouping span:nth-of-type(2)',
                '.topcard__flavor--bullet:nth-of-type(2)',
                'span.job-details-jobs-unified-top-card__bullet'
            ];
            for (const selector of locationSelectors) {
                const el = panel.querySelector(selector);
                if (el && el.textContent.trim() && !el.textContent.includes('·')) {
                    jobData.location = el.textContent.trim();
                    break;
                }
            }

            if (!jobData.companyName || !jobData.jobTitle) {
                const docTitle = document.title.replace(/^\(\d+\)\s*/, '');

                if (!docTitle.toLowerCase().includes(' jobs ')) {
                    const matchAt = docTitle.match(/(.*?)\s+at\s+(.*?)(?:\s+|\|)/i);
                    const matchHiring = docTitle.match(/(.*?)\s+hiring\s+(.*?)\s+in\s+/i);

                    if (matchAt) {
                        jobData.jobTitle = jobData.jobTitle || matchAt[1].trim();
                        jobData.companyName = jobData.companyName || matchAt[2].trim();
                    } else if (matchHiring) {
                        jobData.companyName = jobData.companyName || matchHiring[1].trim();
                        jobData.jobTitle = jobData.jobTitle || matchHiring[2].trim();
                    } else {
                        const parts = docTitle.split('|').map(p => p.trim());
                        if (parts.length >= 2) {
                            jobData.jobTitle = jobData.jobTitle || parts[0];
                            jobData.companyName = jobData.companyName || parts[1];
                        }
                    }
                }
            }
        } catch (e) {
            console.error("LinkedIn scraping failed:", e);
        }
        return jobData;
    }

    function scrapeSeek(jobData) {
        try {
            let titleElement = document.querySelector('[data-automation="job-detail-title"]');
            let companyElement = document.querySelector('[data-automation="advertiser-name"]');

            if (!titleElement || !companyElement) {
                titleElement = document.querySelector('h3._1dyjaus0');
                if (titleElement) {
                    companyElement = titleElement.nextElementSibling;
                }
            }

            if (titleElement) {
                jobData.jobTitle = titleElement.innerText.trim();
            }

            if (companyElement && companyElement.tagName === 'SPAN') {
                let name = companyElement.textContent;
                if (name) {
                    name = name.trim();
                    name = name.replace(/\s\(\w{3}\)$/i, '').trim();
                    name = name.replace(/Verified$/i, '').trim();
                }

                jobData.companyName = name.length <= 1 ? null : name;
            }

            const locationElement = document.querySelector('[data-automation="job-detail-location"]');
            if (locationElement) {
                jobData.location = locationElement.textContent.trim();
            }
        } catch (e) {
            console.error("Seek scraping failed:", e);
        }
        return jobData;
    }

    function scrapeIndeed(jobData) {
        try {
            const clean = (text) => text?.replace(/\s+/g, ' ').trim() || null;
            const header = document.querySelector('[data-testid="desktop-job-header"]');

            if (header) {
                // Current layout (both split-pane and standalone job pages)
                jobData.jobTitle = clean(header.querySelector('[data-testid="vj-job-title"]')?.textContent);

                const metadata = header.querySelector('[data-testid="company-info-metadata"]');
                const companyLink = metadata?.querySelector('a[href*="/cmp/"]') || metadata?.querySelector('a');
                if (companyLink) {
                    jobData.companyName = clean(companyLink.textContent)
                        || clean(companyLink.getAttribute('aria-label')?.replace(/\s*\(opens in a new tab\)\s*$/i, ''));
                }

                // Location is the first visible text in the metadata that isn't the company, a separator or the rating
                for (const el of metadata?.querySelectorAll('div[dir="ltr"]') || []) {
                    const text = clean(el.textContent);
                    if (!text || el.closest('a') || el.closest('[aria-hidden="true"]')) continue;
                    if (/stars/i.test(el.getAttribute('aria-label') || '') || /^[·•\-\d.\s]+$/.test(text)) continue;
                    jobData.location = text;
                    break;
                }
            } else {
                // Legacy layout
                const titleElement = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span, [data-testid="jobsearch-JobInfoHeader-title"]');
                if (titleElement) {
                    jobData.jobTitle = clean(titleElement.textContent.replace(/\s*[-\(]?\s*job post\s*[\)]?/i, ''));
                }

                const companyElement = document.querySelector('[data-testid="inlineHeader-companyName"] a, [data-testid="inlineHeader-companyName"] span');
                if (companyElement) {
                    jobData.companyName = clean(companyElement.textContent.replace(/View all jobs/i, ''));
                }

                jobData.location = clean(document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent);
            }
        } catch (e) {
            console.error("Indeed scraping failed:", e);
        }
        return jobData;
    }

    function scrapeGeneric(jobData) {
        jobData.jobTitle = document.title.split('|')[0].trim() || null;

        if (!jobData.companyName) {
            const match = document.title.match(/ at (.*?) \|/);
            jobData.companyName = match ? match[1].trim() : null;
        }
        return jobData;
    }

    const hostname = window.location.hostname;
    for (let i = 0; i < 4; i++) {
        let jobData = { jobTitle: null, companyName: null, jobURL: window.location.href, location: null };

        if (hostname.includes('linkedin.com')) jobData = scrapeLinkedIn(jobData);
        else if (hostname.includes('seek.com')) jobData = scrapeSeek(jobData);
        else if (hostname.includes('indeed.com')) jobData = scrapeIndeed(jobData);
        else jobData = scrapeGeneric(jobData);

        if (jobData.jobTitle && jobData.jobTitle !== "") return jobData;

        await delay(250);
    }

    return scrapeGeneric({ jobTitle: null, companyName: null, jobURL: window.location.href, location: null });
}

async function scrapeActiveTabJob() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) {
        throw new Error('No active tab found.');
    }

    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: scrapeJobFromPage,
    });

    return result;
}

function fillFormFromJobData(jobData) {
    document.getElementById('company').value = jobData.companyName || '';
    document.getElementById('role').value = jobData.jobTitle || '';
    document.getElementById('link').value = jobData.jobURL || '';
    document.getElementById('notes').value = jobData.location || '';
    document.getElementById('jobFormContainer').classList.remove('hidden');
}

async function scrapeAndFillForm() {
    const statusMessage = document.getElementById('statusMessage');
    setStatusAlert(statusMessage, 'info', 'Reading the job page...');
    document.getElementById('jobFormContainer').classList.add('hidden');

    try {
        const jobData = await scrapeActiveTabJob();

        if (jobData && jobData.jobTitle) {
            fillFormFromJobData(jobData);
            setStatusAlert(statusMessage, 'info', 'Check the details, then save.');
        } else {
            setStatusAlert(statusMessage, 'error', "Couldn't find job details on this page. Enter them below.");
            document.getElementById('jobFormContainer').classList.remove('hidden');
        }
    } catch (error) {
        // Chrome pages and the Web Store can't be read by extensions
        setStatusAlert(statusMessage, 'error', "Can't read this page. Open a job posting, or enter the details below.");
        document.getElementById('jobFormContainer').classList.remove('hidden');
        console.error(error);
    }
}


function submitJobForm() {
    const statusMessage = document.getElementById('statusMessage');
    const jobFormContainer = document.getElementById('jobFormContainer');
    const submitBtn = document.getElementById('submitBtn');

    if (jobFormContainer.classList.contains('hidden')) {
        return;
    }

    if (submitBtn.disabled) {
        return;
    }

    clearAllFormErrors('job');

    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const link = document.getElementById('link').value.trim();
    const notes = document.getElementById('notes').value.trim();

    let hasError = false;
    if (!company) {
        setInputError('companyError', 'Company name is required.');
        hasError = true;
    }
    if (!role) {
        setInputError('roleError', 'Role is required.');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    setStatusAlert(statusMessage, 'info', 'Saving to JobLog...');

    sendToBackend({
        companyName: company,
        jobTitle: role,
        jobURL: link,
        notes: notes,
    });
}

// Main Event Listener
document.addEventListener('DOMContentLoaded', async () => {
    warmUpBackend();

    await checkAuthAndRender();

    const { jwtToken } = await chrome.storage.local.get('jwtToken');
    if (jwtToken) {
        await scrapeAndFillForm();
    }

    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd+Enter saves; Ctrl/Cmd+Shift+J still works for anyone used to the old shortcut
        const isModifier = event.metaKey || event.ctrlKey;
        const isSaveShortcut = isModifier && (event.key === 'Enter' || (event.shiftKey && event.key.toLowerCase() === 'j'));
        if (isSaveShortcut) {
            event.preventDefault();
            submitJobForm();
        }
    });

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('header-logout-btn').addEventListener('click', () => handleLogout());

    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');

    passwordToggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
            passwordToggleBtn.title = "Hide password";
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
            passwordToggleBtn.title = "Show password";
        }
    });

    document.getElementById('rescanBtn').addEventListener('click', scrapeAndFillForm);

    document.getElementById('jobForm').addEventListener('submit', (event) => {
        event.preventDefault();
        submitJobForm();
    });
});