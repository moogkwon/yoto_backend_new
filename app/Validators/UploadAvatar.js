'use strict'

class UploadAvatar {
  get rules () {
    return {
      file: 'file|file_size:200kb|file_types:image'
    }
  }
}

module.exports = UploadAvatar
