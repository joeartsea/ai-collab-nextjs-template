# AI Collaboration Next.js Template

This is a template repository for a Next.js project that demonstrates how to integrate multiple AI assistants (Gemini, OpenAI, Claude) into your GitHub workflow. You can mention these assistants in an issue comment to get help with code generation, reviews, or general questions.

## How It Works

This project uses a GitHub Actions workflow defined in `.github/workflows/ai_assistant.yml`.

1.  **Trigger**: The workflow is triggered whenever a new comment is created on any issue in the repository.
2.  **Routing**: The workflow has three separate jobs, one for each AI. An `if` condition checks if the comment body contains a specific mention:
    - `@gemini-cli` triggers the Gemini job.
    - `@openai-codex` triggers the OpenAI job.
    - `@claude-code` triggers the Claude job.
3.  **Execution**: The corresponding job checks out the code, installs the necessary AI SDK, and runs a handler script from `.github/scripts/`.
4.  **AI Interaction**: The handler script takes the user's comment, sends it to the respective AI API, and gets a response.
5.  **Feedback**: The script then uses the GitHub API to post the AI's response back as a new comment on the issue.

## Getting Started

To use this template for your own project:

1.  **Create a new repository from this template.**
2.  **Set up the required API Key Secrets.** This is the most important step. Go to your repository's `Settings` > `Secrets and variables` > `Actions` and create the following repository secrets:
    - `GEMINI_API_KEY`: Your API key for the Google AI (Gemini) API.
    - `OPENAI_API_KEY`: Your API key for the OpenAI API.
    - `ANTHROPIC_API_KEY`: Your API key for the Anthropic (Claude) API.

    *Note: You only need to set the secrets for the AIs you intend to use.*

3.  **Create a new issue and test it!**

## How to Use

1.  Open any issue in your repository (or create a new one).
2.  In a comment, ask a question and mention the AI assistant you want to use.

### Examples

**Code Generation:**
```
@gemini-cli please write a TypeScript function that takes a user object and returns the full name.
```

**Code Review:**
```
@openai-codex can you review the code in `src/app/page.tsx` and suggest improvements for accessibility?
```
*(Note: The current scripts are basic and don't pass file context. To implement a full code review, you would need to enhance the handler scripts to read file contents and include them in the prompt to the AI.)*

**General Question:**
```
@claude-code what are the pros and cons of server-side rendering vs static site generation in Next.js?
```

## Customization

-   **Models**: You can change the AI models used. Go to your repository's `Settings` > `Secrets and variables` > `Actions`, then under the `Variables` tab, you can create the following variables to override the defaults:
    -   `GEMINI_MODEL` (default: `gemini-1.5-flash-latest`)
    -   `OPENAI_MODEL` (default: `gpt-4-turbo`)
    -   `CLAUDE_MODEL` (default: `claude-3-sonnet-20240229`)
-   **Prompts**: The prompts sent to the AIs are very basic. You can edit the handler scripts in `.github/scripts/` to create more sophisticated prompts that include more context (e.g., the issue title, other comments, or even code from the repository).
-   **Mentions**: You can change the mention triggers by editing the `if` condition in `.github/workflows/ai_assistant.yml`.