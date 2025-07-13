const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ISSUE_COMMENT = process.env.ISSUE_COMMENT;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER, 10);
const REPO_INFO = process.env.GITHUB_REPOSITORY.split('/');
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
const COMMENT_AUTHOR = process.env.COMMENT_AUTHOR;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function run() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const userPrompt = ISSUE_COMMENT.replace('@gemini-cli', '').trim();
  
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
  const result = await model.generateContent(`GitHub issue comment: "${userPrompt}". Please provide a concise response.`);
  const aiResponse = await result.response.text();

  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of Gemini CLI:\n\n${aiResponse}`;

  await octokit.issues.createComment({
    owner: REPO_INFO[0],
    repo: REPO_INFO[1],
    issue_number: ISSUE_NUMBER,
    body: responseMessage,
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});