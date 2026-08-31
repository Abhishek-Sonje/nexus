import { LockKeyhole, Radar } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-instrument" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">
          <Radar size={22} strokeWidth={1.6} />
        </div>
        <div>
          <p className="product-wordmark">Nexus</p>
          <h1 id="login-title">Enter the observatory</h1>
          <p className="login-copy">
            Private access to reproducible synthetic network findings. Evidence
            is read-only; scores are deterministic.
          </p>
        </div>
        <form action="/api/session" method="post" className="login-form">
          <input
            type="hidden"
            name="returnTo"
            value={
              params.returnTo?.startsWith('/') &&
              !params.returnTo.startsWith('//')
                ? params.returnTo
                : '/'
            }
          />
          <label htmlFor="password">Workspace password</label>
          <div className="password-field">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>
          {params.error ? (
            <p className="form-error" role="alert">
              Access denied. Check the workspace password and try again.
            </p>
          ) : null}
          <button type="submit">Open workspace</button>
        </form>
        <p className="login-footnote">
          Synthetic data only · Investigator access
        </p>
      </section>
    </main>
  );
}
