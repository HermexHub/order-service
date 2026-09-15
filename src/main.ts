import { Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ORDER_PACKAGE_NAME, ORDER_PROTO_PATH } from '@hermex/contracts'
import { AppModule } from './app.module'
import appConfig from './config/app.config'
import { validateEnv } from './config/env.validation'

async function bootstrap() {
	const logger = new Logger('OrderServiceBootstrap')

	// Load and validate configuration independently without initializing AppModule side-effects
	const configContext = await NestFactory.createApplicationContext(
		ConfigModule.forRoot({
			envFilePath: [
				`.env.${process.env.NODE_ENV}.local`,
				`.env.${process.env.NODE_ENV}`,
				'.env'
			],
			validate: validateEnv,
			load: [appConfig]
		})
	)

	const configService = configContext.get(ConfigService)
	const grpcHost = configService.get<string>('app.grpcHost')!
	const grpcPort = configService.get<number>('app.grpcPort')!
	await configContext.close()

	// Bootstrap pure gRPC microservice without HTTP drivers
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(
		AppModule,
		{
			transport: Transport.GRPC,
			options: {
				package: ORDER_PACKAGE_NAME,
				protoPath: ORDER_PROTO_PATH,
				url: `${grpcHost}:${grpcPort}`
			}
		}
	)

	await app.listen()

	logger.log(
		`🚀 Order Service gRPC microservice is running on: ${grpcHost}:${grpcPort}`
	)
}

bootstrap()
