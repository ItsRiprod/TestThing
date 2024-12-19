const { notarize } = require('@electron/notarize')
const path = require('path')

exports.default = async function notarizing(context) {
  if (
    context.electronPlatformName !== 'darwin' ||
    process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false'
  ) {
    console.log('Skipping notarization')
    return
  }
  console.log('Notarizing...')

  const appBundleId = context.packager.appInfo.info._configuration.appId
  const appName = context.packager.appInfo.productFilename
  const appPath = path.normalize(path.join(context.appOutDir, `${appName}.app`))
  const buildCertificate = process.env.BUILD_CERTIFICATE_BASE64
  const p12Password = process.env.P12_PASSWORD
  if (!buildCertificate) {
    console.warn('Not notarizing: Missing BUILD_CERTIFICATE_BASE64 environment variable')
    return
  }
  if (!p12Password) {
    console.warn('Not notarizing: Missing P12_PASSWORD environment variable')
    return
  }
  return notarize({
    appBundleId,
    appPath,
    appleId: buildCertificate,
    appleIdPassword: p12Password
  })
}
