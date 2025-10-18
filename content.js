// content.js

// Backend API endpoint
const API_URL = "https://your-backend.com/check_email";

// Function to send email data to backend
async function checkEmail(sender, subject, body, emailElement) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender, subject, body }),
        });
        const result = await res.json();

        highlightEmail(emailElement, result.isPhishing, result.susScore);
    } catch (err) {
        console.error("Error checking email:", err);
    }
}

// Function to highlight suspicious emails
function highlightEmail(emailElement, isPhishing, susScore) {
    if (isPhishing) {
        emailElement.style.border = "2px solid red";
        emailElement.title = `⚠️ Phishing detected! Sus Score: ${susScore}`;
    } else if (susScore > 50) {
        emailElement.style.border = "2px solid orange";
        emailElement.title = `⚠️ Potentially suspicious. Sus Score: ${susScore}`;
    } else {
        emailElement.style.border = "none";
        emailElement.title = "";
    }
}

// Main function to scan inbox
function scanInbox() {
    // Gmail-specific selectors for emails in inbox
    const emails = document.querySelectorAll("tr.zA");
    emails.forEach((email) => {
        const subjectElem = email.querySelector(".bog");
        const senderElem = email.querySelector(".yX.xY .yW span");
        const bodyElem = email.querySelector(".y2");

        if (!subjectElem || !senderElem || !bodyElem) return;

        const subject = subjectElem.innerText;
        const sender = senderElem.innerText;
        const body = bodyElem.innerText;

        checkEmail(sender, subject, body, email);
    });
}

// Run scan every few seconds to catch new emails
setInterval(scanInbox, 5000);
