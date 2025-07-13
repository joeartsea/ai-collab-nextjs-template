const Anthropic = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ISSUE_COMMENT = process.env.ISSUE_COMMENT;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER, 10);
const REPO_INFO = process.env.GITHUB_REPOSITORY.split('/');
const COMMENT_AUTHOR = process.env.COMMENT_AUTHOR;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function run() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  const userPrompt = ISSUE_COMMENT.replace('@claude-code', '').trim();

  const msg = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229', // Or another Claude 3 model
    max_tokens: 1024,
    messages: [{ role: 'user', content: `GitHub issue comment: "${userPrompt}". Please provide a concise response.` }],
  });

  const aiResponse = msg.content[0].text;
  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of Claude Code:\n\n${aiResponse}`;

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
