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
const photos = [
  'http://channel.mediacdn.vn/prupload/439/2018/05/img20180517172922035.jpg',
  'http://file.vforum.vn/hinh/2018/01/top-nhung-hot-girl-viet-nam-xinh-nhat-hien-nay-2018-14.png',
  'http://sohanews.sohacdn.com/2018/12/26/photo-3-1545785311836421746123.jpg',
  'https://vietnammoi.vn/stores/news_dataimages/linhnt/042017/01/15/4213_co-nang-gay-tong-teo-bien-thanh-hot-girl-nho-nang-nguc9.jpg',
  'https://kenh14cdn.com/2016/sarahfuckingsnyder-1-1460691948997.png',
  'http://mediaold.tiin.vn:8080/media_old_2016//medias12/533b7277dfbf3/2015/05/16/6f361bf1-6d9c-47e2-9264-2354b8377a40.jpg',
  'https://icdn.dantri.com.vn/thumb_w/640/2018/12/16/au-ha-my-3-15449225195181123275353.jpg',
  'http://afamilycdn.com/2018/photo-2-1515893838220.jpg',
  'https://topsao.vn/wp-content/uploads/2018/07/16/36085195_277324849670223_6394342267993194496_n.jpg',
  'https://kenh14cdn.com/2016/26-1463389938441.png',
  'http://2sao.vietnamnetjsc.vn/2016/08/12/10/54/trai3.jpg',
  'https://kenh14cdn.com/k:Article/2014/02/22/9e0f8_nhungcapdoidongtinhnamduocbietdentrongthegioimang/3-cap-doi-dong-tinh-my-nam-tai-chau-a-don-tim-cu-dan-mang.jpg',
  'https://i.ytimg.com/vi/Z788XDeTnko/hqdefault.jpg',
  'http://farm4.static.flickr.com/3805/10431561613_c53988397e.jpg',
  'https://i.pinimg.com/originals/9e/69/9d/9e699da23642304086021fe1ec44f67c.jpg'
]

Factory.blueprint('App/Models/User', (faker) => {
  const profile = faker.bool()
    ? { profile_photo_url: faker.pickOne(photos) }
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
    avatar_url: faker.pickOne(photos),
    ...profile
  }
})
