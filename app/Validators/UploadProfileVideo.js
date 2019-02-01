'use strict'

class UploadProfileVideo {
  get rules () {
    return {
      file: 'file|file_size:2mb|file_types:video'
    }
  }
}

module.exports = UploadProfileVideo
