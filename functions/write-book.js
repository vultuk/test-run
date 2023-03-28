const { default: ask } = require("./ask");

const createBookTitle = async (subject) => {
    const bookQuestion = `I want to write a book about ${subject}. Please generate me the title of the book as a single string in a json object.`;
    
    return JSON.parse(await ask(bookQuestion))
}

exports.handler = async (event, context) => {
    const subject = event.queryStringParameters.subject;

    const bookTitle = await createBookTitle();

    return {
        statusCode: 200,
        body: JSON.stringify({
            title: bookTitle
        }),
      };
  };
  