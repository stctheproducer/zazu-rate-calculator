/** @format */
require('dotenv').config()
const config = {
  p12Path: process.env.MC_KEY_PATH,
  p12Password: process.env.MC_KEY_PASSWORD,
  p12Alias: process.env.MC_KEY_ALIAS,
}
// Load the signing key
const forge = require('node-forge')
const fs = require('fs')
const path = require('path')
const p12Content = fs.readFileSync(config.p12Path, 'binary')
const p12Asn1 = forge.asn1.fromDer(p12Content, false)
p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, config.p12Password)
const keyObj = p12.getBags({
  friendlyName: config.p12Alias,
  bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
}).friendlyName[0]
const signingKey = forge.pki.privateKeyToPem(keyObj.key)

if (fs.existsSync(path.join(__dirname, 'keys'))) {
  fs.rmSync(path.join(__dirname, 'keys/key.pem'))
  fs.rmdirSync(path.join(__dirname, 'keys'))
}
fs.mkdirSync(path.join(__dirname, 'keys'))
fs.writeFileSync(path.join(__dirname, 'keys/key.pem'), signingKey)
fs.chmodSync(path.join(__dirname, 'keys/key.pem'), 0600)
