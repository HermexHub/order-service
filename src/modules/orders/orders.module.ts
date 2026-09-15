import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrderItemEntity } from './entities/order-item.entity'
import { OrderEntity } from './entities/order.entity'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
	imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity])],
	controllers: [OrdersController],
	providers: [OrdersService],
	exports: [OrdersService]
})
export class OrdersModule {}
