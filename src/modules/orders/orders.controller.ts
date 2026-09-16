import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import {
	CreateOrderRequest,
	CreateOrderResponse,
	GetOrderRequest,
	GetOrderResponse,
	ORDER_GRPC_METHODS,
	ORDER_SERVICE_NAME
} from '@hermex/contracts'
import { CorrelationId } from '@hermex/core/decorators'
import { OrdersService } from './orders.service'

@Controller()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@GrpcMethod(ORDER_SERVICE_NAME, ORDER_GRPC_METHODS.CREATE_ORDER)
	async createOrder(
		data: CreateOrderRequest,
		@CorrelationId() correlationId?: string
	): Promise<CreateOrderResponse> {
		return this.ordersService.createOrder(data, correlationId)
	}

	@GrpcMethod(ORDER_SERVICE_NAME, ORDER_GRPC_METHODS.GET_ORDER)
	async getOrder(data: GetOrderRequest): Promise<GetOrderResponse> {
		return this.ordersService.getOrder(data.orderId)
	}
}
