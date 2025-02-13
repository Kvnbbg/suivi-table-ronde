function openMasterModal() {
    document.getElementById('masterModal').style.display = 'flex';
}

function closeMasterModal() {
    document.getElementById('masterModal').style.display = 'none';
}

function openIndex() {
    window.open("index.html", "_blank");
    alert("^_^ I appreciate the suggestion!");
}

// Toggle Language
function toggleLanguage() {
    const lang = document.documentElement.lang;
    document.documentElement.lang = lang === "fr" ? "en" : "fr";
    document.getElementById("toggle-lang").textContent = lang === "fr" ? "🌍 Passer en Français" : "🌍 Switch to English";
}

// Handle Feedback Submission
document.getElementById("feedbackForm").addEventListener("submit", function (event) {
    event.preventDefault();
    
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    if (!name || !email || !message) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const mailtoLink = `mailto:kevinmarville@gmail.com?subject=Feedback from ${name}&body=${message}%0D%0A%0D%0AEmail: ${email}`;
    
    window.location.href = mailtoLink;

    document.getElementById("confirmation-animation").classList.remove("hidden");
    setTimeout(() => {
        document.getElementById("confirmation-animation").classList.add("hidden");
    }, 3000);
});

// Save Feedback Locally
function saveFeedback() {
    const message = document.getElementById("message").value;
    localStorage.setItem("savedFeedback", message);
    alert("💾 Feedback sauvegardé !");
}