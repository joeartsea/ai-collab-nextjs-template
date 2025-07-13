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

  const userPrompt = ISSUE_COMMENT.replace('@openai-codex', '').trim();

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful coding assistant.' },
      { role: 'user', content: `GitHub issue comment: "${userPrompt}". Please provide a concise response.` },
    ],
    model: OPENAI_MODEL_NAME,
  });

  const aiResponse = completion.choices[0].message.content;
  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of OpenAI Codex:\n\n${aiResponse}`;

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
