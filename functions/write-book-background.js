const axios = require("axios");
const { Client } = require('@notionhq/client');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const jsdom = require("jsdom")
const { JSDOM } = jsdom
global.DOMParser = new JSDOM().window.DOMParser

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_GPT_MODEL = process.env.CHAT_GPT_MODEL ?? "gpt-3.5-turbo";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const databaseId = '043cda58516340f3b354c9594222b1be'; //https://www.notion.so/043cda58516340f3b354c9594222b1be?v=49df5d117fda40a68d6ea0fd946ef458&pvs=4

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${OPENAI_API_KEY}`,
};

async function createPage(bookTitle, markdown) {
  const html = md.render(markdown);
  const blocks = htmlToNotionBlocks(html);
  const createdPage = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      // Configure this to match your database properties
      title: { title: [{ text: { content: bookTitle } }] },
    },
    children: blocks,
  });

  console.log(`Page created: ${createdPage.url}`);
}

function htmlToNotionBlocks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = doc.body.children;
  const blocks = [];

  for (const element of elements) {
    switch (element.tagName) {
      case 'P':
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            text: [{ type: 'text', text: { content: element.textContent } }],
          },
        });
        break;
      // Add more cases for other elements like headings, lists, etc.
      case 'H1':
        blocks.push({
          object: 'block',
          type: 'heading_1',
          "heading_1": {
            "heading_1": [{ type: 'rich_text', text: { content: element.textContent } }],
          },
        });
        break;
        case 'H2':
          blocks.push({
            object: 'block',
            type: 'heading_2',
            "heading_2": {
              "heading_2": [{ type: 'rich_text', text: { content: element.textContent } }],
            },
          });
          break;
      default:
        console.warn(`Unhandled element: ${element.tagName}`);
    }
  }

  return blocks;
}

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

const parseResponse = (value) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error("Couldn't Parse", value);
    return value;
  }
}

const createBookTitle = async (subject) => {
  const question = `I want to write a book about ${subject}. Please generate me the title of the book as a single string in a json object.`;

  return parseResponse(await ask(question));
};

const createChapters = async (bookTitle) => {
  const question = `Generate all the titles of the main chapters of a book titled "${bookTitle}". Output it just as a json array of objects with the key named "chapters". Please also add any subchapters relating to each chapter as an array of objects where the subchapter title is in a key named 'title'.`;

  return parseResponse(await ask(question));
};

const generateMainChapter = async (bookTitle, chapterTitle) => {
  const question = `Generate the content for a chapter of the book titled "${bookTitle}" where the chapter is titled "${chapterTitle}". Output this as plain text.`;

  return await ask(question);
};

exports.handler = async (event, context) => {
  try {
    const totalBook = [];
  const subject = event.queryStringParameters.subject;

  const bookTitle = (await createBookTitle(subject)).title;
  // let chapters = (await createChapters(bookTitle)).chapters;

  // totalBook.push(`# ${bookTitle}`);

  // for (const chapter of chapters) {
  //   totalBook.push(`# ${chapter.title}`);

  //   if (!chapter.subchapters  || chapter.subchapters.length === 0 ) {
  //     totalBook.push((await generateMainChapter(bookTitle, chapter.title)));
  //   }
    
  //   if (chapter.subchapters && chapter.subchapters.length > 0 ) {
  //     for (const subchapter of chapter.subchapters) {
  //       totalBook.push((await generateMainChapter(bookTitle, subchapter.title)));
  //     }
  //   }
  // }
    totalBook.push("# Top/n/n## Second/n/nWelcome to the book");
  await createPage(bookTitle, totalBook.join("\n\n"))
} catch (e) {
  console.error(e);
}

return {
  statusCode: 200,
  body: JSON.stringify({ status: "done" }),
};

};
