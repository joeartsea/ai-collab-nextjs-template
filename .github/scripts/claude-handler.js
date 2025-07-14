const Anthropic = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL_NAME = process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';
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

  // Fetch the last 10 comments
  const { data: comments } = await octokit.issues.listComments({
    owner: REPO_INFO[0],
    repo: REPO_INFO[1],
    issue_number: ISSUE_NUMBER,
    per_page: 10,
  });

  // Format history for Claude's messages API
  const messages = comments.map(comment => ({
    role: comment.user.login === 'github-actions[bot]' ? 'assistant' : 'user',
    content: `User @${comment.user.login} said: ${comment.body}`,
  }));
  
  const userPrompt = ISSUE_COMMENT.replace('@claude-code', '').trim();
  messages.push({ role: 'user', content: userPrompt });

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL_NAME,
    max_tokens: 2048, // Increased max_tokens to handle longer context
    system: 'You are a helpful coding assistant in a GitHub issue. Review the conversation and respond to the last user comment.',
    messages: messages,
  });

  const aiResponse = msg.content[0].text;
  const responseMessage = `> Replying to @${COMMENT_AUTHOR} on behalf of Claude Code (context-aware):\n\n${aiResponse}`;

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
