import {
	Injectable,
	Logger,
	NotFoundException,
	OnApplicationBootstrap
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import {
	BaseEvent,
	CreateOrderRequest,
	CreateOrderResponse,
	GetOrderResponse,
	OrderCreatedPayload,
	OrderRoutingKeys,
	OrderStatus,
	PaymentFailedPayload,
	PaymentSucceededPayload,
	RabbitExchanges,
	RabbitQueues
} from '@hermex/contracts'
import { MetricsService } from '../metrics/metrics.service'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { OrderItemEntity } from './entities/order-item.entity'
import { OrderEntity } from './entities/order.entity'

@Injectable()
export class OrdersService implements OnApplicationBootstrap {
	private readonly logger = new Logger(OrdersService.name)

	constructor(
		@InjectRepository(OrderEntity)
		private readonly orderRepository: Repository<OrderEntity>,
		@InjectRepository(OrderItemEntity)
		private readonly orderItemRepository: Repository<OrderItemEntity>,
		private readonly rabbitMQService: RabbitMQService,
		private readonly metricsService: MetricsService
	) {}

	async onApplicationBootstrap(): Promise<void> {
		await this.listenToSagaEvents()
	}

	async createOrder(
		request: CreateOrderRequest,
		correlationId: string = uuidv4()
	): Promise<CreateOrderResponse> {
		const items = request.items || []
		const totalAmount = items.reduce(
			(sum, item) => sum + item.quantity * item.price,
			0
		)

		const order = this.orderRepository.create({
			userId: request.userId,
			status: OrderStatus.PENDING,
			totalAmount,
			currency: 'USD',
			deliveryAddress: request.deliveryAddress
		})

		const savedOrder = await this.orderRepository.save(order)

		const orderItems = items.map((item) =>
			this.orderItemRepository.create({
				orderId: savedOrder.id,
				order: savedOrder,
				productId: item.productId,
				quantity: item.quantity,
				price: item.price
			})
		)
		savedOrder.items = await this.orderItemRepository.save(orderItems)


		this.logger.log(
			`Order created with ID: ${savedOrder.id} in PENDING state (Correlation: ${correlationId})`
		)

		// Publish Saga start event: order.created
		const orderCreatedEvent: BaseEvent<OrderCreatedPayload> = {
			eventId: uuidv4(),
			correlationId,
			timestamp: new Date().toISOString(),
			payload: {
				orderId: savedOrder.id,
				userId: savedOrder.userId,
				items: savedOrder.items.map((i) => ({
					productId: i.productId,
					quantity: i.quantity,
					price: Number(i.price)
				})),
				totalAmount: Number(savedOrder.totalAmount),
				currency: savedOrder.currency
			}
		}

		this.rabbitMQService.publishEvent(
			RabbitExchanges.ORDER,
			OrderRoutingKeys.CREATED,
			orderCreatedEvent
		)

		this.metricsService.recordOrderCreated()

		return {
			orderId: savedOrder.id,
			status: savedOrder.status,
			totalAmount: Number(savedOrder.totalAmount),
			currency: savedOrder.currency,
			createdAt: savedOrder.createdAt.toISOString()
		}
	}

	async getOrder(orderId: string): Promise<GetOrderResponse> {
		const order = await this.orderRepository.findOne({
			where: { id: orderId },
			relations: ['items']
		})

		if (!order) {
			throw new NotFoundException(`Order with ID ${orderId} not found`)
		}

		return {
			orderId: order.id,
			userId: order.userId,
			status: order.status,
			totalAmount: Number(order.totalAmount),
			currency: order.currency,
			items: order.items.map((i) => ({
				productId: i.productId,
				quantity: i.quantity,
				price: Number(i.price)
			})),
			deliveryAddress: order.deliveryAddress,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString()
		}
	}

	async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
		const order = await this.orderRepository.findOne({ where: { id: orderId } })
		if (!order) {
			this.logger.warn(
				`Cannot update order status: Order ${orderId} not found`
			)
			return
		}

		order.status = status
		await this.orderRepository.save(order)
		this.logger.log(`Order ${orderId} status updated to: ${status}`)

		if (status === OrderStatus.CONFIRMED || status === OrderStatus.CANCELLED) {
			const durationSeconds =
				(Date.now() - new Date(order.createdAt).getTime()) / 1000
			this.metricsService.recordSagaFinished(
				status === OrderStatus.CONFIRMED ? 'confirmed' : 'cancelled',
				Math.max(durationSeconds, 0.001)
			)
		}
	}

	private async listenToSagaEvents(): Promise<void> {
		await this.rabbitMQService.consumeEvents<
			PaymentSucceededPayload | PaymentFailedPayload
		>(RabbitQueues.ORDER_PAYMENT_EVENTS, async (event) => {
			const payload = event.payload
			if ('paymentId' in payload) {
				// Payment succeeded -> Order CONFIRMED
				this.logger.log(
					`[Saga Success] Payment confirmed for Order ${payload.orderId}`
				)
				await this.updateOrderStatus(payload.orderId, OrderStatus.CONFIRMED)
			} else {
				// Payment or Inventory failed -> Order CANCELLED
				this.logger.log(
					`[Saga Rollback] Order ${payload.orderId} failed: ${(payload as PaymentFailedPayload).reason}`
				)
				await this.updateOrderStatus(payload.orderId, OrderStatus.CANCELLED)
			}
		})
	}
}
