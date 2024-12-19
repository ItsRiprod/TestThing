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

  const appBundleId = 'com.deskthing.app'
  const appPath = path.normalize(path.join(context.appOutDir, `DeskThing.app`))
  const appleId = process.env.APPLE_ID
  const teamId = process.env.APPLE_TEAM_ID
  const appleIdPassword = process.env.APPLE_ID_PASSWORD
  if (!appleId) {
    console.warn('Not notarizing: Missing APPLE_ID environment variable')
    return
  }
  if (!appleIdPassword) {
    console.warn('Not notarizing: Missing APPLE_ID_PASSWORD environment variable')
    return
  }
  if (!teamId) {
    console.warn('Not notarizing: Missing APPLE_TEAM_ID environment variable')
    return
  }

  try {
    return await notarize({
      appBundleId,
      appPath,
      appleId,
      appleIdPassword,
      teamId
    })
  } catch (error) {
    console.error('Error when notarizing app: ', error, '\nSkipping...')
  }

  return
}
