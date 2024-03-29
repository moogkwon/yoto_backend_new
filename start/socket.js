const Ws = use('Ws')

const globalMiddlewareWs = [
  'Adonis/Middleware/AuthInitWs'
]

const namedMiddlewareWs = {
  auth: 'Adonis/Middleware/AuthWs'
}

Ws.global(globalMiddlewareWs)
Ws.named(namedMiddlewareWs)

Ws.channel('/chat', 'ChatController')
  .middleware('auth:jwt')

Ws.channel('/summary', 'SummaryController')
  .middleware('auth:jwt')
