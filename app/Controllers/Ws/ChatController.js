'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const debug = require('debug')('socket')

class ChatController {
  constructor ({ socket, request, auth }) {
    this.socket = socket
    this.request = request
    this.user = auth.user
    this.onReady()
  }

  async onReady () {
    debug('User connected', this.user._id, this.socket.id)
    this.socket.toMe().emit('ready')
  }

  async onHunting () {
    debug(this.user._id, this.socket.id, 'Incoming', 'hunting/start')
    this.socket.emit('huntingBegin')
    debug(this.user._id, this.socket.id, 'Outgoing', 'hunting/begin')
  }

  async onV1HuntingStop () {
    debug(this.user._id, this.socket.id, 'Incoming', 'hunting/stop')
    setTimeout(() => {
      this.socket.emit('huntingStop')
      debug(this.user._id, this.socket.id, 'Outgoing', 'hunting/stop')
    }, 1000)
  }
}

module.exports = ChatController
