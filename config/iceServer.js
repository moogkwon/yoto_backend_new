'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  iceServers: JSON.parse(Env.get('ICE_SERVERS', '[]'))
}
