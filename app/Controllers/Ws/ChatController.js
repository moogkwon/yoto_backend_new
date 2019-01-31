'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const debug = require('debug')('socket')
const Ws = use('Ws')
const Redis = use('Redis')
const _ = require('lodash')

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
        oldSocket.socket.toMe().emit('user_login_other_device', {
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
    this.socket.toMe().emit('message', { message: 'your connection is ready' })
    debug('Connection ready', this.user._id, this.socket.id)

    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      this.socket.toMe().emit('matching_exists', { conversation_id: conversation._id })
    }
  }

  async on_hunting_start () { // eslint-disable-line
    debug('Incoming', '_hunting_start', this.user._id, this.socket.id)
    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      this.socket.toMe().emit('message', { message: 'existing conversation' })
      return false
    }
    await Redis.sadd('hunting', String(this.user._id))
    this.socket.toMe().emit('message', { message: 'you has joined hunting mode' })
    debug('Outgoing', 'hunting_start', this.user._id, this.socket.id)
  }

  async on_hunting_stop () { // eslint-disable-line
    debug('Incoming', '_hunting_stop', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        debug('Outgoing', 'message', userId, socket.id, { message: 'other user disconnected' })
        socket.socket.toMe().emit('conversation_close', { conversation_id: conversation._id, message: 'other user disconnected' })
        await Redis.sadd('hunting', String(userId))
      }
      conversation.status = 'rejected'
      await conversation.save()
    }
    await Redis.srem('hunting', String(this.user._id))
    this.socket.toMe().emit('message', { message: 'you have left hunting mode' })
    debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you have left hunting mode' })
  }

  async on_match_next () { // eslint-disable-line
    debug('Incoming', '_match_next', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        debug('Outgoing', 'message', userId, socket.id, { message: 'other user rejected' })
        socket.socket.toMe().emit('conversation_close', { conversation_id: conversation._id, message: 'other user rejected' })
        await Redis.sadd('hunting', String(userId))
      }
      conversation.status = 'rejected'
      await conversation.save()
    }
    await Redis.sadd('hunting', String(this.user._id))
    this.socket.toMe().emit('message', { message: 'you rejoined hunting mode' })
    debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you rejoined hunting mode' })
  }

  async on_match_accept (data) { // eslint-disable-line
    debug('Incoming', '_match_accept', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'waiting' }).first()
    if (conversation) {
      conversation.accepts[String(this.user._id)] = true
      conversation.offers[String(this.user._id)] = data.offer
      if (_.size(conversation.accepts) === 2) {
        // change conversation state
        conversation.status = 'calling'
        // find and emit calling to other user
        const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
        const socketid = await Redis.hget('users', userId)
        const socket = chatChannel.get(socketid)
        if (socket) {
          socket.socket.toMe().emit('call_start', {
            conversation_id: conversation._id,
            user_id: this.user._id,
            offer: conversation.offers[String(this.user._id)],
            message: 'prepare to call'
          })
          debug('Outgoing', 'call_start', userId, socket.id, {
            conversation_id: conversation._id,
            user_id: this.user._id,
            offer: conversation.offers[userId],
            message: 'prepare to call'
          })
        }

        // emit calling to current user
        this.socket.toMe().emit('call_start', {
          conversation_id: conversation._id,
          user_id: userId,
          message: 'prepare to call'
        })
        debug('Outgoing', 'call_start', this.user._id, this.socket.id, {
          conversation_id: conversation._id,
          user_id: userId,
          message: 'prepare to call'
        })
      } else {
        this.socket.toMe().emit('message', { message: 'waiting for other user accept/next' })
        debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'waiting for other user accept/next' })
      }
      await conversation.save()
    } else {
      this.socket.toMe().emit('message', { message: 'you are not matching with anyone' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not matching with anyone' })
    }
  }

  async on_update_sdp (data) { // eslint-disable-line
    debug('Incoming', '_update_sdp', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'calling' }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        socket.socket.toMe().emit('update_sdp', { sdp: data.sdp })
        debug('Outgoing', 'update_sdp', data.sdp)
      }
    } else {
      this.socket.toMe().emit('message', { message: 'you are not matching with anyone' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not matching with anyone' })
    }
  }

  async onDisconnect () {
    debug('User disconnected', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    if (this.socket.id === await Redis.hget('users', this.user._id)) {
      const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
      if (conversation) {
        const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
        const socketid = await Redis.hget('users', userId)
        const socket = chatChannel.get(socketid)
        if (socket) {
          debug('Outgoing', 'message', userId, socket.id, { message: 'other user disconnected' })
          socket.socket.toMe().emit('conversation_close', { conversation_id: conversation._id, message: 'other user disconnected' })
          await Redis.sadd('hunting', String(userId))
        }
        conversation.status = 'rejected'
        await conversation.save()
      }
      await Redis.hdel('users', this.user._id)
      await Redis.srem('hunting', this.user._id)
    }
  }
}

module.exports = ChatController
