import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Attributes } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const tracer = trace.getTracer('nexus-worker');
const meter = metrics.getMeter('nexus-worker');
const completedRuns = meter.createCounter('nexus.analysis.runs.completed');
const failedRuns = meter.createCounter('nexus.analysis.runs.failed');
const queueLatency = meter.createHistogram('nexus.analysis.queue.latency', {
  unit: 'ms',
});
const stageDuration = meter.createHistogram('nexus.analysis.stage.duration', {
  unit: 'ms',
});

function signalUrl(endpoint: string, signal: 'traces' | 'metrics'): string {
  return `${endpoint.replace(/\/$/, '')}/v1/${signal}`;
}

export function initializeWorkerTelemetry(): NodeSDK | null {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return null;
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'nexus-worker',
      [ATTR_SERVICE_VERSION]: process.env.NEXUS_CODE_VERSION ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: signalUrl(endpoint, 'traces'),
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: signalUrl(endpoint, 'metrics') }),
      exportIntervalMillis: 15_000,
    }),
  });
  sdk.start();
  return sdk;
}

export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    const startedAt = performance.now();
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: unknown) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      stageDuration.record(performance.now() - startedAt, { stage: name });
      span.end();
    }
  });
}

export function recordQueueLatency(milliseconds: number, mode: string): void {
  queueLatency.record(milliseconds, { mode });
}

export function recordRunOutcome(
  outcome: 'completed' | 'failed',
  mode: string,
): void {
  const counter = outcome === 'completed' ? completedRuns : failedRuns;
  counter.add(1, { mode });
}
