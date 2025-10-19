// ---------- Helper: Compute Suspicious Score ----------
function computeSuspiciousScore(email) {
    let score = 0;

    const { sender = "", replyTo = "", subject = "", body = "", attachments = [], links = [] } = email;

    // Sender checks
    const gibberishRegex = /^[a-z0-9]{5,}$/i;
    const senderLocal = sender.split('@')[0] || "";
    const senderDomain = sender.split('@')[1] || "";
    if (senderLocal.match(gibberishRegex)) score += 30;
    if (sender.toLowerCase().includes("noreply") || sender.toLowerCase().includes("admin")) score += 10;

    const genericNames = ["customer service", "support team", "admin"];
    genericNames.forEach(name => { if (sender.toLowerCase().includes(name)) score += 15; });

    // Reply-to mismatch
    const replyToDomain = replyTo.split('@')[1] || "";
    if (replyTo && replyToDomain !== senderDomain) score += 25;

    // Subject checks
    const urgentWords = ["urgent", "verify", "action required", "password", "login", "account"];
    urgentWords.forEach(word => { if (subject.toLowerCase().includes(word)) score += 20; });

    // Body/link checks
    const linkMatches = body.match(/https?:\/\/[^\s]+/g) || [];
    const allLinks = [...linkMatches, ...links];
    allLinks.forEach(link => {
        if (senderDomain && !link.includes(senderDomain)) score += 25;
        if (/bit\.ly|tinyurl|goo\.gl/i.test(link)) score += 15;
        if (link.length > 75) score += 5;
    });

    // Attachments
    if (attachments.length > 0 && body.trim().length < 10) score += 10;
    const riskyExt = [".exe", ".js", ".scr"];
    attachments.forEach(att => riskyExt.forEach(ext => { if (att.toLowerCase().endsWith(ext)) score += 20; }));

    // Emojis and punctuation
    const emojiMatches = body.match(/[\u{1F600}-\u{1F64F}]/gu) || [];
    if (emojiMatches.length > 3) score += 10;
    if (/[!]{3,}|[?]{3,}/.test(subject + body)) score += 10;

    return Math.min(score, 100);
}

// ---------- Highlight Email ----------
function highlightEmail(emailElement, score) {
    if (!emailElement) return;

    if (score > 70) {
        emailElement.style.backgroundColor = "red";
    } else if (score > 30) {
        emailElement.style.backgroundColor = "yellow";
    } else {
        emailElement.style.backgroundColor = "green";
    }

    emailElement.title = `Phishing score: ${score}`;
}

// ---------- Check Email ----------
function checkEmail(emailElement, emailData) {
    const score = computeSuspiciousScore(emailData);
    highlightEmail(emailElement, score);
}

// ---------- Scan Inbox ----------
function scanInbox(emails) {
    emails.forEach(email => {
        if (!email) return;

        const subjectElem = email.querySelector(".bog");
        const senderElem = email.querySelector(".yX.xY .yW span");
        const bodyElem = email.querySelector(".y2");

        if (!subjectElem || !senderElem || !bodyElem) return;

        const emailData = {
            sender: senderElem.innerText,
            replyTo: senderElem.getAttribute("email") || senderElem.innerText,
            subject: subjectElem.innerText,
            body: bodyElem.innerText,
            attachments: [],
            links: []
        };

        checkEmail(email, emailData);
    });
}

// ---------- Observe Inbox ----------
function observeInbox() {
    const inboxContainer = document.querySelector("div[role='main']");
    if (!inboxContainer) {
        console.warn("Inbox container not found. Waiting...");
        setTimeout(observeInbox, 1000); // retry in 1 second
        return;
    }

    // Observe for new emails
    const observer = new MutationObserver(mutations => {
        const newEmails = [];
        mutations.forEach(mutation => {
            Array.from(mutation.addedNodes)
                .filter(node => node.nodeType === 1 && node.matches("tr.zA"))
                .forEach(node => newEmails.push(node));
        });
        if (newEmails.length) scanInbox(newEmails);
    });

    observer.observe(inboxContainer, { childList: true, subtree: true });

    // Initial scan
    const initialEmails = inboxContainer.querySelectorAll("tr.zA");
    scanInbox(Array.from(initialEmails));
}

// Start observing once script loads
observeInbox();

// ---------- Listen for Popup Button ----------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "scanNow") {
        const inboxContainer = document.querySelector("div[role='main']");
        if (!inboxContainer) {
            sendResponse({ ok: false, error: "Inbox container not found" });
            return;
        }
        const emails = inboxContainer.querySelectorAll("tr.zA");
        scanInbox(Array.from(emails));
        sendResponse({ ok: true, scanned: emails.length });
    }
});
