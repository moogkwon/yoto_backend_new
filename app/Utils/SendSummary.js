// const Redis = use('Redis')
const Ws = use('Ws')
/** @type {typeof import('../../../Models/User')} */
const User = use('App/Models/User')
/** @type {typeof import('../../../Models/Conversation')} */
const Conversation = use('App/Models/Conversation')
const chat = Ws.channel('/summary')
const _ = require('lodash')

const SendSummary = async function (socket) {
  const userCounts = await User.where({ is_admin: { $ne: true } })
    .count({ social: '$social', is_online: '$is_online' })
  const conversationCounts = await Conversation.where({ status: { $nin: ['closed', 'rejected'] } })
    .count('status')

  const data = {
    total_user: _.sumBy(userCounts, 'count'),
    online_user: _.sumBy(_.filter(userCounts, item => item._id.is_online === true), 'count'),
    total_google: _.sumBy(_.filter(userCounts, item => item._id.social === 'google'), 'count'),
    online_google: _.sumBy(_.filter(userCounts, item => item._id.is_online === true && item._id.social === 'google'), 'count'),
    total_facebook: _.sumBy(_.filter(userCounts, item => item._id.social === 'facebook'), 'count'),
    online_facebook: _.sumBy(_.filter(userCounts, item => item._id.is_online === true && item._id.social === 'facebook'), 'count'),
    total_instagram: _.sumBy(_.filter(userCounts, item => item._id.social === 'instagram'), 'count'),
    online_instagram: _.sumBy(_.filter(userCounts, item => item._id.is_online === true && item._id.social === 'instagram'), 'count'),
    total_phone: _.sumBy(_.filter(userCounts, item => item._id.social === 'phone'), 'count'),
    online_phone: _.sumBy(_.filter(userCounts, item => item._id.is_online === true && item._id.social === 'phone'), 'count'),
    current_conversation: _.sumBy(conversationCounts, 'count'),
    calling_conversation: _.sumBy(_.filter(conversationCounts, { _id: 'calling' }), 'count')
  }
  if (socket) {
    socket.toMe().emit('update', data)
  } else {
    chat.emit('update', data)
  }
}

module.exports = SendSummary
