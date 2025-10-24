const fastify = require('fastify')({ logger: true })

fastify.get('/health', async () => {
  return { status: 'ok', service: 'gateway' }
})

fastify.get('/', async (request, reply) => {
  return { message: 'Gateway ok' }
})

const start = async () => {
  try {
    await fastify.listen({ port: 4001, host: '0.0.0.0' })
    fastify.log.info('Gateway running on http://localhost:4001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
