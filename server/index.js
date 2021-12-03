/** @format */
require('dotenv').config()
const fs = require('fs')

const { createClient } = require('@supabase/supabase-js')
const qs = require('qs')
const axios = require('axios')
const oath = require('mastercard-oauth1-signer')
const { DateTime } = require('luxon')

const globalConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseTable: process.env.SUPABASE_TABLE,
  supabaseEnv: process.env.SUPABASE_ENV,
  baseURL: process.env.MC_BASE_URL,
  consumerKey: process.env.MC_CONSUMER_KEY,
}

const supabase = createClient(
  globalConfig.supabaseUrl,
  globalConfig.supabaseAnonKey,
)

let mainUser, mainSession

const login = async () => {
  const { user, session, error } = await supabase.auth.signIn({
    email: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD,
  })

  if (error) {
    console.log('Error:', error.status, error.message)
    return
  }

  // console.log('User:', user, 'Session:', session)
  mainUser = user
  mainSession = session
}

const getKey = async () => {
  await login()

  const { data, error } = await supabase
    .from(globalConfig.supabaseTable)
    .select('key')
    .eq('env', globalConfig.supabaseEnv)
  const [first] = data

  if (error) {
    console.log('Error:', error.status, error.message)
    return
  }

  return first?.key
}

getKey()

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Event:', event, 'Session:', session)
})

// const instance = axios.create({
//   baseURL: globalConfig.baseURL,
// })

// instance.interceptors.request.use(
//   async (config) => {
//     const signingKey = await getKey()
//     const uri = `${config.baseURL}${config.url}?${qs.stringify(config.params)}`
//     console.info(`URI: ${uri}`)
//     // Add authorization header
//     config.headers.Authorization = oath.getAuthorizationHeader(
//       uri,
//       config.method,
//       config.data,
//       globalConfig.consumerKey,
//       signingKey,
//     )

//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   },
// )

// instance
//   .get('/conversion-rate', {
//     params: {
//       // fxDate: DateTime.now().toISODate(),
//       fxDate: DateTime.now().minus({ day: 1 }).toISODate(),
//       transCurr: 'USD',
//       crdhldBillCurr: 'ZMW',
//       bankFee: 4,
//       transAmt: 20,
//     },
//   })
//   .then(({ data }) => console.info(data))
//   .catch((err) =>
//     console.error(
//       err.response ? JSON.stringify(err.response.data) : err.message,
//     ),
//   )
