const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_GPT_MODEL = process.env.CHAT_GPT_MODEL ?? "gpt-3.5-turbo";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${OPENAI_API_KEY}`,
};

const ask = async (question) => {
  const data = {
    model: CHAT_GPT_MODEL,
    messages: [{ role: "user", content: question }],
  };

  try {
    const response = await axios.post(OPENAI_API_URL, data, { headers });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in OpenAI API request:", error);
    throw error;
  }
};

export {ask};
