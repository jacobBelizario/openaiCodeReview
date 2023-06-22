const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { LLMChain } = require("langchain/chains");

const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");

const OPENAI_API_KEY =
  core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const ghurl = core.getInput("ghurl");
const GITHUB_ACCESS_TOKEN = core.getInput("gh_token");
const diff_code = core.getInput("diff_code" || "");
(async () => {
  try {
    const model = new OpenAI({
      openAIApiKey: OPENAI_API_KEY,
      modelName: AI_MODEL,
      temperature: 0.9,
    });

    // const chain_res = await chain.call({ code: diff_code });
    // core.info(`Code Review: \n${chain_res.text}`);
    const files = diff_code.split(" ");
    var output = "";

    for (const file of files) {
      const parsed_url = `https://github.com/${ghurl}/blob/main/${file}`;
      core.info(parsed_url);
      const review_code = await getTextFromGitHub(parsed_url);

      const template =
        "Given this {code} Pretend you're a rigorous code reviewer who can analyze and comment on any code to prevent security violations, improve code quality, and enforce coding best practices.\n*CODE SUMMARY:*\nDescribe what type of code this is including the language and purpose.\n*CODE REVIEW:*\n*1. Observation: blah blah blah*\n        - Reasoning:\n        - Code Example:  ```\n        - Code Recommendation: ``` ";
      const prompt = new PromptTemplate({
        template: template,
        inputVariables: ["code"],
      });

      const chain = new LLMChain({ llm: model, prompt: prompt });
      const chain_res = await chain.call({ code: review_code });
      output += `SOURCE: ${parsed_url} \n${chain_res.text}\n\n`;
    }

    // Output after the loop
    core.info(`output: ${output}`);
    core.setOutput("openai_review", output);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

async function getTextFromGitHub(url) {
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");

  const headers = {
    Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    const response = await axios.get(rawUrl, { headers });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error(`Error retrieving GitHub text: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}
