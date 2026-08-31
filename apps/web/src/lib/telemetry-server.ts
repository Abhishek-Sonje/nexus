import { SpanStatusCode, trace } from '@opentelemetry/api';
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

const tracer = trace.getTracer('nexus-web');
const TELEMETRY_KEY = Symbol.for('nexus.web.telemetry');

type TelemetryGlobal = typeof globalThis & { [TELEMETRY_KEY]?: NodeSDK };

function signalUrl(endpoint: string, signal: 'traces' | 'metrics'): string {
  return `${endpoint.replace(/\/$/, '')}/v1/${signal}`;
}

export function initializeServerTelemetry(): NodeSDK | null {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return null;
  const state = globalThis as TelemetryGlobal;
  if (state[TELEMETRY_KEY]) return state[TELEMETRY_KEY];
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'nexus-web',
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
  state[TELEMETRY_KEY] = sdk;
  return sdk;
}

export async function withServerSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: unknown) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
