'use strict'

/**
 * adonis-guard
 *
 * @license MIT
 * @copyright Slynova - Romain Lanz <romain.lanz@slynova.ch>
 */

const UnAuthorizeException = require('../Exceptions/UnAuthorizeException')

class Can {
  async handle ({ auth, guard }, next, [method, ...argument]) {
    if (!guard.can(auth.user).pass(method).for(argument)) {
      throw UnAuthorizeException.invoke()
    }

    await next()
  }
}

module.exports = Can
