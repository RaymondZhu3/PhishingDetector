// background.js (Manifest V3 compatible)

// scan function returns a Promise that resolves with Gmail snippets
async function scan() {
	return new Promise((resolve, reject) => {
		chrome.identity.getAuthToken({ interactive: true }, async (token) => {
			// edge case - get the token failed
			if (chrome.runtime.lastError || !token) {
				console.error("Failed to get OAuth token:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
				return;
			}

			console.log("OAuth token acquired");

			try {
				const threadsResponse = await fetch(
					"https://gmail.googleapis.com/gmail/v1/users/me/threads",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);


				const threadsData = await threadsResponse.json();

				const threads = threadsData.threads || [];


				// Get each thread's first message snippet

				let yellowCounter = 0;
				let redCounter = 0;
				for (const thread of threads) {
					// get individual response
					const threadResp = await fetch(
						`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
						{ headers: { Authorization: `Bearer ${token}` } }
					);
					const threadData = await threadResp.json();
					if (!threadData["messages"][0]["labelIds"].includes('INBOX')) {
						continue
					}

					console.log(threadData["messages"][0]["labelIds"]);
					// the message is in the inbox and can therefore be analyzed

					curScore = analyzeMsg(threadData["messages"][0].snippet,
						threadData["messages"][0].payload.headers);
					if (curScore >= 0.2 && curScore < 0.5) {
						++yellowCounter;
					} else if (curScore >= 0.5) {
						++redCounter;
					}
				}
				resolve([yellowCounter, redCounter]);
			} catch (err) {
				console.error("Error fetching Gmail data:", err);
				reject(err);
			}
		});
	});
}

function getFrom(headers) {
	console.log(headers);
	return headers.find(h => h.name === "From").value;
}

function getSubject(headers) {
	return headers.find(h => h.name === "Subject").value;
}

function isGibberish(str) {
	// Remove numbers and symbols
	const lettersOnly = str.replace(/[^a-zA-Z]/g, "");

	// Heuristic 1: 5 or more consonants in a row
	if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(lettersOnly)) return true;

	// Heuristic 2: Unnatural character mix (e.g., xzq8r2k)
	const entropy = lettersOnly.length
		? (new Set(lettersOnly.toLowerCase()).size / lettersOnly.length)
		: 0;
	if (entropy > 0.7 && lettersOnly.length > 6) return true;

	// Heuristic 3: No vowels
	if (!/[aeiou]/i.test(lettersOnly)) return true;

	// Heuristic 4: Weird ratio of letters to digits
	const digits = str.replace(/\D/g, "");
	if (digits.length > lettersOnly.length / 2) return true;

	return false;
}


function analyzeMsg(snippet, headers) {
	if (snippet === undefined || headers === undefined) {
		return 0;
	}

	const fromAddress = getFrom(headers);
	const subject = getSubject(headers).toLowerCase();
	const links = snippet.match(/\b((https?:\/\/|www\.)[^\s"'<>()]+[^\s"'<>().,;!?])/gi);

	for (link in links) {
		if (isMalicious(link)) {
			return 100; // automatically malicious link
		}
	}

	weightedSum = 0;

	const suspiciousDomains = ["ddnsgeek.com", "ddnsfree.com", "copalzon.my", "etreon.my",
		"kozow.com", "dynu.net", "noip.com", "duckdns.org", "dyn-dns.org",
		"changeip.com", "freedns.afraid.org", "dyn.com", "tzo.com", "yDNS.eu"]
	for (dom in suspiciousDomains) {
		if (fromAddress.includes(dom)) {
			weightedSum += 0.3;
		}
	}

	if (isGibberish(fromAddress)) {
		weightedSum += 0.5;
	}

	if (snippet.length == 0) {
		weightedSum += 0.05;
	}

	const emojiRegex = /([\u231A-\u231B]|[\u23E9-\u23EC]|[\u23F0]|[\u23F3]|[\u25AA-\u25AB]|[\u25B6]|[\u25C0]|[\u25FB-\u25FE]|[\u2600-\u27BF]|[\u1F300-\u1F6FF]|[\u1F900-\u1F9FF]|[\u1F1E6-\u1F1FF])/g;
	if (snippet.match(emojiRegex).length > 1) {
		// more than 1 emoji
		weightedSum += 0.2;
	}

	if (subject.includes("urgent") || subject.includes("immediately") ||
		subject.includes("final notice")) {
		weightedSum += 0.1;
	}

	return weightedSum;
}

function isMalicious(link) {
	const API_KEY = 'AIzaSyB79wA1xBE2pWIzwVITz0GICsPC3BtmKgU';
	const url = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + API_KEY;
	const data = {
		"client": {
			"clientId": "UT Austin",
			"clientVersion": "1.5.2"
		},
		"threatInfo": {
			"threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
				"POTENTIALLY_HARMFUL_APPLICATION"],
			"platformTypes": ["ANY_PLATFORM", "WINDOWS", "LINUX", "ANDROID", "OSX", "CHROME", "IOS"],
			"threatEntryTypes": ["URL", "EXECUTABLE"],
			"threatEntries": [
				{ "url": link }
			]
		}
	};

	fetch(url, {
		method: 'POST', // Specify the HTTP method
		headers: {
			'Content-Type': 'application/json' // Indicate the type of content in the body
		},
		body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
	})
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json().length > 0;
		})

}
// Listener for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === "startScan") {
		console.log("Received scan request for tabId:", msg.tabId);

		scan()
			.then((results) => {
				// console.log("Scan results:", results);
				sendResponse({ ok: true, results });
			})
			.catch((err) => {
				sendResponse({ ok: false, error: err.toString() });
			});

		return true; // important to keep sendResponse alive for async
	}
});
