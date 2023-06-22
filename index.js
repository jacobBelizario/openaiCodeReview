const core = require("@actions/core");
const github = require("@actions/github");
const AI_API_KEY = core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const DIFF_FROM = core.getInput("diff_from") || "HEAD~1";
const DIFF_TO = core.getInput("diff_to") || "HEAD";
const current_sha = core.getInput("current_sha") || "none";
const ghurl = core.getInput("ghurl") || "https://github.com";

(async () => {
  try {
    core.info(`parsed url = https://github.com/${ghurl}/commit/${current_sha}`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
