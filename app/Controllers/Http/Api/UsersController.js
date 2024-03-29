'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

const BaseController = require('./BaseController')
/** @type {typeof import('../../../Models/User')} */
const User = use('App/Models/User')
// const Validator = use('Validator')
const UnAuthorizeException = use('App/Exceptions/UnAuthorizeException')
// const Config = use('Config')
const Drive = use('Drive')
const debug = require('debug')('socket')
const Ws = use('Ws')
const Redis = use('Redis')
const CloudFront = use('App/Utils/CloudFront')

/**
 *
 * @class UsersController
 */
class UsersController extends BaseController {
  /**
   * Index
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, decodeQuery }) {
    const query = decodeQuery()
    const q = User.query(query)
    if (query.search) {
      q.where({
        name: { $regex: new RegExp(`.*${query.search}.*`, 'i') }
      })
    }
    const users = await q.paginate(query.page, query.perPage)
    return response.json(users)
  }

  /**
   * count
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async count ({ request, response, decodeQuery }) {
    const query = decodeQuery()
    const q = User.query(query)
    if (query.search) {
      q.where({
        $or: [
          { title: { $regex: new RegExp(`.*${query.search}.*`, 'i') } },
          { content: { $regex: new RegExp(`.*${query.search}.*`, 'i') } }
        ]
      })
    }
    const userCount = await q.count()
    return response.apiSuccess({ userCount })
  }

  /**
   * Store
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  // async store ({request, response}) {
  //   await this.validate(request.all(), User.rules())
  //   const user = new User(request.only('name', 'email'))
  //   const password = await Hash.make(request.input('password'))
  //   const verificationToken = crypto.createHash('sha256').update(uuid.v4()).digest('hex')
  //   user.set({
  //     password: password,
  //     verificationToken: verificationToken,
  //     verified: false
  //   })
  //   await user.save()
  //   await Mail.send('emails.verification', { user: user.get() }, (message) => {
  //     message.to(user.email, user.name)
  //     message.from(Config.get('mail.sender'))
  //     message.subject('Please Verify Your Email Address')
  //   })
  //   return response.apiCreated(user)
  // }

  /**
   * Show
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ request, response, instance, decodeQuery }) {
    const user = instance
    await user.loadMany(decodeQuery().with)
    return response.apiItem(user)
  }

  /**
   * Show
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async token ({ request, response, instance, auth }) {
    const user = instance
    const token = await auth.generate(user)
    return response.apiSuccess(token)
  }

  /**
   * Update
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   */
  async update ({ request, response, params, instance, auth }) {
    const user = instance
    if (String(auth.user._id) !== String(user._id)) {
      throw UnAuthorizeException.invoke()
    }
    user.merge(request.only([
      'first_name',
      'last_name',
      'instagram',
      'birth_year',
      'gender',
      'birth_year',
      'lgbtq',
      'location_country',
      'location_country_code',
      'location_state',
      'location_city'
    ]))
    await user.save()
    return response.apiUpdated(user)
  }

  /**
   * Destroy
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ request, response, instance, auth }) {
    const user = instance
    await user.reports().delete()
    await user.reporteds().delete()
    await user.devices().delete()
    await user.conversations().delete()
    await user.delete()
    return response.apiDeleted()
  }

  /**
   * Block
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   */
  async block ({ request, response, params, instance, auth }) {
    const user = instance
    user.is_blocked = true
    await user.save()
    const chatChannel = Ws.channel('/chat')
    const socketId = await Redis.hget(`users`, String(user._id))
    const socket = chatChannel.get(socketId)
    if (socket) {
      debug('Outgoing', 'user_blocked', { message: '' })
      socket.socket.toMe().emit('user_blocked', { message: '' })
    }
    return response.apiUpdated(user)
  }

  /**
   * Unblock
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   */
  async unblock ({ request, response, params, instance, auth }) {
    const user = instance
    user.is_blocked = false
    await user.save()
    return response.apiUpdated(user)
  }

  /**
   * Reject
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   */
  async reject ({ request, response, params, instance, auth }) {
    const user = instance
    user.profile_rejected = true
    user.profile_video_url = null
    user.profile_photo_url = null
    await user.save()
    const chatChannel = Ws.channel('/chat')
    const socketId = await Redis.hget(`users`, String(user._id))
    const socket = chatChannel.get(socketId)
    if (socket) {
      debug('Send reject event to user', user._id, socket.socket.id, { message: '' })
      socket.socket.toMe().emit('user_profile_rejected', { message: '' })
    }
    return response.apiUpdated(user)
  }

  /**
   * Upload avatar
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async uploadAvatar ({ request, response, auth }) {
    const user = auth.user
    const validate = {
      size: '200kb',
      types: ['image']
    }
    request.multipart.file('file', validate, async (file) => {
      const fileName = `uploads/photos/${use('uuid').v1().replace(/-/g, '')}_${file.clientName}`
      await Drive.disk('s3').put(fileName, file.stream)
      if (user.avatar) {
        try {
          await Drive.delete(user.avatar)
        } catch (error) { }
      }
      user.avatar = fileName
      // user.avatar_url = await Drive.disk('s3').getSignedUrl(fileName, 10 * 360 * 86400)
      user.avatar_url = CloudFront.mediaUrl(user.avatar)
      await user.save()
    })

    await request.multipart.process()
    return response.apiUpdated(user)
  }

  /**
   * Profile photo
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async uploadProfilePhoto ({ request, response, auth }) {
    const user = auth.user
    const validate = {
      size: '200kb',
      types: ['image']
    }
    request.multipart.file('file', validate, async (file) => {
      const fileName = `uploads/photos/${use('uuid').v1().replace(/-/g, '')}_${file.clientName}`
      await Drive.disk('s3').put(fileName, file.stream)
      if (user.profile_photo) {
        try {
          await Drive.delete(user.profile_photo)
        } catch (error) { }
      }
      user.profile_photo = fileName
      // user.profile_photo_url = await Drive.disk('s3').getSignedUrl(fileName, 10 * 360 * 86400)
      user.profile_photo_url = CloudFront.mediaUrl(user.profile_photo)
      user.profile_video_url = null
      user.profile_rejected = false
      await user.save()
    })

    await request.multipart.process()
    return response.apiUpdated(user)
  }

  /**
   * Profile video
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async uploadProfileVideo ({ request, response, auth }) {
    const user = auth.user
    const validate = {
      size: '1mb',
      types: ['video']
    }
    request.multipart.file('file', validate, async (file) => {
      const fileName = `uploads/videos/${use('uuid').v1().replace(/-/g, '')}_${file.clientName}`
      await Drive.disk('s3').put(fileName, file.stream)
      if (user.profile_video) {
        try {
          await Drive.delete(user.profile_video)
        } catch (error) { }
      }
      user.profile_video = fileName
      // user.profile_video_url = await Drive.disk('s3').getSignedUrl(fileName, 10 * 360 * 86400)
      user.profile_video_url = CloudFront.mediaUrl(user.profile_video)
      user.profile_photo_url = null
      user.profile_rejected = false
      await user.save()
    })

    await request.multipart.process()
    return response.apiUpdated(user)
  }
}

module.exports = UsersController
