import { Injectable } from '@nestjs/common'
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class MetricsService {
	private readonly registry: Registry

	public readonly ordersTotal: Counter<string>
	public readonly sagaDuration: Histogram<string>
	public readonly grpcRequestsTotal: Counter<string>

	constructor() {
		this.registry = new Registry()

		// System and process metrics
		collectDefaultMetrics({
			register: this.registry,
			prefix: 'hermex_'
		})

		this.ordersTotal = new Counter({
			name: 'hermex_orders_total',
			help: 'Total number of orders by status (created, confirmed, cancelled)',
			labelNames: ['status'],
			registers: [this.registry]
		})

		this.sagaDuration = new Histogram({
			name: 'hermex_saga_duration_seconds',
			help: 'End-to-end Saga transaction completion duration in seconds',
			labelNames: ['status'],
			buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
			registers: [this.registry]
		})

		this.grpcRequestsTotal = new Counter({
			name: 'hermex_order_grpc_requests_total',
			help: 'Total gRPC requests processed by Order Service',
			labelNames: ['method', 'status'],
			registers: [this.registry]
		})
	}

	recordOrderCreated(): void {
		this.ordersTotal.inc({ status: 'created' })
	}

	recordSagaFinished(status: 'confirmed' | 'cancelled', durationSeconds: number): void {
		this.ordersTotal.inc({ status })
		this.sagaDuration.observe({ status }, durationSeconds)
	}

	recordGrpcCall(method: string, status: 'success' | 'error'): void {
		this.grpcRequestsTotal.inc({ method, status })
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics()
	}

	getContentType(): string {
		return this.registry.contentType
	}
}
