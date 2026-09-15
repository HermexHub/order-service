import { registerAs } from '@nestjs/config'

export default registerAs('rabbitmq', () => ({
	url:
		process.env.RABBITMQ_URL ||
		'amqp://hermex_user:hermex_password@localhost:5672'
}))
