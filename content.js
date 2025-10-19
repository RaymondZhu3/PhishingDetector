function isGibberish(str) {
    if (str.toLowerCase() === "google") {
        return false;
    }
    // Split the string into words (skip punctuation)
    const words = str.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, "")).filter(Boolean);

    for (let word of words) {
        // Heuristic 1: 5+ consonants in a row
        if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) { 
            console.log("1");
            return true;
        }

        // Heuristic 2: No vowels
        if (!/[aeiou]/i.test(word) && word.length > 3) {
            console.log("2");
            return true;
        }

        // Heuristic 3: Digits dominate letters
        const digits = str.replace(/\D/g, "");
        const lettersOnly = str.replace(/[^a-zA-Z]/g, "");
        if (digits.length > lettersOnly.length / 2) {
            console.log("3");

            return true;
        }
    }

    return false; // nothing triggered
}


// ---------- Helper: Compute Suspicious Score ----------
function computeSuspiciousScore(email) {
    console.log(email);
    let score = 0;
    console.log("Starting score:", score);

    const { sender = "", replyTo = "", subject = "", body = "", attachments = [], links = [] } = email;

    const senderLocal = sender.split('@')[0] || "";
    const senderDomain = sender.split('@')[1] || "";
    const replyToDomain = replyTo.split('@')[1] || "";

    console.log("reoply to domain:", replyToDomain);

    // --- Sender checks ---

    console.log();
    // Gibberish sender name
    if (isGibberish(sender)) {

        console.log("Gibberish sender detected: " + sender);
        score += 50;
    }

    // noreply/admin keywords
    if (sender.toLowerCase().includes("noreply") || sender.toLowerCase().includes("admin")) {
        console.log("noreply/admin keyword detected");
        score += 20;
    }

    // Generic names
    const genericNames = ["customer service", "support team", "admin"];
    genericNames.forEach(name => {
        if (sender.toLowerCase().includes(name)) {
            console.log("Generic sender name detected:", name);
            score += 25;
        }
    });


    // Reply-to mismatch
    if (replyTo && replyToDomain !== senderDomain) {
        console.log("Reply-to domain mismatch");
        score += 25;
    }

    // --- Subject checks ---
    const urgentWords = ["urgent", "immediately", "final notice", "verify", "action required",
        "password", "login", "account", "hacked", "ineligible", "time-sensitive",
        "debt", "loan", "benefits", "at risk", "require attention", "require action", 
        "deleted today", "winner", "confirm"];
    urgentWords.forEach(word => {
        if (subject.toLowerCase().includes(word)) {
            console.log("Urgent keyword detected:", word);
            score += 20;
        }
    });

    // --- Body / link checks ---
    const linkMatches = body.match(/https?:\/\/[^\s]+/g) || [];
    const allLinks = [...linkMatches, ...links];

    for (const link of allLinks) {
        // External redirect
        if (senderDomain && !link.includes(senderDomain)) {
            console.log("External redirect detected:", link);
            score += 35;
        }

        // Shortened URLs
        if (/bit\.ly|tinyurl|goo\.gl/i.test(link)) {
            console.log("Shortened URL detected:", link);
            score += 15;
        }

        // Long link
        if (link.length > 75) {
            console.log("Long link detected");
            score += 5;
        }

        // Check if malicious (async)
        if (isMalicious(link)) {
            console.log("Malicious link detected:", link);
            return 100; // immediate flag
        }
    }

    urgentWords.forEach(word => {
        if (body.toLowerCase().includes(word)) {
            console.log("Urgent keyword detected:", word);
            score += 20;
        }
    });

    // --- Attachments ---
    if (attachments.length > 0 && body.trim().length < 10) {
        score += 20;
    }

    const riskyExt = [".exe", ".js", ".scr"];
    attachments.forEach(att => {
        riskyExt.forEach(ext => {
            if (att.toLowerCase().endsWith(ext)) {
                console.log("Risky attachment detected:", ext);
                score += 25;
            }
        });
    });

    // --- Emojis and punctuation ---
    const emojiRegex = /([\u231A-\u231B]|[\u23E9-\u23EC]|[\u23F0]|[\u23F3]|[\u25AA-\u25AB]|[\u25B6]|[\u25C0]|[\u25FB-\u25FE]|[\u2600-\u27BF]|[\u1F300-\u1F6FF]|[\u1F900-\u1F9FF]|[\u1F1E6-\u1F1FF])/g;

    if (body.match(emojiRegex).length > 1) {
        console.log("Multiple emojis detected");
        score += 15;
    }

    // Excessive punctuation
    if (/[!]{3,}|[?]{3,}/.test(subject + body)) {
        console.log("Excessive punctuation detected");
        score += 40;
    }

    console.log("Final computed score:", score);
    return Math.min(score, 100);
}

function isMalicious(link) {
    chrome.runtime.sendMessage({ type: "checkMalicious", link })
    .then(isBad => {
        return isBad
    });    
}


// ---------- Highlight Email ----------
function highlightEmail(emailElement, score) {
    if (!emailElement) return;
    emailElement.title = `Phishing score: ${score}`;


    if (score >= 50) {
        emailElement.style.backgroundColor = "red";
        return 1; // 2 means red
    } else if (score >= 20) {
        emailElement.style.backgroundColor = "yellow";
        return 0; // 1 means yellow
    }
    return -1; // safe email

}

// ---------- Check Email ----------
function checkEmail(emailElement, emailData) {
    const score = computeSuspiciousScore(emailData);
    return highlightEmail(emailElement, score);
}

// ---------- Scan Inbox ----------
function scanInbox(emails) {
    let redCounter = 0;
    let yellowCounter = 0;
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

        let emailLabel = checkEmail(email, emailData);
        if (emailLabel === 0) {
            yellowCounter++;
        } else if (emailLabel === 1) {
            redCounter++;
        }
    });

    chrome.storage.local.set({
        emailSummary: {
            rCount: redCounter,
            yCount: yellowCounter
        }
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