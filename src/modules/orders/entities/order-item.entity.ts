import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm'
import { OrderEntity } from './order.entity'

@Entity('order_items')
export class OrderItemEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column({ type: 'uuid' })
	orderId: string

	@ManyToOne(() => OrderEntity, (order) => order.items, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'orderId' })
	order: OrderEntity

	@Column({ type: 'varchar', length: 100 })
	productId: string

	@Column({ type: 'int' })
	quantity: number

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	price: number
}
