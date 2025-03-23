document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("submitQuestionButton").addEventListener("click", sendMessage);
    document.getElementById("uploadFile").addEventListener("change", uploadFile);
});

async function sendMessage() {
    const userMessage = document.getElementById("userMessage").value;
    if (userMessage.trim() === "") return; 

    appendMessage(userMessage, "user"); 
    document.getElementById("userMessage").value = "";

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/chatWithBot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_message: userMessage }),
        });

        if (!response.ok) {
            throw new Error("Server Error: " + response.status);
        }

        const result = await response.json();
        if (result.bot_response) {
            appendMessage(result.bot_response, "bot"); 
        }

        if (result.downloadable) {
            document.getElementById("downloadButton").style.display = "block";
        }
    } catch (error) {
        console.error("Error:", error);
        appendMessage("❌ Error connecting to the server. Please try again.", "bot");
    }
}

async function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://127.0.0.1:5000/chat/uploadFile", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("File upload failed");
        }

        const result = await response.json();
        appendMessage("📂 File uploaded successfully!", "bot");

    } catch (error) {
        console.error("Upload Error:", error);
        appendMessage("❌ File upload failed. Please try again.", "bot");
    }
}

function convertMarkdownToHTML(markdownText) {
    return markdownText
        .replace(/\\(.?)\\*/g, "<strong>$1</strong>") 
        .replace(/\(.?)\*/g, "<em>$1</em>") 
        .replace(/(.*?)/g, "<u>$1</u>") 
        .replace(/(.*?)/g, "<code>$1</code>") 
        .replace(/\n/g, "<br>"); 
}

function appendMessage(message, sender) {
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("chat-message");
    messageContainer.classList.add(sender === "user" ? "user-message" : "bot-response");

    messageContainer.innerHTML = convertMarkdownToHTML(message);

    document.getElementById("chatBox").appendChild(messageContainer);
    scrollToBottom();
}

function scrollToBottom() {
    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function downloadContract() {
    fetch("/chat/downloadContract", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_message: document.getElementById("userMessage").value }),
    })
        .then((response) => response.blob())
        .then((blob) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "contract.docx";
            link.click();
        })
        .catch((error) => {
            console.error("Error downloading contract:", error);
        });
}