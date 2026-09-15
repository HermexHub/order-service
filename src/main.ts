import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ORDER_PACKAGE_NAME, ORDER_PROTO_PATH } from '@hermex/contracts'
import { AppModule } from './app.module'

async function bootstrap() {
	const logger = new Logger('OrderServiceBootstrap')

	const appContext = await NestFactory.createApplicationContext(AppModule)
	const configService = appContext.get(ConfigService)
	const grpcPort = configService.get<number>('app.grpcPort', 50051)
	await appContext.close()

	const app = await NestFactory.createMicroservice<MicroserviceOptions>(
		AppModule,
		{
			transport: Transport.GRPC,
			options: {
				package: ORDER_PACKAGE_NAME,
				protoPath: ORDER_PROTO_PATH,
				url: `0.0.0.0:${grpcPort}`
			}
		}
	)

	await app.listen()
	logger.log(
		`🚀 Order Service gRPC microservice is running on: 0.0.0.0:${grpcPort}`
	)
}

bootstrap()

