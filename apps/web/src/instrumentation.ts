export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { initializeServerTelemetry } = await import('./lib/telemetry-server');
  initializeServerTelemetry();
}
