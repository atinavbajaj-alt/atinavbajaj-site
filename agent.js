const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const messages = document.getElementById("messages");

const history = [];

function addMessage(role, content) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

async function askAgent(message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data.answer;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  input.disabled = true;

  addMessage("user", message);
  history.push({ role: "user", content: message });

  addMessage("assistant", "Thinking...");

  const thinkingBubble = messages.lastChild.querySelector(".bubble");

  try {
    const answer = await askAgent(message);
    thinkingBubble.textContent = answer;
    history.push({ role: "assistant", content: answer });
  } catch (error) {
    thinkingBubble.textContent = "Sorry, I couldn’t answer that right now.";
  } finally {
    input.disabled = false;
    input.focus();
  }
});