import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import {
	CreateOrderRequest,
	CreateOrderResponse,
	GetOrderRequest,
	GetOrderResponse,
	ORDER_SERVICE_NAME
} from '@hermex/contracts'
import { OrdersService } from './orders.service'

@Controller()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@GrpcMethod(ORDER_SERVICE_NAME, 'CreateOrder')
	async createOrder(
		data: CreateOrderRequest,
		metadata: Metadata
	): Promise<CreateOrderResponse> {
		const correlationIdHeader = metadata?.get('x-correlation-id')
		const correlationId =
			correlationIdHeader && correlationIdHeader.length > 0
				? (correlationIdHeader[0] as string)
				: undefined

		return this.ordersService.createOrder(data, correlationId)
	}

	@GrpcMethod(ORDER_SERVICE_NAME, 'GetOrder')
	async getOrder(data: GetOrderRequest): Promise<GetOrderResponse> {
		return this.ordersService.getOrder(data.orderId)
	}
}
