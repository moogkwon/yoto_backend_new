const { hooks } = require('@adonisjs/ignitor')
const debug = require('debug')('socket')
const _ = require('lodash')

hooks.after.httpServer(() => {
  matchStart()
})

const matchStart = async () => {
  const Redis = use('Redis')
  const Ws = use('Ws')
  const User = use('App/Models/User')
  const Conversation = use('App/Models/Conversation')
  const chat = Ws.channel('/chat')
  while (true) {
    await sleep(2000)

    let userIds = await Redis.smembers('hunting')
    await Redis.del('hunting')
    userIds = _.shuffle(userIds)
    const pairs = _.chunk(userIds, 2)
    if (pairs.length) {
      debug('Get list matching', pairs)
    }
    // console.log('pairs', pairs)
    const unSuccessUserIds = []
    await Promise.all(_.filter(pairs, item => item.length === 2).map(async pair => {
      const userId1 = userIds[0]
      const userId2 = userIds[1]
      const user1 = await User.find(userId1)
      const user2 = await User.find(userId2)
      const socketId1 = await Redis.hget('users', userId1)
      const socketId2 = await Redis.hget('users', userId2)
      const socket1 = chat.get(socketId1)
      const socket2 = chat.get(socketId2)
      if (socket1 && socket2) {
        const conversation = await Conversation.create({
          user_ids: [user1._id, user2._id],
          status: 'waiting',
          accepts: {},
          offers: {},
          friends: {}
        })
        socket1.socket.toMe().emit('match_new', { conversation_id: conversation._id, user: user2.toJSON() })
        debug('Outgoing', 'match_new', user1._id, socket1.socket.id)
        socket2.socket.toMe().emit('match_new', { conversation_id: conversation._id, user: user1.toJSON() })
        debug('Outgoing', 'match_new', user2._id, socket2.socket.id)
      } else {
        unSuccessUserIds.push(userId1)
        unSuccessUserIds.push(userId2)
      }
    }))
    if (userIds.length % 2) {
      unSuccessUserIds.push(userIds[userIds.length - 1])
    }
    if (unSuccessUserIds.length) {
      await Redis.sadd('hunting', unSuccessUserIds)
    }
  }
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time))
