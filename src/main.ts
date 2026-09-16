import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ORDER_PACKAGE_NAME, ORDER_PROTO_PATH } from '@hermex/contracts'
import { AppModule } from './app.module'
import { GrpcTraceInterceptor, HermexLogger } from '@hermex/core'

async function bootstrap() {
	const hermexLogger = new HermexLogger({ serviceName: 'order-service' })
	const logger = new Logger('OrderServiceBootstrap')

	// Bootstrap Hybrid Application: gRPC Microservice + Internal Metrics Server
	const app = await NestFactory.create(AppModule, {
		logger: hermexLogger
	})

	const configService = app.get(ConfigService)
	const grpcHost = configService.get<string>('app.grpcHost') || '0.0.0.0'
	const grpcPort = configService.get<number>('app.grpcPort') || 50051
	const metricsPort = configService.get<number>('app.metricsPort') || 3001

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: ORDER_PACKAGE_NAME,
			protoPath: ORDER_PROTO_PATH,
			url: `${grpcHost}:${grpcPort}`
		}
	})

	app.useLogger(hermexLogger)
	app.useGlobalInterceptors(new GrpcTraceInterceptor())
	app.enableShutdownHooks()

	await app.startAllMicroservices()
	await app.listen(metricsPort, '0.0.0.0')

	logger.log(
		`🚀 Order Service gRPC microservice is running on: ${grpcHost}:${grpcPort}`
	)
	logger.log(
		`📊 Order Service internal metrics listening on: http://0.0.0.0:${metricsPort}/metrics`
	)
}

bootstrap()
