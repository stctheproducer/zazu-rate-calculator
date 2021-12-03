/** @format */

require('dotenv').config()
const forge = require('node-forge')
const { createClient } = require('@supabase/supabase-js')

const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseTable: process.env.SUPABASE_TABLE,
  supabaseEnv: process.env.SUPABASE_ENV,
  p12Bucket: process.env.MC_KEY_BUCKET,
  p12Folder: process.env.MC_KEY_FOLDER,
  p12File: process.env.MC_KEY_FILE,
  p12Password: process.env.MC_KEY_PASSWORD,
  p12Alias: process.env.MC_KEY_ALIAS,
}

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)

const arrayBufferToString = (arrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  const len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return binary
}

// Load a signing key
const createAndUploadKey = async () => {
  const { data: file, error: fileError } = await supabase.storage
    .from(config.p12Bucket)
    .download(`${config.p12Folder}/${config.p12File}`)

  if (fileError) {
    console.log('Error:', fileError.status, fileError.message)
    return
  }

  const p12Content = arrayBufferToString(await file.arrayBuffer())

  const p12Asn1 = forge.asn1.fromDer(p12Content, false)
  p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, config.p12Password)
  const keyObj = p12.getBags({
    friendlyName: config.p12Alias,
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  }).friendlyName[0]

  const signingKey = forge.pki.privateKeyToPem(keyObj.key)

  const { data: uploadedData, error: uploadError } = await supabase
    .from(config.supabaseTable)
    .upsert({
      id: config.supabaseEnv === 'development' ? 1 : 2,
      key: signingKey,
      env: config.supabaseEnv,
    })

  if (uploadError) {
    console.log('Error:', uploadError.message)
    return
  }

  console.log(JSON.stringify(uploadedData, null, 2))
}

createAndUploadKey()
