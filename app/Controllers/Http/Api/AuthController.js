/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

'use strict'
const BaseController = require('./BaseController')
// const AccountNotVerifiedException = use('App/Exceptions/AccountNotVerifiedException')
const LoginFailedException = use('App/Exceptions/LoginFailedException')
const ResourceNotFoundException = use('App/Exceptions/ResourceNotFoundException')
const BadRequestException = use('App/Exceptions/BadRequestException')
const ValidateErrorException = use('App/Exceptions/ValidateErrorException')
const Config = use('Config')
const Hash = use('Hash')
const Mail = use('Mail')
const crypto = require('crypto')
const uuid = require('uuid')
const User = use('App/Models/User')
const Api = require('apisauce').create
const Env = use('Env')

class AuthController extends BaseController {
  /**
   * Register
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf UsersController
   *
   */
  async register ({ request, response }) {
    const user = new User(request.only([
      'email',
      'password',
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
    const verificationToken = crypto.createHash('sha256').update(uuid.v4()).digest('hex')
    user.merge({
      verificationToken,
      verified: false
    })
    await user.save()
    Mail.send('emails.verification', { user: user }, (message) => {
      message.to(user.email, user.name)
      message.from(Config.get('mail.sender'))
      message.subject('Please Verify Your Email Address')
    }).catch(error => console.log(error))
    return response.apiCreated(user)
  }

  /**
   * Login
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   *
   * @memberOf AuthController
   *
   */
  async login ({ request, response, auth }) {
    const email = request.input('email')
    const password = request.input('password')
    await this.validate(request.all(), { email: 'required', password: 'required' })
    // Attempt to login with email and password
    let data = null
    try {
      data = await auth.authenticator('jwt').withRefreshToken().attempt(email, password)
      data.data = await User.findBy({ email })
    } catch (error) {
      console.log(error)
      throw LoginFailedException.invoke('Invalid email or password')
    }
    if (!data.data.verified) {
      // throw AccountNotVerifiedException.invoke('Email is not verified')
    }
    response.json(data)
  }

  /**
   * Refresh token
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async refresh ({ request, response, auth }) {
    const authData = await auth
      .authenticator('jwt')
      .newRefreshToken()
      .generateForRefreshToken(request.input('refresh_token'))
    return response.json(authData)
  }

  /**
   * Logout
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async logout ({ request, response, auth }) {
    await auth.logout()

    return response.send('success')
  }

  /**
   * Social login
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async socialLogin ({ request, response, auth, ally, params }) {
    const social = params.social
    await this.validate({ social }, { social: 'required|in:facebook,google,phone' })
    await this.validate(request.all(), { social_token: 'required|string' })
    if (social === 'phone') {
      return this.phoneLogin(...arguments)
    }
    const socialToken = request.input('social_token')
    let clientSecret = Config.get('services.ally')[social].clientSecret
    let socialUser = null
    try {
      socialUser = await ally.driver(social).getUserByToken(socialToken, clientSecret)
    } catch (error) {
      console.log(error)
      throw LoginFailedException.invoke('Invalid token')
    }
    let firstName = ''
    let lastName = ''
    const name = socialUser.getName() || ''
    if (name) {
      firstName = name.split(' ')[0] || ''
      lastName = name.split(' ')[1] || ''
    }
    let user = await User.findOrCreate({ social_id: socialUser.getId(), social }, {
      first_name: firstName,
      last_name: lastName,
      email: socialUser.getEmail() || '',
      verified: true,
      social: social,
      social_token: socialToken,
      social_id: socialUser.getId(),
      password: use('uuid').v4(),
      avatar_url: socialUser.getAvatar(),
      is_blocked: false,
      profile_rejected: false,
      is_online: false,
      is_new: true
    })
    const data = await auth.authenticator('jwt').withRefreshToken().generate(user)
    data.data = user
    return response.json(data)
  }

  /**
   * phone login
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @param {AuthJwt} ctx.auth
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async phoneLogin ({ request, response, auth }) {
    const socialToken = request.input('social_token')
    const appSecret = Env.get('ACCOUNT_KIT_APP_SECRET')
    const appsecretProof = crypto.createHmac('sha256', appSecret).update(socialToken).digest('hex')
    const accountKitResponse = await Api({ baseURL: 'https://graph.accountkit.com/v1.3' })
      .get('/me', { access_token: socialToken, appsecret_proof: appsecretProof })
    // console.log(accountKitResponse)
    if (!accountKitResponse.ok) {
      throw LoginFailedException.invoke('Invalid token')
    }

    let user = await User.findOrCreate({ phone_number: accountKitResponse.data.phone.national_number, social: 'phone' }, {
      first_name: '',
      last_name: '',
      verified: true,
      social: 'phone',
      social_token: socialToken,
      social_id: accountKitResponse.data.id,
      password: use('uuid').v4(),
      avatar_url: '',
      is_blocked: false,
      profile_rejected: false,
      is_online: false,
      is_new: true
    })
    const data = await auth.authenticator('jwt').withRefreshToken().generate(user)
    data.data = user
    return response.json(data)
  }

  /**
   * re-sends verification token to the users
   * email address.
   *
   * @param  {Object} request
   * @param  {Object} response
   *
   */
  async sendVerification ({ request, response }) {
    await this.validate(request.all(), { email: 'required' })
    const user = await User.findBy({ email: request.input('email') })
    if (!user) {
      throw ResourceNotFoundException.invoke(`Can not find user with email "${request.input('email')}"`)
    }
    const verificationToken = crypto.createHash('sha256').update(uuid.v4()).digest('hex')
    user.verificationToken = verificationToken
    await user.save()
    response.apiSuccess(null, 'Email sent successfully')
    await Mail.send('emails.verification', { user: user }, (message) => {
      message.to(user.email, user.name)
      message.from(Config.get('mail.sender'))
      message.subject('Please Verify Your Email Address')
    })
  }

  /**
   * verifies a user account with a give
   * token
   *
   * @param  {Object} request
   * @param  {Object} response
   */
  async verify ({ request, response, session }) {
    const token = request.input('token')
    const user = await User.findBy({ verificationToken: token })
    if (!user) {
      throw BadRequestException.invoke(`Invalid token`)
    }
    user.verified = true
    user.unset('verificationToken')
    await user.save()
    await session.flash({ message: 'Account verified successfully' })
    response.redirect('/')
  }

  /**
   * Me
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async me ({ request, response, auth }) {
    const user = auth.user
    return response.apiSuccess(user)
  }

  /**
   * Forgot
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async forgot ({ request, response }) {
    await this.validate(request.all(), { email: 'required' })
    const user = await User.findBy({ email: request.input('email') })
    if (!user) {
      throw ResourceNotFoundException.invoke(`Can not find user with email "${request.input('email')}"`)
    }
    const verificationToken = crypto.createHash('sha256').update(uuid.v4()).digest('hex')
    user.verificationToken = verificationToken
    await user.save()

    response.apiSuccess(null, 'Email sent successfully')

    await Mail.send('emails.reset', { user: user }, (message) => {
      message.to(user.email, user.name)
      message.from(Config.get('mail.sender'))
      message.subject('Reset your password')
    })
  }

  /**
   * Reset password form
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async getReset ({ request, view }) {
    const token = request.input('token')
    const user = await User.findBy({ verificationToken: token })
    if (!token || !user) {
      throw BadRequestException.invoke(`Invalid token`)
    }
    await view.render('emails.reset', { token: token })
  }

  /**
   * Reset password
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async postReset ({ request, response, session }) {
    const token = request.input('token')
    await this.validate(request.all(), {
      password: 'required|min:6|max:50',
      passwordConfirmation: 'same:password'
    })
    const password = request.input('password')
    const user = await User.findBy({ verificationToken: token })
    if (!token || !user) {
      throw BadRequestException.invoke(`Invalid token`)
    }
    user.password = password
    user.unset('verificationToken')
    await user.save()
    await session.flash({ message: 'Reset password successfully' })
    response.redirect('/')
  }

  /**
   * Change password
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {Request} ctx.request
   * @returns
   *
   * @memberOf AuthController
   *
   */
  async password ({ request, response, auth }) {
    await this.validate(request.all(), { password: 'required', new_password: 'required|min:6|max:50' })
    const password = request.input('password')
    const newPassword = request.input('new_password')
    const user = auth.user
    const check = await Hash.verify(password, user.password)
    if (!check) {
      throw ValidateErrorException.invoke({ password: 'Password does not match' })
    }
    user.password = newPassword
    user.unset('verificationToken')
    await user.save()
    response.apiSuccess(user, 'Change password successfully')
  }
}

module.exports = AuthController
