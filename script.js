document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submitQuestionButton").addEventListener("click", sendMessage);
    document.getElementById("uploadFile").addEventListener("change", uploadFile);
    document.getElementById("downloadContractButton").addEventListener("click", downloadContract);
    document.getElementById("summarizeButton").addEventListener("click", summarizeDocument);
    document.getElementById("qualityCheck").addEventListener("click", qualityCheck);
    document.getElementById("startNewChatButton").addEventListener("click", newChat);
});

async function newChat() {
    location.reload();
}

document.getElementById("userMessage").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

let uploadedFile = null; // Global file storage

async function sendMessage() {
    const userMessage = document.getElementById("userMessage").value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, "user");
    document.getElementById("userMessage").value = "";

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/chatWithBot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_message: userMessage }),
        });

        if (!response.ok) throw new Error("Server Error: " + response.status);

        const result = await response.json();
        if (result.bot_response) appendMessage(result.bot_response, "bot");

        if (result.downloadable) {
            document.getElementById("downloadContractButton").style.display = "block";
        }
    } catch (error) {
        console.error("Error:", error);
        appendMessage("❌ Error connecting to the server. Please try again.", "bot-message");
    }
}

async function uploadFile(event) {
    uploadedFile = event.target.files[0]; // Store file globally
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/uploadImage", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("File upload failed");

        const result = await response.json();
        appendMessage("📂 File uploaded successfully!", "bot-message");
    } catch (error) {
        console.error("Upload Error:", error);
        appendMessage("❌ File upload failed. Please try again.", "bot-message");
    }
}

async function summarizeDocument() {
    if (!uploadedFile) {
        // Trigger file upload if no file has been selected
        let uploadInput = document.getElementById("uploadFile");
        uploadInput.click();
        uploadInput.onchange = async function (event) {
            await uploadFile(event); // Upload the file
            // Call summarizeDocument again after file upload
            summarizeDocument();
            // Reset the input value to allow new uploads later
            uploadInput.value = "";
        };
        appendMessage("📂 Please select a document to summarize.", "bot-message");
        return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/summarizeDocument", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Summarization failed");

        const result = await response.json();
        appendMessage("🔍 **Summary:**<br>" + result.summary, "bot-message");
    } catch (error) {
        console.error("Summarization Error:", error);
        appendMessage("❌ Summarization failed. Please try again.", "bot-message");
    } finally {
        // Reset the global file after summarization so that a new file is required each time.
        uploadedFile = null;
    }
}

async function qualityCheck() {
    if (!uploadedFile) {
        let uploadInput = document.getElementById("uploadFile");
        uploadInput.click();
        uploadInput.onchange = async function (event) {
            await uploadFile(event); // Upload the file
            qualityCheck(); // Retry quality check after upload
            uploadInput.value = "";
        };
        appendMessage("📂 Please select a contract to check its quality.", "bot-message");
        return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/contractQualityCheck", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Quality check failed");

        const result = await response.json();
        appendMessage("✅ **Quality Check Report:**<br>" + result.quality_report, "bot-message");
    } catch (error) {
        console.error("Quality Check Error:", error);
        appendMessage("❌ Quality check failed. Please try again.", "bot-message");
    } finally {
        // Reset the file after quality check to allow multiple uses.
        uploadedFile = null;
    }
}

async function downloadContract() {
    const formData = new FormData();
    if (uploadedFile) {
        formData.append("file", uploadedFile);
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/downloadContract", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "contract.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error downloading contract:", error);
        appendMessage("❌ Failed to download contract. Please try again.", "bot-message");
    }
}

function appendMessage(message, sender) {
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("chat-message", sender === "user" ? "user-message" : "bot-message");

    // Auto-format response: Convert **bold** to <strong> and new lines to <br>
    let formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");

    messageContainer.innerHTML = formattedMessage;
    document.getElementById("chatBox").appendChild(messageContainer);
    scrollToBottom();
}

function scrollToBottom() {
    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}
