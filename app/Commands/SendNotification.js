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
    const User = use('App/Models/User')

    while (true) {
      await sleep(1000)
      const notifications = await Notification
        .where({ status: 'waiting', send_time: { $lte: moment() } })
        .fetch()

      for (let notification of notifications.rows) {
        let users = null
        if (notification.user_ids && notification.user_ids.length) {
          users = await notification.users().fetch()
        } else {
          const query = User.where({
            is_admin: { $ne: true }
          })
          if (notification.activity === 'online') {
            query.where('is_online', true)
          } else if (notification.activity === 'offline') {
            query.where({ is_online: { $ne: true } })
          }
          if (notification.country) {
            query.where({ location_country_code: notification.country })
          }
          if (notification.gender) {
            query.where({ gender: notification.gender })
          }
          if (notification.lgbtq) {
            query.where({ lgbtq: notification.lgbtq })
          }
          if (notification.birth_year_min && notification.birth_year_max) {
            query.where({
              $and: [
                { birth_year: { $gte: Number(notification.birth_year_min) } },
                { birth_year: { $lte: Number(notification.birth_year_max) } }
              ]
            })
          } else if (notification.birth_year_min) {
            query.where({ birth_year: { $gte: Number(notification.birth_year_min) } })
          } else if (notification.birth_year_max) {
            query.where({ birth_year: { $lte: Number(notification.birth_year_max) } })
          }
          users = await query.fetch()
        }
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
        if (deviceTokens.length) {
          const response = await FirebaseAdmin.messaging().sendToDevice(deviceTokens, message)
          notification.sent_count = response.successCount
          notification.sent_time = notification.sent_time || moment()
          notification.status = 'sent'
        } else {
          notification.status = 'error'
        }
        await notification.save()
      }
    }
  }
}

module.exports = SendNotification
