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
        setInputError('linkError', '');
        document.getElementById('statusMessage').classList.add('hidden');
    }
}

// Helper regex for email check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
                checkAuthAndRender();
            } else {
                setStatusAlert(loginStatus, 'error', 'Login failed. Server did not return a token. (Check C# API)');
            }
        } else {
            setStatusAlert(loginStatus, 'error', data.message || 'Login failed: Invalid email or password.');
        }
    } catch (error) {
        setStatusAlert(loginStatus, 'error', 'Network Error: Could not reach JobLog API.');
        console.error('Login fetch error:', error);
    } finally {
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

    const result = await chrome.storage.local.get('jwtToken');
    const jwtToken = result.jwtToken;

    if (!jwtToken) {
        setStatusAlert(statusMessage, 'error', 'Error: Not logged in. Please log in first.');
        submitBtn.disabled = false;
        return;
    }

    try {
        const payload = {
            company: jobData.companyName,
            role: jobData.jobTitle,
            jobPostingUrl: jobData.jobURL,
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
            // Hide all job interaction elements, only show the success message.
            setStatusAlert(statusMessage, 'success', `SUCCESS: Job '${jobData.jobTitle}' added!`);
            
            jobFormContainer.classList.add('hidden');
            initiateBtn.classList.add('hidden');
            
            // Re-enable the submit button for the next time the form is used
            submitBtn.disabled = false; 

            // Automatically close the window after a delay
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
        setStatusAlert(statusMessage, 'error', `Network Error: Could not reach JobLog API.`);
    } finally {
        // Only re-enable the submit button on failure
        if (!statusMessage.classList.contains('alert-success')) {
            submitBtn.disabled = false;
        }
    }
}

function contentScriptFunction() {

    // Scraper Functions
    
    // Scraper function for LinkedIn
    function scrapeLinkedIn(jobData) {
        try {
            const titleContainer = document.querySelector('div.job-details-jobs-unified-top-card__job-title');
            if (titleContainer) {
                const h1 = titleContainer.querySelector('h1.t-24.t-bold.inline');
                if (h1) {
                    jobData.jobTitle = h1.textContent.trim();
                }
            }
            
            const companyContainer = document.querySelector('div.job-details-jobs-unified-top-card__company-name');
            if (companyContainer) {
                const companyLink = companyContainer.querySelector('a');
                if (companyLink) {
                    jobData.companyName = companyLink.textContent.trim().replace(/\s+/g, ' '); 
                }
            }

            if (!jobData.jobTitle) {
                const altTitleElement = document.querySelector('h2.top-card-layout__title');
                if (altTitleElement) {
                    jobData.jobTitle = altTitleElement.textContent.trim();
                }
            }
            if (!jobData.companyName) {
                const altCompanyElement = document.querySelector('a.topcard__flavor--link');
                if (altCompanyElement) {
                    jobData.companyName = altCompanyElement.textContent.trim();
                }
            }

        } catch (e) {
            console.error("LinkedIn scraping failed:", e);
        }
        return jobData;
    }

    // Scraper function for SEEK
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
                let name = '';
                name = companyElement.textContent;
                
                if (name) {
                    name = name.trim();
                    
                    name = name.replace(/\s\(\w{3}\)$/i, '').trim(); 
                    name = name.replace(/Verified$/i, '').trim(); 
                }
                
                if (name.length <= 1) {
                    jobData.companyName = 'Unknown Company';
                } else {
                    jobData.companyName = name;
                }
            } else {
                 jobData.companyName = 'Unknown Company';
            }

        } catch (e) {
            console.error("Seek scraping failed:", e);
        }
        return jobData;
    }

    // Scraper function for Indeed
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
        } catch (e) {
            console.error("Indeed scraping failed:", e);
        }
        return jobData;
    }

    // Generic Fallback
    function scrapeGeneric(jobData) {
        jobData.jobTitle = document.title.split('|')[0].trim() || 'Unknown Job Title';
        
        if (!jobData.companyName) {
            const match = document.title.match(/ at (.*?) \|/); 
            jobData.companyName = match ? match[1].trim() : 'Unknown Company';
        }
        return jobData;
    }
    
    const jobURL = window.location.href;
    const hostname = window.location.hostname;

    let jobData = {
        jobTitle: null,
        companyName: null,
        jobURL: jobURL,
    };

    if (hostname.includes('linkedin.com')) {
        jobData = scrapeLinkedIn(jobData);
    } else if (hostname.includes('seek.com.au')) {
        jobData = scrapeSeek(jobData);
    } else if (hostname.includes('indeed.com')) {
        jobData = scrapeIndeed(jobData);
    } else {
        jobData = scrapeGeneric(jobData);
    }
    
    jobData.jobURL = jobURL;

    return jobData;
}


// Main Event Listener
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRender(); 
    
    // Theme Toggle Listener
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Login Form Listener
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout Button Listener
    document.getElementById('header-logout-btn').addEventListener('click', handleLogout);

    // Password Toggle Listener
    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');

    passwordToggleBtn.addEventListener('click', () => {
        // Toggle the input type and icon
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

    // Initiate Scrape Button Listener
    document.getElementById('initiateBtn').addEventListener('click', () => {
        const statusMessage = document.getElementById('statusMessage');
        const initiateBtn = document.getElementById('initiateBtn');

        setStatusAlert(statusMessage, 'info', 'Searching for job details...');
        
        document.getElementById('jobFormContainer').classList.add('hidden');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                setStatusAlert(statusMessage, 'error', 'Error: No active tab found.');
                return;
            }
            const activeTab = tabs[0];
            
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: contentScriptFunction
            }, (results) => {
                if (chrome.runtime.lastError) {
                    setStatusAlert(statusMessage, 'error', `Error: ${chrome.runtime.lastError.message}`);
                    return;
                }
                
                const jobData = results[0].result;
                
                if (jobData && jobData.jobTitle) {
                    setStatusAlert(statusMessage, 'info', `Data extracted. Review and click 'Save'.`);
                    
                    document.getElementById('company').value = jobData.companyName || '';
                    document.getElementById('role').value = jobData.jobTitle || '';
                    document.getElementById('link').value = jobData.jobURL || '';
                    
                    document.getElementById('jobFormContainer').classList.remove('hidden');
                    
                } else {
                    setStatusAlert(statusMessage, 'error', 'No job details found on this page. Please enter manually.');
                    document.getElementById('jobFormContainer').classList.remove('hidden');
                }
            });
        });
    });

    // Job Form Submission Listener
    document.getElementById('jobForm').addEventListener('submit', (event) => {
        event.preventDefault(); 
        const statusMessage = document.getElementById('statusMessage');

        clearAllFormErrors('job'); 

        const company = document.getElementById('company').value.trim();
        const role = document.getElementById('role').value.trim();
        const link = document.getElementById('link').value.trim();

        let hasError = false;
        if (!company) {
            setInputError('companyError', "Company name is required.");
            hasError = true;
        }
        if (!role) {
            setInputError('roleError', "Role/Title is required.");
            hasError = true;
        }
        if (!link) {
            setInputError('linkError', "Job URL is required.");
            hasError = true;
        }

        if (hasError) {
            setStatusAlert(statusMessage, 'error', 'Please correct the highlighted errors.');
            return;
        }

        setStatusAlert(statusMessage, 'info', 'Saving data to JobLog...');
        
        const finalJobData = {
            companyName: company,
            jobTitle: role,
            jobURL: link
        };

        sendToBackend(finalJobData);
    });
});