import electronUpdater, { type AppUpdater } from 'electron-updater'

export function getAutoUpdater(): AppUpdater {
  // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
  // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
  const { autoUpdater } = electronUpdater
  return autoUpdater
}

export const checkForUpdates = async (): Promise<void> => {
  const autoUpdater = getAutoUpdater()

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    autoUpdater.allowPrerelease = true
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'ItsRiprod',
    repo: 'TestThing',
    private: false
  })

  autoUpdater.checkForUpdatesAndNotify().then((downloadNotification) => {
    if (downloadNotification) {
      // Handle the update notification
      console.log('Update notification:', downloadNotification)
    } else {
      console.log('No update available')
    }
  })

  // Handle the 'update-downloaded' event
  autoUpdater.on('update-downloaded', (info) => {
    // Prompt the user to quit and install the update
    console.log(info)
  })
}

export const startDownload = (): void => {
  const autoUpdater = getAutoUpdater()
  autoUpdater.downloadUpdate()
}

export const quitAndInstall = (): void => {
  const autoUpdater = getAutoUpdater()
  autoUpdater.quitAndInstall()
}
