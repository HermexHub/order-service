import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import appConfig from './config/app.config'
import databaseConfig from './config/database.config'
import rabbitmqConfig from './config/rabbitmq.config'
import { OrdersModule } from './modules/orders/orders.module'
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [appConfig, databaseConfig, rabbitmqConfig]
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => config.get('database')!
		}),
		RabbitMQModule,
		OrdersModule
	]
})
export class AppModule {}
