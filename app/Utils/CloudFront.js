const Env = use('Env')

module.exports = {
  mediaUrl: (source) => Env.get('CLOUD_FRONT_WEB') + source
}
