import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV || 'development',
	grpcPort: parseInt(process.env.GRPC_PORT || '50051', 10)
}))
