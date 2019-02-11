'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const firebase = require('firebase')
const admin = require('firebase-admin')

class FirebaseProvider extends ServiceProvider {
  /**
   * Register bindings
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    const serviceAccount = require('../../credentials/serviceAccountKey.json')
    const firebaseConfig = require('../../credentials/firebaseConfig.json')
    this.app.singleton('Yoto/Firebase', () => {
      return firebase.initializeApp(firebaseConfig)
    })
    this.app.singleton('Yoto/FirebaseAdmin', () => {
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...firebaseConfig
      })
    })

    this.app.alias('Yoto/Firebase', 'Firebase')
    this.app.alias('Yoto/FirebaseAdmin', 'FirebaseAdmin')
  }
}

module.exports = FirebaseProvider
