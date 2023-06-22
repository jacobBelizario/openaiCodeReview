const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { LLMChain } = require("langchain/chains");

const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");

const OPENAI_API_KEY =
  core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const diff_code = core.getInput("diff_code" || "");
(async () => {
  try {
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

    const chain = new LLMChain({ llm: model, prompt: prompt });
    const chain_res = await chain.call({ code: diff_code });
    core.info(`Code Review: \n${chain_res.text}`);
    core.setOutput("openai_review", chain_res);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
