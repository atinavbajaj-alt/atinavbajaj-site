import fs from "fs";
import path from "path";
import OpenAI from "openai";

const MODEL_NAME = "gpt-5-nano";

const SYSTEM_PROMPT = `You answer questions about Atinav Bajaj using only the text provided from his resume and LinkedIn notes.

Rules:
- Only use the provided profile text.
- If the answer is not in the text, say you do not see that information.
- Do not make up dates, companies, skills, projects, or contact details.
- Keep answers short, clear, and professional.
- If the user asks for contact details, only provide details present in the profile text.
- If the user asks for subjective hiring opinions, answer based only on the evidence in the profile text.`;

function readProfileText() {
  const linkedinPath = path.join(process.cwd(), "data", "linkedin.txt");
  const resumePath = path.join(process.cwd(), "data", "resume.txt");

  const linkedinText = fs.readFileSync(linkedinPath, "utf8").trim();
  const resumeText = fs.readFileSync(resumePath, "utf8").trim();

  if (!linkedinText || !resumeText) {
    throw new Error("Profile text files are missing or empty.");
  }

  return `Source: linkedin.txt\n${linkedinText}\n\nSource: resume.txt\n${resumeText}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const profileText = readProfileText();

    const recentHistory = Array.isArray(history)
      ? history.slice(-6).map((item) => {
          return `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content}`;
        }).join("\n")
      : "";

    const input = `
Profile text:
${profileText}

Recent conversation:
${recentHistory || "No prior conversation."}

User question:
${message}
`;

    const response = await client.responses.create({
      model: MODEL_NAME,
      instructions: SYSTEM_PROMPT,
      input,
    });

    return res.status(200).json({
      answer: response.output_text.trim(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Something went wrong while answering the question.",
    });
  }
}