const USER_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/User/login'; 
const JOB_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/JobApplication';

// Theme Toggle Logic

// Initializes the theme from localStorage/system
function initializeTheme() {
    const body = document.body;
    const storedTheme = localStorage.getItem('joblog-theme');
    
    let initialTheme;
    if (storedTheme) {
        initialTheme = storedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        initialTheme = 'light';
    } else {
        initialTheme = 'dark';
    }

    setTheme(initialTheme);
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

// Helper function to set status
function setStatusAlert(element, type, message) {
    element.textContent = message;
    element.classList.remove('hidden', 'alert-error', 'alert-success', 'alert-info');
    element.classList.add('alert', `alert-${type}`);
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

function scheduleWakingUpMessage(element) {
    return setTimeout(() => setStatusAlert(element, 'info', 'Waking up the server...'), 3500);
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
    
    loginStatus.classList.add('hidden'); 

    if (isLoggedIn) {
        setStatusAlert(statusMessage, 'info', 'Ready to add.');
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
                setStatusAlert(loginStatus, 'success', 'Login successful!');
                await checkAuthAndRender();
                await scrapeAndFillForm();
            } else {
                setStatusAlert(loginStatus, 'error', 'Login failed. Server did not return a token. (Check C# API)');
            }
        } else {
            setStatusAlert(loginStatus, 'error', data.message || 'Login failed: Invalid email or password.');
        }
    } catch (error) {
        setStatusAlert(loginStatus, 'error', 'Could not reach JobLog. The server may still be starting up.');
        console.error('Login fetch error:', error);
    } finally {
        clearTimeout(cancelWakingUp);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
    }
}

// Function to handle log out
async function handleLogout() {
    await chrome.storage.local.remove('jwtToken');
    const loginStatus = document.getElementById('loginStatus');
    setStatusAlert(loginStatus, 'info', 'Logged out.');
    checkAuthAndRender();
}

// Function to prepare and send data to backend
async function sendToBackend(jobData) {
    const statusMessage = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');
    const initiateBtn = document.getElementById('initiateBtn');
    const jobFormContainer = document.getElementById('jobFormContainer');
    const finalStatus = 'Applied';

    submitBtn.disabled = true;

    const cancelWakingUp = scheduleWakingUpMessage(statusMessage);

    const result = await chrome.storage.local.get('jwtToken');
    const jwtToken = result.jwtToken;

    if (!jwtToken) {
        clearTimeout(cancelWakingUp);
        setStatusAlert(statusMessage, 'error', 'Error: Not logged in. Please log in first.');
        submitBtn.disabled = false;
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

        if (response.ok) {
            setStatusAlert(statusMessage, 'success', `SUCCESS: Job '${jobData.jobTitle}' added!`);
            
            jobFormContainer.classList.add('hidden');
            initiateBtn.classList.add('hidden');
            
            submitBtn.disabled = false; 

            setTimeout(() => {
                window.close(); 
            }, 1500);
            
        } else if (response.status === 401) {
            setStatusAlert(statusMessage, 'error', 'Error: Unauthorized. Token expired/invalid.');
            handleLogout();
        } else {
            const errorBody = await response.json().catch(() => ({ message: 'Server error.' }));
            setStatusAlert(statusMessage, 'error', `API Error (${response.status}): ${errorBody.message.substring(0, 50)}...`);
        }
    } catch (error) {
        setStatusAlert(statusMessage, 'error', 'Could not reach JobLog. The server may still be starting up.');
    } finally {
        clearTimeout(cancelWakingUp);
        if (!statusMessage.classList.contains('alert-success')) {
            submitBtn.disabled = false;
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

                jobData.companyName = name.length <= 1 ? 'Unknown Company' : name;
            } else {
                jobData.companyName = 'Unknown Company';
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
            const titleElement = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span');
            if (titleElement) {
                let title = titleElement.textContent.trim();
                title = title.replace(/\s*[-\(]?\s*job post\s*[\)]?/i, '').trim();
                jobData.jobTitle = title;
            }

            const companyElement = document.querySelector('[data-testid="inlineHeader-companyName"] a');
            if (companyElement) {
                let name = companyElement.textContent.trim();
                const parentSpan = companyElement.closest('span');
                if (parentSpan) {
                    name = parentSpan.textContent.trim();
                    name = name.replace(/View all jobs/i, '').trim();
                }
                jobData.companyName = name;
            } else {
                const companySpan = document.querySelector('[data-testid="inlineHeader-companyName"] span');
                if (companySpan) {
                    jobData.companyName = companySpan.textContent.trim();
                }
            }

            const locationElement = document.querySelector('[data-testid="inlineHeader-companyLocation"]');
            if (locationElement) {
                jobData.location = locationElement.textContent.trim();
            }
        } catch (e) {
            console.error("Indeed scraping failed:", e);
        }
        return jobData;
    }

    function scrapeGeneric(jobData) {
        jobData.jobTitle = document.title.split('|')[0].trim() || 'Unknown Job Title';

        if (!jobData.companyName) {
            const match = document.title.match(/ at (.*?) \|/);
            jobData.companyName = match ? match[1].trim() : 'Unknown Company';
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
    setStatusAlert(statusMessage, 'info', 'Searching for job details...');
    document.getElementById('jobFormContainer').classList.add('hidden');

    try {
        const jobData = await scrapeActiveTabJob();

        if (jobData && jobData.jobTitle && jobData.jobTitle !== 'Unknown Job Title') {
            fillFormFromJobData(jobData);
            setStatusAlert(statusMessage, 'info', 'Review the details, then save (Cmd/Ctrl+Shift+J).');
        } else {
            setStatusAlert(statusMessage, 'error', 'No job details found on this page. Please enter manually.');
            document.getElementById('jobFormContainer').classList.remove('hidden');
        }
    } catch (error) {
        setStatusAlert(statusMessage, 'error', error instanceof Error ? error.message : 'Unexpected error occurred.');
        console.error(error);
    }
}

function submitJobForm() {
    const statusMessage = document.getElementById('statusMessage');
    const jobFormContainer = document.getElementById('jobFormContainer');
    const submitBtn = document.getElementById('submitBtn');

    if (jobFormContainer.classList.contains('hidden')) {
        setStatusAlert(statusMessage, 'error', 'Scrape a job first (Cmd/Ctrl+J).');
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
        setInputError('roleError', 'Role/Title is required.');
        hasError = true;
    }

    if (hasError) {
        setStatusAlert(statusMessage, 'error', 'Please correct the highlighted errors.');
        return;
    }

    setStatusAlert(statusMessage, 'info', 'Saving data to JobLog...');

    sendToBackend({
        companyName: company,
        jobTitle: role,
        jobURL: link,
        notes: notes,
    });
}

// Main Event Listener
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRender();

    const { jwtToken } = await chrome.storage.local.get('jwtToken');
    if (jwtToken) {
        await scrapeAndFillForm();
    }

    document.addEventListener('keydown', (event) => {
        const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'j';
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
    document.getElementById('header-logout-btn').addEventListener('click', handleLogout);

    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');

    passwordToggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
            passwordToggleBtn.title = "Hide Password";
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
            passwordToggleBtn.title = "Show Password";
        }
    });

    document.getElementById('initiateBtn').addEventListener('click', scrapeAndFillForm);

    document.getElementById('jobForm').addEventListener('submit', (event) => {
        event.preventDefault();
        submitJobForm();
    });
});