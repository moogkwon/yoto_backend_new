'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

const Factory = use('Factory')

Factory.blueprint('App/Models/User', (faker) => {
  const profile = faker.bool()
    ? { profile_photo_url: faker.avatar() }
    : { profile_video_url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4' }

  return {
    first_name: faker.name().split(' ')[0],
    last_name: faker.name().split(' ')[1],
    email: faker.email(),
    password: faker.password(),
    instagram: faker.word(),
    birth_year: faker.integer({ min: 1950, max: 2010 }),
    gender: faker.pickone(['male', 'female']),
    lgbtq: faker.bool(),
    location: {
      latitude: faker.latitude(),
      longitude: faker.longitude()
    },
    location_country: faker.country({ full: true }),
    location_country_code: faker.country(),
    location_state: faker.state({ full: true }),
    location_city: faker.city(),
    avatar_url: faker.avatar(),
    ...profile
  }
})
