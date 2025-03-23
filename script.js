document.getElementById("submitQuestionButton").addEventListener("click", function() {
    let question = document.getElementById("questionInput").value.trim();
    let chatBox = document.getElementById("chatBox");

    if (question === "") return;

    // Add User Message
    let userMessage = document.createElement("p");
    userMessage.classList.add("user-message");
    userMessage.textContent = question;
    chatBox.appendChild(userMessage);

    document.getElementById("questionInput").value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Typing Animation
    let botTyping = document.createElement("p");
    botTyping.classList.add("bot-message", "typing");
    botTyping.textContent = "Typing";
    chatBox.appendChild(botTyping);

    setTimeout(() => {
        botTyping.remove();
        let response = getLegalResponse(question);
        let botMessage = document.createElement("p");
        botMessage.classList.add("bot-message");
        botMessage.textContent = response;
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 2000);
});

// Handle File Upload
document.getElementById("fileInput").addEventListener("change", function() {
    let file = this.files[0];
    let chatBox = document.getElementById("chatBox");

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    // Display file preview or name in chatbox
    let fileMessage = document.createElement("p");
    fileMessage.classList.add("bot-message");

    if (file.type.startsWith("image")) {
        let img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.style.maxWidth = "100%";
        fileMessage.appendChild(img);
    } else {
        fileMessage.textContent = `Uploaded file: ${file.name}`;
    }

    chatBox.appendChild(fileMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Function for Basic Legal Responses
function getLegalResponse(question) {
    if (question.toLowerCase().includes("contract")) return "A contract must have an offer, acceptance, and consideration.";
    if (question.toLowerCase().includes("rights")) return "Your rights depend on jurisdiction. Consult a legal expert.";
    return "I'm still learning! For legal matters, consult a lawyer.";
}
