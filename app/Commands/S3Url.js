'use strict'

const { Command } = require('@adonisjs/ace')
const User = use('App/Models/User')
const Report = use('App/Models/Report')
const Drive = use('Drive')
const CloudFront = use('App/Utils/CloudFront')

class S3Url extends Command {
  static get signature () {
    return 'url:update'
  }

  static get description () {
    return 'Generate S3 url'
  }

  async handle (args, options) {
    const users = await User.fetch()
    for (let user of users.rows) {
      if (!user.profile_rejected && user.profile_video) {
        // user.profile_video_url = await Drive.disk('s3').getSignedUrl(user.profile_video, 10 * 360 * 86400)
        user.profile_video_url = CloudFront.mediaUrl(user.profile_video)
      } else {
        user.profile_video_url = null
      }
      if (!user.profile_rejected && user.profile_photo) {
        // user.profile_photo_url = await Drive.disk('s3').getSignedUrl(user.profile_photo, 10 * 360 * 86400)
        user.profile_photo_url = CloudFront.mediaUrl(user.profile_photo)
      } else {
        user.profile_photo_url = null
      }
      if (user.avatar) {
        // user.avatar_url = await Drive.disk('s3').getSignedUrl(user.avatar, 10 * 360 * 86400)
        user.avatar_url = CloudFront.mediaUrl(user.avatar)
      } else {
        user.avatar_url = null
      }

      await user.save()
    }

    const reports = await Report.fetch()
    for (let report of reports.rows) {
      if (report.file) {
        report.file_url = CloudFront.mediaUrl(report.file)
        // report.file_url = await Drive.disk('s3').getSignedUrl(report.file, 10 * 360 * 86400)
      }
      await report.save()
    }

    this.info(`S3 Url done`)
  }
}

module.exports = S3Url
