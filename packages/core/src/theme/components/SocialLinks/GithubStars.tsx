import { useEffect, useState } from 'react';

const TTL_MS = 60 * 60 * 1000;

type Cached = { count: number; fetchedAt: number };

function storageKey(repo: string) {
  return `rp-github-stars:${repo}`;
}

function parseRepo(content: string): string | null {
  try {
    const url = new URL(content);
    if (url.hostname !== 'github.com') return null;
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
  } catch {
    return null;
  }
}

function readCache(repo: string): Cached | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(repo));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (
      typeof parsed?.count !== 'number' ||
      typeof parsed?.fetchedAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(repo: string, count: number) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      storageKey(repo),
      JSON.stringify({ count, fetchedAt: Date.now() }),
    );
  } catch {
    // Storage may be full or disabled (private mode); ignore.
  }
}

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
}

interface GithubStarsProps {
  content: string;
  icon: React.ReactNode;
}

export const GithubStars = (props: GithubStarsProps) => {
  const { content, icon } = props;
  const repo = parseRepo(content);

  const [count, setCount] = useState<number | null>(() =>
    repo ? readCache(repo)?.count ?? null : null,
  );

  useEffect(() => {
    if (!repo) return;
    const cached = readCache(repo);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return;

    let cancelled = false;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { stargazers_count: number }) => {
        if (cancelled) return;
        if (typeof data?.stargazers_count === 'number') {
          setCount(data.stargazers_count);
          writeCache(repo, data.stargazers_count);
        }
      })
      .catch(() => {
        // GitHub API failed (network, rate limit). Fall back to icon-only.
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return (
    <a
      href={content}
      target="_blank"
      rel="noopener noreferrer"
      className="rp-social-links__item rp-social-links__github-stars"
      aria-label={
        count == null
          ? 'GitHub repository'
          : `GitHub repository, ${count.toLocaleString()} stars`
      }
    >
      <div className="rp-social-links__icon">{icon}</div>
      {count != null && (
        <span className="rp-social-links__github-stars-count">
          {formatCount(count)}
        </span>
      )}
    </a>
  );
};
