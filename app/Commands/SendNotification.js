'use strict'

const { Command } = require('@adonisjs/ace')
const moment = require('moment')
const _ = require('lodash')

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

class SendNotification extends Command {
  static get signature () {
    return 'send:notification'
  }

  static get description () {
    return 'Cronjob to send notification'
  }

  async handle (args, options) {
    this.info('Start sending notification')

    const FirebaseAdmin = use('FirebaseAdmin')
    const Notification = use('App/Models/Notification')
    const Device = use('App/Models/Device')

    while (true) {
      await sleep(1000)
      const notifications = await Notification
        .where({ status: 'waiting', send_time: { $lte: moment() } })
        .with('users.device')
        .fetch()
      for (let notification of notifications.rows) {
        const users = await notification.users().fetch()
        const userIds = _.map(users.rows, user => user._id)
        const devices = await Device.where({
          user_id: { $in: userIds }
          // status: Device.STATUS_ENABLED
        }).fetch()
        const message = {
          notification: {
            title: notification.title,
            body: notification.content
          }
        }
        const deviceTokens = _.map(devices.rows, 'token')
        console.log('seding push', userIds, deviceTokens)
        const response = await FirebaseAdmin.messaging().sendToDevice(deviceTokens, message)
        notification.sent_count = response.successCount
        await notification.save()
      }
    }
  }
}

module.exports = SendNotification
