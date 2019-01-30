'use strict'
const Helpers = use('Helpers')
if (!Helpers.isAceCommand()) {
  const ChatController = make('App/Controllers/Ws/ChatController')
  const Event = use('Event')
  const Server = use('Server')
  const Config = use('Config')
  const redis = require('socket.io-redis')

  const options = Config.get('socket')

  const io = use('socket.io')(Server.getInstance(), options)

  let redisConfig = Config.get('redis')
  redisConfig = redisConfig[redisConfig.connection]

  io.adapter(redis({ host: redisConfig.host, port: redisConfig.port }))

  io.sockets.setMaxListeners(0)
  Event.setMaxListeners(0)

  const chat = io.of('/chat')
  chat.on('connection', (socket) => {
    socket.setMaxListeners(0)
    const control = new ChatController(socket)
    socket.on('v1/hunting/start', (data) => {
      control.huntingStart(data)
    })
  })
}
