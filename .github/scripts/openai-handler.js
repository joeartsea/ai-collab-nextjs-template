const { OpenAI } = require('openai');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4-turbo';
const ISSUE_COMMENT = process.env.ISSUE_COMMENT;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER, 10);
const REPO_INFO = process.env.GITHUB_REPOSITORY.split('/');
const COMMENT_AUTHOR = process.env.COMMENT_AUTHOR;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function run() {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  // Fetch the last 10 comments
  const { data: comments } = await octokit.issues.listComments({
    owner: REPO_INFO[0],
    repo: REPO_INFO[1],
    issue_number: ISSUE_NUMBER,
    per_page: 10,
  });

  // Format history for OpenAI's chat model
  const messages = comments.map(comment => ({
    role: comment.user.login === 'github-actions[bot]' ? 'assistant' : 'user',
    content: `User @${comment.user.login} said: ${comment.body}`,
  }));

  // Add the system prompt and the current user's request
  const systemPrompt = { role: 'system', content: 'You are a helpful coding assistant in a GitHub issue. Review the conversation and respond to the last comment.' };
  const userPrompt = ISSUE_COMMENT.replace('@openai-codex', '').trim();
  messages.push({ role: 'user', content: userPrompt });

  const completion = await openai.chat.completions.create({
    messages: [systemPrompt, ...messages],
    model: OPENAI_MODEL_NAME,
  });

  const aiResponse = completion.choices[0].message.content;
  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of OpenAI Codex (context-aware):\n\n${aiResponse}`;

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
