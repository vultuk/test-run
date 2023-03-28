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

const createBookTitle = async (subject) => {
  const question = `I want to write a book about ${subject}. Please generate me the title of the book as a single string in a json object.`;

  return JSON.parse(await ask(question));
};

const createChapters = async (bookTitle) => {
  const question = `Generate all the titles of the main chapters of a book titled "${bookTitle}". Output it just as a json array of objects with the key named "chapters". Please also add any subchapters relating to each chapter.`;

  return JSON.parse(await ask(question));
};

const generateMainChapter = async (bookTitle, chapterTitle) => {
  const question = `Generate the content for a chapter of the book titled "${bookTitle}" where the chapter is titled ${chapterTitle}. Output this as a single string in a json object where the key is "content".`;

  return JSON.parse(await ask(question));
};

exports.handler = async (event, context) => {
  const subject = event.queryStringParameters.subject;

  const bookTitle = (await createBookTitle(subject)).title;
  let chapters = (await createChapters(bookTitle)).chapters;

  console.log(JSON.stringify(chapters, null, 2));

  console.log(bookTitle);

  for (const chapter of chapters) {
    console.log(chapter.title);

    if (!chapter.subchapters  || chapter.subchapters.length === 0 ) {
      console.log((await generateMainChapter(bookTitle, chapter.title)));
    }
    
    if (chapter.subchapters && chapter.subchapters.length > 0 ) {
      for (const subchapter of chapters.subchapters) {
        console.log((await generateMainChapter(bookTitle, subchapter.title)));
      }
    }
  }

};
