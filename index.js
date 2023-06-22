const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");

const OPENAI_API_KEY =
  core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const DIFF_FROM = core.getInput("diff_from") || "HEAD~1";
const DIFF_TO = core.getInput("diff_to") || "HEAD";
const current_sha = core.getInput("current_sha") || "none";
const ghurl = core.getInput("ghurl") || "https://github.com";
(async () => {
  try {
    const parsed_url = `https://github.com/${ghurl}`;
    const ghtext = get_text_from_github(parsed_url);
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

    const res = await prompt.format({ code: ghtext });
    core.info(`result is ${res}`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

function get_text_from_github(url) {
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");
  const headers = {
    Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
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
