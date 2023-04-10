const Alexa = require('ask-sdk-core');
const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openAiApi = new OpenAI.OpenAIApi(new OpenAI.Configuration({ apiKey: OPENAI_API_KEY }));
const skillBuilder = Alexa.SkillBuilders.custom();

skillBuilder.addRequestHandler("LaunchRequest", input => Promise.resolve()
    .then(() => startSession(input))
    .then(() => nextAiMessage(input))
    .then((aiMessage) => retainAiMessageOnSession(input, aiMessage))
    .then((aiMessage) => speak(input, aiMessage)));

skillBuilder.addRequestHandler("ChatIntent", input => Promise.resolve()
    .then(() => retainUserMessageOnSession(input))
    .then(() => nextAiMessage(input))
    .then((aiMessage) => retainAiMessageOnSession(input, aiMessage))
    .then((aiMessage) => speak(input, aiMessage)));

skillBuilder.addRequestHandler("AMAZON.StopIntent", input => input.responseBuilder.getResponse());

skillBuilder.addRequestHandler("AMAZON.CancelIntent", input => input.responseBuilder.getResponse());

skillBuilder.addRequestHandler("SessionEndedRequest", input => input.responseBuilder.getResponse());

skillBuilder.addResponseInterceptors((i, o) => console.log("Input / Output", JSON.stringify(i), JSON.stringify(o)));

skillBuilder.addErrorHandler(() => true, (input, error) => {
    console.log("Input / Error", input, error)
    return input.responseBuilder.speak("Sorry, something went wrong").getResponse()
})

exports.handler = skillBuilder.lambda();

// Helper functions

/** Setup session attributes (will be used to retain messages from the conversation) */
function startSession(input) {
    const userLocale = input.requestEnvelope.request.locale;
    input.attributesManager.getSessionAttributes()["sessionMessages"] = [
        {"role": "system", "content": "You are an assistant."},
        {"role": "user", "content": `I am a 3rd party app that proxies conversations between humans and ChatGPT. Prefer to send small messages (max 20 words). Proceed by greeting the user in 5 words or less in their preferred language (${userLocale}).`},
    ];
}

/** Send a request to OpenAI and then return the generated AI message */
function nextAiMessage(input) {
    const sessionMessages = input.attributesManager.getSessionAttributes()["sessionMessages"];
    const args = { model: "gpt-3.5-turbo", messages: sessionMessages, max_tokens: 100,}
    const responsePromise = openAiApi.createChatCompletion(args);
    return responsePromise.then((response) => response.data.choices[0].message.content);
}

/** Append the given AI message to the session attributes */
function retainAiMessageOnSession(input, aiMessage) {
    const sessionMessages = input.attributesManager.getSessionAttributes()["sessionMessages"];
    sessionMessages.push({"role": "assistant", "content": aiMessage});
    return aiMessage;
}

/** Return a response to the Alexa service and speak the given text */ 
function speak(input, text) {
    return input.responseBuilder.speak(text).withShouldEndSession(false).getResponse();
}

/** Extract a user message from the input and append it to the session attributes */
function retainUserMessageOnSession(input) {
    const userMessage = input.requestEnvelope.request.intent.slots["message"].value;
    const sessionMessages = input.attributesManager.getSessionAttributes()["sessionMessages"];
    sessionMessages.push({"role": "user", "content": userMessage});
    return userMessage;
}
