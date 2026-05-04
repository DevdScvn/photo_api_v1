import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { logger } from "./logging"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prismaClient = new PrismaClient({
    adapter,
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
})

prismaClient.$on('query', (e) => {
    logger.info(e)
})

prismaClient.$on('error', (e) => {
    logger.error(e)
})

prismaClient.$on('info', (e) => {
    logger.info(e)
})

prismaClient.$on('warn', (e) => {
    logger.warn(e)
})