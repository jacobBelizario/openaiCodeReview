const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { LLMChain } = require("langchain/chains");

const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");

const OPENAI_API_KEY =
  core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const ghtoken = core.getInput("gh_token" || "");
const ghurl = core.getInput("ghurl") || "https://github.com";
(async () => {
  try {
    const parsed_url = `https://github.com/${ghurl}`;
    // const ghtext = get_text_from_github(parsed_url);
    const model = new OpenAI({
      openAIApiKey: OPENAI_API_KEY,
      modelName: AI_MODEL,
      temperature: 0.9,
    });

    const template =
      "Given this {code} Pretend you're a rigorous code reviewer who can analyze and comment on any code to prevent security violations, improve code quality, and enforce coding best practices.\n*CODE SUMMARY:*\nDescribe what type of code this is including the language and purpose.\n*CODE REVIEW:*\n*1. Observation: blah blah blah*\n        - Reasoning:\n        - Code Example:  ```\n        - Code Recommendation: ``` ";
    const prompt = new PromptTemplate({
      template: template,
      inputVariables: ["code"],
    });

    const res = await prompt.format({ code: `(a,b) => { return a+b }` });

    const chain = new LLMChain({ llm: model, prompt: prompt });

    const chain_res = await chain.call({ code: `(a,b) => { return a+b }` });
    core.info(`result is ${res}`);
    core.info(`Code Review: \n${chain_res.text}`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

function get_text_from_github(url) {
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");
  const headers = {
    Authorization: `Bearer ${ghtoken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  return axios
    .get(rawUrl, { headers })
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      } else {
        console.log(`Error retrieving GitHub text: ${response.status}`);
        return null;
      }
    })
    .catch((error) => {
      console.log(`Error retrieving GitHub text: ${error.message}`);
      return null;
    });
}
