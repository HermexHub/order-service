import { registerAs } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export default registerAs(
	'database',
	(): TypeOrmModuleOptions => ({
		type: 'postgres',
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '5433', 10),
		username: process.env.DB_USERNAME || 'hermex_admin',
		password: process.env.DB_PASSWORD || 'hermex_password',
		database: process.env.DB_NAME || 'orders_db',
		autoLoadEntities: true,
		synchronize: process.env.NODE_ENV !== 'production',
		logging: process.env.NODE_ENV === 'development'
	})
)
