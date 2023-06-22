const core = require("@actions/core");
const github = require("@actions/github");
const AI_API_KEY = core.getInput("openai_api_key", { required: true }) || "";
const AI_MODEL = core.getInput("openai_model") || "gpt-3.5-turbo";
const DIFF_FROM = core.getInput("diff_from") || "HEAD~1";
const DIFF_TO = core.getInput("diff_to") || "HEAD";

(async () => {
  try {
    core.debug(`Diff from: ${DIFF_FROM}`);
    core.debug(`Diff to: ${DIFF_TO}`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
