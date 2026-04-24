import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { DATABASE_URL } from './env'

const { PrismaClient } = pkg

const adapter = new PrismaPg({
	connectionString: DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

export default prisma
