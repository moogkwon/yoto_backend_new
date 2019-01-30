'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const debug = require('debug')('socket')
const Ws = use('Ws')
const Redis = use('Redis')

class ChatController {
  /**
   * Constructor
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  constructor ({ socket, request, auth }) {
    this.device_id = request.input('device_id')
    this.socket = socket
    this.request = request
    this.user = auth.user
    debug('User connecting', this.user._id, this.socket.id)
    this.onReady()
  }

  async onReady () {
    const chatChannel = Ws.channel('/chat')
    const oldSocketId = await Redis.hget(`users`, String(this.user._id))
    const oldSocket = chatChannel.get(oldSocketId)
    if (oldSocket) {
      if (this.device_id === oldSocket._socket.handshake.query.device_id) {
        debug('duplicate connection on same device', this.user._id, this.socket.id, oldSocket.id)
      } else {
        debug('User logging in with other device', this.user._id, this.socket.id, oldSocket.id)
        oldSocket.socket.toMe().emit('v1_user_login_other_device', {
          user_id: this.user._id,
          new_socket_id: this.socket.id,
          old_socket_id: oldSocket.id,
          new_device_id: this.device_id,
          old_device_id: oldSocket._socket.handshake.query.device_id
        })
      }
      oldSocket.socket.disconnect()
    }
    await Redis.hset(`users`, String(this.user._id), this.socket.id)
    this.socket.toMe().emit('ready')
    debug('Connection ready', this.user._id, this.socket.id)
  }

  async on_v1_hunting_start () { // eslint-disable-line
    debug('Incoming', '_v1_hunting_start', this.user._id, this.socket.id)
    this.socket.toEveryone().emit('v1_hunting_begin', this.user.toJSON())
    debug('Outgoing', 'v1_hunting_begin', this.user._id, this.socket.id)
  }

  async on_v1_hunting_stop () { // eslint-disable-line
    debug('Incoming', '_v1_hunting_stop', this.user._id, this.socket.id)
    this.socket.toEveryone().emit('v1_hunting_end', this.user.toJSON())
    debug('Outgoing', 'v1_hunting_end', this.user._id, this.socket.id)
  }

  async onDisconnect () {
    debug('User disconnected', this.user._id, this.socket.id)
  }
}

module.exports = ChatController
