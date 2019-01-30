const Ws = use('Ws')

Ws.channel('/chat', 'ChatController').middleware('auth:jwt')
