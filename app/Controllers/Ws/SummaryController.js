'use strict'
/** @typedef {import('@adonisjs/framework/src/Logger')} Logger */
const debug = require('debug')('socket')
// const Ws = use('Ws')
// const Redis = use('Redis')
// const _ = require('lodash')
// const User = use('App/Models/User')
// const moment = require('moment')

class SummaryController {
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
    if (!this.user.is_admin) {
      socket.emit('message', 'Only admin can access to this channel')
      socket.disconnect()
    }
    socket.emit('message', 'Your connection is ready')
    const sendSummary = use('App/Utils/SendSummary')
    sendSummary(this.socket)
  }

  async onDisconnect () {
    debug('User disconnected', this.user._id, this.socket.id)
  }
}

module.exports = SummaryController
