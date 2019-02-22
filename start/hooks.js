const { hooks } = require('@adonisjs/ignitor')

hooks.after.httpServer(() => {
  const Helpers = use('Helpers')
  if (!Helpers.isAceCommand()) {
    matchStart()
    summary()
  }
})

const matchStart = async () => {
  const sendMatching = use('App/Utils/SendMatching')
  while (true) {
    await sleep(1000)
    await sendMatching()
  }
}

const summary = async () => {
  const sendSummary = use('App/Utils/SendSummary')
  while (true) {
    await sleep(5000)
    await sendSummary()
  }
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time))
