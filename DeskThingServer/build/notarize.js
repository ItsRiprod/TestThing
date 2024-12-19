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
  console.debug('Notarizing...')
  console.debug('Environment variables:')
  console.debug('APPLE_TEAM_ID:', process.env.APPLE_TEAM_ID)
  console.debug('APPLE_ID:', process.env.APPLE_ID)

  const appPath = path.normalize(path.join(context.appOutDir, `DeskThing.app`))
  const appleId = process.env.APPLE_ID
  const teamId = process.env.APPLE_TEAM_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  if (!appleId) {
    console.warn('Not notarizing: Missing APPLE_ID environment variable')
    return
  }
  if (!appleIdPassword) {
    console.warn('Not notarizing: Missing APPLE_APP_SPECIFIC_PASSWORD environment variable')
    return
  }
  if (!teamId) {
    console.warn('Not notarizing: Missing APPLE_TEAM_ID environment variable')
    return
  }

  console.log('::group::Notarization Details')
  console.log('Team ID:', teamId)
  console.log('Apple ID:', appleId)
  console.log('::endgroup::')

  try {
    console.debug('Notarization options:')
    console.debug('appPath:', appPath)
    console.debug('teamId:', teamId)
    console.debug('appleId:', appleId)

    const notarizeOptions = {
      tool: 'notarytool',
      appPath,
      appleId,
      appleIdPassword,
      teamId
    }

    return await notarize(notarizeOptions)
  } catch (error) {
    console.error('Error when notarizing app: ', error, '\nSkipping...')
  }

  return
}
