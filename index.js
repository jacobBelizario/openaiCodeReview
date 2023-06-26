const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { LLMChain } = require("langchain/chains");
const { ChatAnthropic } = require("langchain/chat_models/anthropic");
const { PromptTemplate } = require("langchain/prompts");

const ANTHROPIC_API_KEY = core.getInput("anthropic_key", { required: true });
const ghurl = core.getInput("ghurl");
const GITHUB_ACCESS_TOKEN = core.getInput("gh_token");
const diff_code = core.getInput("diff_code" || "");
const diff_file = core.getInput("diff_file" || "");
(async () => {
  try {
    const model = new ChatAnthropic({
      temperature: 0.9,
      anthropicApiKey: ANTHROPIC_API_KEY, // In Node.js defaults to process.env.ANTHROPIC_API_KEY
      modelName: "claude-v1-100k",
      completiontokens: 10000,
      modeltokens: 100000,
    });
    const files = diff_code.split(" ");
    const tempdiff = diff_file.split("diff --git");
    const diffs = tempdiff.slice(1);
    var output = "";

    const codeQueries = [];

    for (let i = 0; i < files.length; i++) {
      const codeQuery = { diff: diffs[i], file: files[i] };
      codeQueries.push(codeQuery);
    }

    for (var codeQuery of codeQueries) {
      const parsed_url = `https://github.com/${ghurl}/blob/main/${codeQuery.file}`;
      core.info(
        `codequery diff is: ${codeQuery.diff} file is: ${codeQuery.file}`
      );
      core.info(parsed_url);
      const review_code = await getTextFromGitHub(parsed_url);

      const template =
        "Given this {code} Pretend you're a rigorous code reviewer who can analyze and comment on any code to prevent security violations, improve code quality, and enforce coding best practices.\n*CODE SUMMARY:*\nDescribe what type of code this is including the language and purpose.\n*CODE REVIEW:*\n*1. Observation: blah blah blah*\n        - Reasoning:\n        - Code Example:  \n        - Code Recommendation:  ";
      const prompt = new PromptTemplate({
        template: template,
        inputVariables: ["code"],
      });
      core.info(review_code);
      const chain = new LLMChain({ llm: model, prompt: prompt });
      const chain_res = await chain.call({ code: review_code });
      //second chain
      const template1 =
        "Below is a source code file followed by a DIFF showing what the developer has changed in the source code. Please describe the changes made by the developer, whether these changes improve code or make it worse. Explain your reasoning. \n\nFULL SOURCE CODE:{code} \n\nDIFF:{diff}";
      const prompt2 = new PromptTemplate({
        template: template1,
        inputVariables: ["code", "diff"],
      });
      const strTemplate = `PROMPT:\nBelow is a source code file followed by a DIFF showing what the developer has changed in the source code. Please describe the changes made by the developer, whether these changes improve code or make it worse. Explain your reasoning. \n\nFULL SOURCE CODE:\n${review_code}\nDIFF\n:${codeQuery.diff}\n\n`;
      const chain2 = new LLMChain({ llm: model, prompt: prompt2 });
      const chain_res2 = await chain2.call({
        code: review_code,
        diff: codeQuery.diff,
      });
      output += `SOURCE: ${parsed_url} \n${chain_res.text}\n\nANALYSIS OF CODE CHANGES:\n${chain_res2.text}\n${strTemplate}`;
    }

    // Output after the loop
    core.info(output);
    var parsedOutput = output
      .replace(/```/g, "'''")
      .replace(/`/g, "'")
      .replace(/$/g, "\\$")
      .replace(/${/g, "\\${");

    core.setOutput("openai_review", parsedOutput);
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
