// Fake emails
const sampleEmails = [
  {id:1, from:"Google Support <no-reply@goog1e.com>", subject:"Verify your account", snippet:"Please verify your account by clicking https://goog1e.com/verify?u=abc", links:["https://goog1e.com/verify?u=abc"]},
  {id:2, from:"Friend <alice@gmail.com>", subject:"Pics from party", snippet:"Check these out: https://photos.example.com/album", links:["https://photos.example.com/album"]},
  {id:3, from:"PayPal <service@paypal.com>", subject:"Your account has a problem", snippet:"Click https://paypal.com.secure-login.com to resolve", links:["https://paypal.com.secure-login.com"]},
  {id:4, from:"Workspace <security@accounts.google.com>", subject:"Security alert", snippet:"We noticed sign-in from new device: details inside", links:[]}
];

// Score each email
function scoreEmail(email) {
  let score = 0;
  const suspiciousTokens = ["login","verify","secure","update","account","password"];
  const fakeDomains = ["goog1e","paypa1","secure-login","securelogin","amazon-secure"];

  for (const url of email.links) {
    const u = url.toLowerCase();
    if (/\d+\.\d+\.\d+\.\d+/.test(u)) score += 30;
    if (suspiciousTokens.some(t=>u.includes(t))) score += 20;
    if (fakeDomains.some(d=>u.includes(d))) score += 30;
  }

  const domain = (email.from.match(/@([^>]+)/) || [])[1] || "";
  if (domain && (domain.includes("goog1e") || domain.includes("secure-login"))) score += 25;

  return Math.min(score,100);
}

function verdictClass(score){
  if (score>=60) return ["Phishing", "phish"];
  if (score>=30) return ["Suspicious", "susp"];
  return ["Safe", "safe"];
}

// Render inbox
function render(){
  const inbox = document.getElementById("inbox");
  inbox.innerHTML = "";
  for (const e of sampleEmails) {
    const s = scoreEmail(e);
    const [label,cls] = verdictClass(s);
    const box = document.createElement("div");
    box.className = "email";
    box.innerHTML = `
      <div class="meta" style="overflow:hidden">
        <strong>${e.subject}</strong> — ${e.from}
        <span class="risk ${cls}">${label}</span>
      </div>
      <div class="snippet">${e.snippet}</div>
      <div class="explain">Risk score: ${s}. <button class="preview" data-id="${e.id}">View safe preview</button></div>
    `;
    inbox.appendChild(box);
  }

  document.querySelectorAll("button.preview").forEach(b=>{
    b.addEventListener("click", ev=>{
      const id = +ev.target.dataset.id;
      const email = sampleEmails.find(x=>x.id===id);
      const previewText = "Safe preview (no navigation):\n\nLinks:\n" +
        (email.links.length ? email.links.join("\n") : "(none)") +
        "\n\nSnippet:\n" + email.snippet;
      alert(previewText);
    });
  });
}

// Wait for DOM to load (safe even if script at bottom)
document.addEventListener("DOMContentLoaded", render);
