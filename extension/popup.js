const USER_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/User/login'; 
const JOB_API_ENDPOINT = 'https://api.joblog.athulthampan.com/api/JobApplication';

async function checkAuthAndRender() {
    const result = await chrome.storage.local.get('jwtToken');
    const isLoggedIn = !!result.jwtToken;

    document.getElementById('loginContainer').classList.toggle('hidden', isLoggedIn);
    document.getElementById('jobAddContainer').classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn) {
        document.getElementById('statusMessage').textContent = 'Ready to scrape.';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginStatus = document.getElementById('loginStatus');
    const loginBtn = document.getElementById('loginBtn');

    loginStatus.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging In...';

    if (!email || !password) {
        loginStatus.textContent = "Please enter both email and password.";
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
        return;
    }

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
                loginStatus.textContent = 'Login successful!';
                loginStatus.style.color = 'green';
                checkAuthAndRender();
            } else {
                loginStatus.textContent = 'Login failed. Server did not return a token. (Check C# API)';
            }
        } else {
            loginStatus.textContent = data.message || 'Login failed: Invalid email or password.';
        }
    } catch (error) {
        loginStatus.textContent = 'Network Error: Could not reach JobLog API.';
        console.error('Login fetch error:', error);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
    }
}

async function handleLogout() {
    await chrome.storage.local.remove('jwtToken');
    document.getElementById('loginStatus').textContent = 'Logged out.';
    document.getElementById('loginStatus').style.color = 'black';
    checkAuthAndRender();
}

async function sendToBackend(jobData) {
    const statusMessage = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');

    submitBtn.disabled = true;

    const result = await chrome.storage.local.get('jwtToken');
    const jwtToken = result.jwtToken;

    if (!jwtToken) {
        statusMessage.textContent = 'Error: Not logged in. Please log in first.';
        submitBtn.disabled = false;
        return;
    }

    try {
        const payload = {
            company: jobData.companyName,
            role: jobData.jobTitle,
            jobPostingUrl: jobData.jobURL,
            status: 'Applied', 
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
            statusMessage.style.color = 'green';
            statusMessage.textContent = `SUCCESS: '${jobData.jobTitle}' added!`;
            document.getElementById('jobFormContainer').classList.add('hidden');
            document.getElementById('initiateBtn').disabled = false;
        } else if (response.status === 401) {
            statusMessage.style.color = 'red';
            statusMessage.textContent = 'Error: Unauthorized. Token expired/invalid.';
            handleLogout();
        } else {
            const errorBody = await response.json().catch(() => ({ message: 'Server error.' }));
            statusMessage.style.color = 'red';
            statusMessage.textContent = `API Error (${response.status}): ${errorBody.message.substring(0, 50)}...`;
        }
    } catch (error) {
        statusMessage.style.color = 'red';
        statusMessage.textContent = `Network Error: Could not reach JobLog API.`;
    } finally {
        submitBtn.disabled = false;
    }
}

function contentScriptFunction() {

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

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRender(); 
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.getElementById('initiateBtn').addEventListener('click', () => {
        const statusMessage = document.getElementById('statusMessage');
        const initiateBtn = document.getElementById('initiateBtn');

        statusMessage.textContent = 'Searching for job details...';
        initiateBtn.disabled = true;
        document.getElementById('jobFormContainer').classList.add('hidden');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                statusMessage.textContent = 'Error: No active tab found.';
                initiateBtn.disabled = false;
                return;
            }
            const activeTab = tabs[0];
            
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: contentScriptFunction
            }, (results) => {
                initiateBtn.disabled = false; 

                if (chrome.runtime.lastError) {
                    statusMessage.textContent = `Script Error: ${chrome.runtime.lastError.message}`;
                    return;
                }
                
                const jobData = results[0].result;
                
                if (jobData && jobData.jobTitle) {
                    statusMessage.textContent = `Data extracted. Review and click 'Save'.`;
                    
                    document.getElementById('company').value = jobData.companyName || '';
                    document.getElementById('role').value = jobData.jobTitle || '';
                    document.getElementById('link').value = jobData.jobURL || '';
                    
                    document.getElementById('jobFormContainer').classList.remove('hidden');
                    
                } else {
                    statusMessage.textContent = 'No job details found on this page. Please enter manually.';
                    document.getElementById('jobFormContainer').classList.remove('hidden'); 
                }
            });
        });
    });

    document.getElementById('jobForm').addEventListener('submit', (event) => {
        event.preventDefault(); 
        document.getElementById('statusMessage').textContent = 'Saving data to JobLog...';
        
        const finalJobData = {
            companyName: document.getElementById('company').value,
            jobTitle: document.getElementById('role').value,
            jobURL: document.getElementById('link').value
        };

        sendToBackend(finalJobData);
    });
});