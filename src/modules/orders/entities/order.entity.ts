import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { OrderStatus } from '@hermex/contracts'
import { OrderItemEntity } from './order-item.entity'

@Entity('orders')
export class OrderEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'uuid' })
	userId!: string

	@Column({
		type: 'enum',
		enum: OrderStatus,
		default: OrderStatus.PENDING
	})
	status!: OrderStatus

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	totalAmount!: number

	@Column({ type: 'varchar', length: 10, default: 'USD' })
	currency!: string

	@Column({ type: 'text', nullable: true })
	deliveryAddress?: string

	@OneToMany(() => OrderItemEntity, (item) => item.order, {
		cascade: true,
		eager: true
	})
	items!: OrderItemEntity[]

	@CreateDateColumn({ type: 'timestamp with time zone' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updatedAt!: Date
}
