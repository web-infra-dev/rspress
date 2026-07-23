import { type ReactNode, useEffect, useState } from 'react';
import { useStorageValue } from '../../logic/useStorageValue';

const TTL_MS = 60 * 60 * 1000;

type Cached = { count: number; fetchedAt: number };

function storageKey(repo: string) {
  return `rp-github-stars:${repo}`;
}

function parseRepo(content: string): string | null {
  try {
    const url = new URL(content);
    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'github.com') return null;
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
  } catch {
    return null;
  }
}

function parseCache(raw: string | null): Cached | null {
  try {
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

function createCacheValue(count: number): string {
  return JSON.stringify({ count, fetchedAt: Date.now() });
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
  icon: ReactNode;
}

export const GithubStars = (props: GithubStarsProps) => {
  const { content, icon } = props;
  const repo = parseRepo(content);

  const [rawCache, setRawCache] = useStorageValue<string | null>(
    repo ? storageKey(repo) : '',
    null,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!repo) {
      setCount(null);
      return;
    }

    if (!isMounted) return;

    const cached = parseCache(rawCache);
    if (cached) {
      setCount(cached.count);
      if (Date.now() - cached.fetchedAt < TTL_MS) {
        return;
      }
    } else {
      setCount(null);
    }

    let cancelled = false;
    fetch(`https://api.github.com/repos/${repo}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { stargazers_count: number }) => {
        if (cancelled) return;
        if (typeof data?.stargazers_count === 'number') {
          setCount(data.stargazers_count);
          try {
            setRawCache(createCacheValue(data.stargazers_count));
          } catch {
            // Storage may be full or disabled (private mode); ignore.
          }
        }
      })
      .catch(() => {
        // GitHub API failed (network, rate limit). Fall back to icon-only.
      });
    return () => {
      cancelled = true;
    };
  }, [isMounted, rawCache, repo, setRawCache]);

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
