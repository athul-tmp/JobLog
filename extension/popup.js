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
            jobpostingurl: jobData.jobURL,
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
            statusMessage.textContent = `SUCCESS: Job '${jobData.jobTitle}' added!`;
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
    let jobTitle = null;
    let companyName = null;
    const jobURL = window.location.href;

    try {
        const titleElement = document.querySelector('div.job-details-jobs-unified-top-card__job-title h1 a');
        if (titleElement) {
            jobTitle = titleElement.innerText.trim();
        }
        
        const companyElement = document.querySelector('div.job-details-jobs-unified-top-card__company-name a');
        if (companyElement) {
            companyName = companyElement.innerText.trim();
        }
    } catch (e) {
        console.error("LinkedIn primary selectors failed:", e);
    }

    if (!jobTitle) {
        jobTitle = document.title.split('|')[0].trim() || 'Unknown Job Title';
    }
    
    if (!companyName) {
        const match = document.title.match(/ at (.*?) \|/); 
        companyName = match ? match[1].trim() : 'Unknown Company';
    }

    return { jobTitle, companyName, jobURL };
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