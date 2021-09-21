/** @format */
require('dotenv').config()

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
const getKey = async () => {
  const { data } = await supabase
    .from(globalConfig.supabaseTable)
    .select('key')
    .eq('env', globalConfig.supabaseEnv)
  const [first] = data

  return first.key
}

const instance = axios.create({
  baseURL: globalConfig.baseURL,
})

instance.interceptors.request.use(
  async (config) => {
    const signingKey = await getKey()
    const uri = `${config.baseURL}${config.url}?${qs.stringify(config.params)}`
    console.info(`URI: ${uri}`)
    // Add authorization header
    config.headers.Authorization = oath.getAuthorizationHeader(
      uri,
      config.method,
      config.data,
      globalConfig.consumerKey,
      signingKey,
    )

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

instance
  .get('/conversion-rate', {
    params: {
      fxDate: DateTime.now().toISODate(),
      transCurr: 'EUR',
      crdhldBillCurr: 'ZMW',
      bankFee: 4,
      transAmt: 10.04,
    },
  })
  .then(({ data }) => console.info(data))
  .catch((err) =>
    console.error(
      err.response ? JSON.stringify(err.response.data) : err.message,
    ),
  )
