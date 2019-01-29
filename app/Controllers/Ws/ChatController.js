'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const Logger = use('Logger')

class ChatController {
  constructor ({ socket, request, auth }) {
    if (String(auth.user._id) !== socket.topic.split(':')[1]) {
      socket.emit('error', 'Invalid topic subscription. You may only subscribe to your own topic.')
      console.log('Invalid topic subscription. You may only subscribe to your own topic.', auth.user._id, socket.topic)
      socket.close()
    } else {
      this.socket = socket
      this.request = request
      this.user = auth.user
      console.log('topic event connected', auth.user._id)
    }
  }

  onStartHunting () {
    Logger.info(this.user._id, this.socket._id, 'Incoming', 'hunting/start')
    setTimeout(() => {
      this.socket.emit('huntingBegin')
      Logger.info(this.user._id, this.socket._id, 'Outgoing', 'hunting/begin')
    }, 1000)
  }

  onStopHunting () {
    Logger.info(this.user._id, this.socket._id, 'Incoming', 'hunting/stop')
    setTimeout(() => {
      this.socket.emit('huntingStop')
      Logger.info(this.user._id, this.socket._id, 'Outgoing', 'hunting/stop')
    }, 1000)
  }
}

module.exports = ChatController
