'use strict'

const Gate = use('Gate')

Gate.define('isAdmin', (user, resource) => {
  return !!user.is_admin
})
