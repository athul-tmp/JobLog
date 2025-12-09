const API_BASE_URL = 'https://api.joblog.athulthampan.com/api/JobApplication'; 

async function sendToBackend(jobData) {
    const statusMessage = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');

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
            link: jobData.jobURL,
            status: 'Applied', 
            dateApplied: new Date().toISOString().substring(0, 10)
        };
        
        const response = await fetch(API_BASE_URL, {
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
        } else if (response.status === 401) {
            statusMessage.style.color = 'red';
            statusMessage.textContent = 'Error: Unauthorized. Please log in again.';
        } else if (response.status === 400) {
            const errorBody = await response.json();
            statusMessage.style.color = 'red';
            statusMessage.textContent = `Validation Error: ${errorBody.message}`;
        } else {
            statusMessage.style.color = 'red';
            statusMessage.textContent = `API Error (${response.status}). Check server logs.`;
        }
    } catch (error) {
        statusMessage.style.color = 'red';
        statusMessage.textContent = `Network Error: Could not reach JobLog API.`;
        console.error('Fetch error:', error);
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

    return {
        jobTitle: jobTitle,
        companyName: companyName,
        jobURL: jobURL,
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const initiateBtn = document.getElementById('initiateBtn');
    const jobFormContainer = document.getElementById('jobFormContainer');
    const jobForm = document.getElementById('jobForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    initiateBtn.addEventListener('click', () => {
        statusMessage.textContent = 'Searching for job details...';
        initiateBtn.disabled = true;

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
                    
                    jobFormContainer.classList.remove('hidden');
                    
                } else {
                    statusMessage.textContent = 'No job details found on this page. Please enter manually.';
                    jobFormContainer.classList.remove('hidden');
                }
            });
        });
    });

    jobForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        submitBtn.disabled = true;

        statusMessage.textContent = 'Saving data to JobLog...';
        
        const finalJobData = {
            companyName: document.getElementById('company').value,
            jobTitle: document.getElementById('role').value,
            jobURL: document.getElementById('link').value
        };

        sendToBackend(finalJobData);
    });
});