document.addEventListener('DOMContentLoaded', () => {
    const quickAddBtn = document.getElementById('quickAddBtn');
    const statusMessage = document.getElementById('statusMessage');

    quickAddBtn.addEventListener('click', () => {
        statusMessage.textContent = 'Searching for job details...';

        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                statusMessage.textContent = 'Error: No active tab found.';
                return;
            }
            const activeTab = tabs[0];
            
            // Execute a function
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: contentScriptFunction
            }, (results) => {
                if (chrome.runtime.lastError) {
                    statusMessage.textContent = `Error: ${chrome.runtime.lastError.message}`;
                    return;
                }
                
                const jobData = results[0].result;
                
                if (jobData && jobData.jobTitle) {
                    statusMessage.textContent = `Found: "${jobData.jobTitle}" at "${jobData.companyName}". URL: ${jobData.jobURL}`;
                    
                    
                } else {
                    statusMessage.textContent = 'No job details found on this page.';
                }
            });
        });
    });
});

// THIS FUNCTION RUNS ON THE JOB BOARD PAGE
function contentScriptFunction() {
    let jobTitle = null;
    let companyName = null;
    const jobURL = window.location.href;

    // Primary LinkedIn Selectors 
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

    // Fallback
    if (!jobTitle) {
        jobTitle = document.title.split('|')[0].trim() || 'Unknown Job Title';
    }
    
    if (!companyName) {
        const match = document.title.match(/ at (.*?) \|/); 
        companyName = match ? match[1].trim() : 'Unknown Company';
    }

    // Return the extracted data
    return {
        jobTitle: jobTitle,
        companyName: companyName,
        jobURL: jobURL,
    };
}