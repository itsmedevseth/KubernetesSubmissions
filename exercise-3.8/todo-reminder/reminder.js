'use strict';

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    console.error(`Missing required environment variable ${name}`);
    process.exit(1);
  }
  return value.trim();
}

const RANDOM_ARTICLE_URL = requireEnv('RANDOM_ARTICLE_URL');
const TODO_BACKEND_URL = requireEnv('TODO_BACKEND_URL');
const TODO_MAX_LENGTH = Number(requireEnv('TODO_MAX_LENGTH'));
const REMINDER_MAX_ATTEMPTS = Number(requireEnv('REMINDER_MAX_ATTEMPTS'));
const HTTP_USER_AGENT = requireEnv('HTTP_USER_AGENT');
const HTTP_TIMEOUT_MS = Number(requireEnv('HTTP_TIMEOUT_MS'));

async function getRandomArticleUrl() {
  const response = await fetch(RANDOM_ARTICLE_URL, {
    redirect: 'manual',
    headers: { 'User-Agent': HTTP_USER_AGENT },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  const location = response.headers.get('location');
  if (response.status < 300 || response.status >= 400 || !location) {
    throw new Error(`Expected a redirect with a Location header, got HTTP ${response.status}`);
  }
  return new URL(location, RANDOM_ARTICLE_URL).toString();
}

async function createTodo(text) {
  const response = await fetch(TODO_BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`todo-backend responded with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  for (let attempt = 1; attempt <= REMINDER_MAX_ATTEMPTS; attempt += 1) {
    const url = await getRandomArticleUrl();
    const text = `Read ${url}`;
    if (text.length > TODO_MAX_LENGTH) {
      console.log(`Skipping too long URL (${text.length} chars): ${url}`);
      continue;
    }
    const todo = await createTodo(text);
    console.log(`Created todo ${todo.id}: ${todo.text}`);
    return;
  }
  throw new Error(`No article URL short enough after ${REMINDER_MAX_ATTEMPTS} attempts`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
