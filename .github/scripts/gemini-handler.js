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

  // Fetch the last 10 comments from the issue
  const { data: comments } = await octokit.issues.listComments({
    owner: REPO_INFO[0],
    repo: REPO_INFO[1],
    issue_number: ISSUE_NUMBER,
    per_page: 10,
    page: 1, // Fetching the most recent page
  });

  // Format the conversation history
  const formattedHistory = comments.map(comment => 
    `User @${comment.user.login} said:
${comment.body}`
  ).join('\n\n---\n\n');
  
  const userPrompt = ISSUE_COMMENT.replace('@gemini-cli', '').trim();

  const finalPrompt = `You are an AI assistant in a GitHub issue. Please review the following recent conversation history and provide a helpful and context-aware response to the last comment.\n\n<CONVERSATION_HISTORY>\n${formattedHistory}\n</CONVERSATION_HISTORY>\n\nBased on the conversation, provide a concise and relevant response to the user's request: "${userPrompt}"`;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
  const result = await model.generateContent(finalPrompt);
  const aiResponse = await result.response.text();

  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of Gemini CLI (context-aware):\n\n${aiResponse}`;

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
