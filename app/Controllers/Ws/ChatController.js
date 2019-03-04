'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const debug = require('debug')('socket')
const Ws = use('Ws')
const Redis = use('Redis')
const _ = require('lodash')
const User = use('App/Models/User')
const moment = require('moment')
const Config = use('Config')

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
    debug('=========================================================')
    const chatChannel = Ws.channel('/chat')
    const oldSocketId = await Redis.hget(`users`, String(this.user._id))
    const oldSocket = chatChannel.get(oldSocketId)
    if (oldSocket && oldSocket.id) {
      if (this.device_id === oldSocket._socket.handshake.query.device_id) {
        debug('duplicate connection on same device', this.user._id, this.socket.id, oldSocket.id)
      } else {
        debug('User logging in with other device', this.user._id, this.socket.id, oldSocket.id)
        oldSocket.socket.toMe().emit('login_other_device', {
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
      this.socket.toMe().emit('match_exists', { conversation_id: conversation._id })
      debug('Outgoing', 'match_exists', this.user._id, this.socket.id, { conversation_id: conversation._id })
    }

    const iceServers = Config.get('iceServer.iceServers')
    this.socket.toMe().emit('ice_server', { message: 'connected success', ice_servers: iceServers })
    debug('Outgoing', 'ice_server', this.user._id, this.socket.id, { message: 'connected success', ice_servers: iceServers })
    this.user.is_online = true
    await this.user.save()
  }

  async on_hunting_start () { // eslint-disable-line
    debug('=========================================================')
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
    debug('=========================================================')
    debug('Incoming', '_hunting_stop', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        debug('Outgoing', 'message', userId, socket.socket.id, { message: 'other user disconnected' })
        socket.socket.toMe().emit('match_close', { conversation_id: conversation._id, message: 'other user disconnected' })
        // await Redis.sadd('hunting', String(userId))
      }
      conversation.status = 'rejected'
      await conversation.save()
    }
    await Redis.srem('hunting', String(this.user._id))
    this.socket.toMe().emit('message', { message: 'you have left hunting mode' })
    debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you have left hunting mode' })
  }

  async on_match_next () { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_match_next', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        debug('Outgoing', 'message', userId, socket.socket.id, { message: 'other user rejected' })
        socket.socket.toMe().emit('match_close', { conversation_id: conversation._id, message: 'other user rejected' })
        // await Redis.sadd('hunting', String(userId))
      }
      conversation.status = 'rejected'
      await conversation.save()
    }
    // await Redis.sadd('hunting', String(this.user._id))
    this.socket.toMe().emit('message', { message: 'you sent next to server' })
    debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you sent next to server' })
  }

  async on_reaction (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_react', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const userId = data.user_id
    const socketid = await Redis.hget('users', userId)
    const socket = chatChannel.get(socketid)
    if (socket) {
      socket.socket.toMe().emit('react', data)
      debug('Outgoing', 'react', data)
    } else {
      socket.socket.toMe().emit('message', { message: 'other user not found' })
      debug('Outgoing', 'message', { message: 'other user not found' })
    }
  }

  async on_match_accept (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_match_accept', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'waiting' }).first()
    if (conversation) {
      conversation.accepts[String(this.user._id)] = true
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const otherUser = await User.find(userId)
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (_.size(conversation.accepts) === 2) {
        // change conversation state
        conversation.status = 'calling'
        conversation.started_at = moment()
        // find and emit calling to other user
        if (socket) {
          socket.socket.toMe().emit('call_start', {
            // conversation: conversation.toJSON(),
            user_id: this.user._id,
            message: 'prepare to call'
          })
          debug('Outgoing', 'call_start', userId, socket.socket.id, {
            // conversation: conversation.toJSON(),
            user_id: this.user._id,
            message: 'prepare to call'
          })
        }

        this.user.call_count = (this.user.call_count || 0) + 1
        otherUser.call_count = (otherUser.call_count || 0) + 1
        await this.user.save()
        await otherUser.save()
      } else {
        this.socket.toMe().emit('message', { message: 'you accepted, wait for other user' })
        debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you accepted, wait for other user' })

        // send match offer to other user
        if (socket) {
          socket.socket.toMe().emit('match_offer', {
            // conversation: conversation.toJSON(),
            user_id: this.user._id,
            message: `The person want to meet u!`
          })
          debug('Outgoing', 'match_offer', userId, socket.socket.id, {
            // conversation: conversation.toJSON(),
            user_id: this.user._id,
            message: `The person want to meet u!`
          })
        }
      }
      await conversation.save()
    } else {
      this.socket.toMe().emit('message', { message: 'you are not matching with anyone' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not matching with anyone' })
    }
  }

  async on_call_offer (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_call_offer', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'calling' }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        socket.socket.toMe().emit('call_offer', { offer: data.offer })
        debug('Outgoing', 'call_offer', userId, socketid)
      }
    } else {
      this.socket.toMe().emit('message', { message: 'you are not in calling' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not in calling' })
    }
  }

  async on_call_answer (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_call_answer', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'calling' }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        socket.socket.toMe().emit('call_answer', { answer: data.answer })
        debug('Outgoing', 'call_answer', userId, socketid)
      }
    } else {
      this.socket.toMe().emit('message', { message: 'you are not in calling' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not in calling' })
    }
  }

  async on_candidate (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_candidate', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const userId = data.user_id
    const socketid = await Redis.hget('users', userId)
    const socket = chatChannel.get(socketid)
    if (socket) {
      socket.socket.toMe().emit('candidate', { candidates: data.candidates })
      debug('Outgoing', 'candidate', userId, socketid)
    } else {
      socket.socket.toMe().emit('message', { message: 'other user not found' })
      debug('Outgoing', 'message', { message: 'other user not found' })
    }
  }

  async on_call_unlock (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_call_unlock', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const payment = await this.user.payments().first()
    if (payment) {
      const conversation = await this.user.conversations().where({ status: 'calling' }).first()
      if (conversation) {
        const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
        const socketid = await Redis.hget('users', userId)
        const socket = chatChannel.get(socketid)
        if (socket) {
          socket.socket.toMe().emit('call_unlocked', { conversation_id: conversation._id })
          debug('Outgoing', 'call_unlocked', userId, socketid)
        }
        conversation.unlocked = true
        await conversation.save()
      } else {
        this.socket.toMe().emit('message', { message: 'you are not in calling' })
        debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not in calling' })
      }
    } else {
      this.socket.toMe().emit('payment_require', { message: 'buy a subscription to unlock calling' })
      debug('Outgoing', 'payment_require', this.user._id, this.socket.id, { message: 'buy a subscription to unlock calling' })
    }
  }

  async on_add_friend (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_add_friend', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'calling' }).first()
    if (conversation) {
      conversation.friends[String(this.user._id)] = true
      if (_.size(conversation.friends) === 2) {
        // change conversation state
        conversation.is_friend = true
        // find and emit calling to other user
        const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
        const otherUser = await conversation.users().where({ _id: { $ne: this.user._id } }).first()
        await this.user.friends().attach(userId)
        await otherUser.friends().attach(this.user._id)
        const socketid = await Redis.hget('users', userId)
        const socket = chatChannel.get(socketid)
        if (socket) {
          socket.socket.toMe().emit('become_friend', {
            conversation_id: conversation._id,
            user: this.user.toJSON(),
            message: 'become friend'
          })
          debug('Outgoing', 'become_friend', userId, socket.socket.id, {
            conversation_id: conversation._id,
            user: this.user.toJSON(),
            message: 'become friend'
          })
        }

        // emit calling to current user
        this.socket.toMe().emit('become_friend', {
          conversation_id: conversation._id,
          user: otherUser.toJSON(),
          message: 'become friend'
        })
        debug('Outgoing', 'become_friend', this.user._id, this.socket.id, {
          conversation_id: conversation._id,
          user: otherUser.toJSON(),
          message: 'become friend'
        })
      } else {
        this.socket.toMe().emit('message', { message: 'sent friend request, waiting for other' })
        debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'sent friend request, waiting for other' })
      }
      await conversation.save()
    } else {
      this.socket.toMe().emit('message', { message: 'you are not in calling' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not in calling' })
    }
  }

  async on_call_hangup (data) { // eslint-disable-line
    debug('=========================================================')
    debug('Incoming', '_call_hangup', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const conversation = await this.user.conversations().where({ status: 'calling' }).first()
    if (conversation) {
      const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
      const socketid = await Redis.hget('users', userId)
      const socket = chatChannel.get(socketid)
      if (socket) {
        socket.socket.toMe().emit('call_hangup', { conversation_id: conversation._id, message: 'other user hungup' })
        debug('Outgoing', 'call_hangup', { conversation_id: conversation._id, message: 'other user hungup' })
        // await Redis.sadd('hunting', String(userId))
      }
      socket.socket.toMe().emit('call_hangup', { conversation_id: conversation._id, message: 'you hungup' })
      debug('Outgoing', 'call_hangup', { conversation_id: conversation._id, message: 'you hungup' })
      // await Redis.sadd('hunting', String(this.user._id))
      conversation.status = 'closed'
      conversation.ended_at = moment()
      conversation.call_time = moment().diff(conversation.started_at)
      await conversation.save()
    } else {
      this.socket.toMe().emit('message', { message: 'you are not in calling' })
      debug('Outgoing', 'message', this.user._id, this.socket.id, { message: 'you are not in calling' })
    }
  }

  async onDisconnect () {
    debug('=========================================================')
    debug('User disconnected', this.user._id, this.socket.id)
    const chatChannel = Ws.channel('/chat')
    const currentSocketId = await Redis.hget('users', this.user._id)
    if (this.socket.id === currentSocketId) {
      const conversation = await this.user.conversations().where({ status: { $nin: ['closed', 'rejected'] } }).first()
      if (conversation) {
        debug('found existing conversation when disconnect')
        const userId = conversation.user_ids.find(id => String(id) !== String(this.user._id))
        const socketid = await Redis.hget('users', userId)
        const socket = chatChannel.get(socketid)
        if (socket) {
          debug('Outgoing', 'message', userId, socket.socket.id, { message: 'other user disconnected' })
          socket.socket.toMe().emit('match_close', { conversation_id: conversation._id, message: 'other user disconnected' })
          // await Redis.sadd('hunting', String(userId))
        }
        conversation.status = conversation.status === 'calling' ? 'closed' : 'rejected'
        if (conversation.started_at) {
          conversation.call_time = moment().diff(conversation.started_at)
        }
        await conversation.save()
      }
      debug('remove hunting mode and online list', this.user._id)
      await Redis.hdel('users', this.user._id)
      await Redis.srem('hunting', this.user._id)
      this.user.is_online = false
      await this.user.save()
    } else {
      debug('User has different socket id', this.socket.id, currentSocketId)
    }
  }
}

module.exports = ChatController
