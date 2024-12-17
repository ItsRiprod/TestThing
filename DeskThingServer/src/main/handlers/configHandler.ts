/**
 * Configuration Handler Module
 *
 * This module handles reading and writing application configuration data to/from files.
 * It provides functionality to manage the application's data persistence layer, including:
 * - Reading app configuration from JSON files
 * - Writing app configuration to JSON files
 * - Maintaining default configuration values
 * - Error handling for file operations
 * - IPC communication for configuration updates
 *
 * The configuration data follows the AppData interface structure and is stored in 'apps.json'.
 * If the configuration file doesn't exist, it will be created with default values.
 */

console.log('[Config Handler] Starting')
import { sendIpcData } from '..'
import { AppData, App, MESSAGE_TYPES, Manifest, ButtonMapping } from '@shared/types'
import loggingStore from '../stores/loggingStore'
import { readFromFile, writeToFile } from '../utils/fileHandler'

const defaultData: AppData = {
  apps: [],
  config: {
    testData: 'thisisastring'
  }
}

/**
 * Reads the application data from a file and returns it as an `AppData` object.
 * If the file does not exist, it creates a new file with the default data and returns it.
 * If there is an error reading the file, it returns the default data.
 *
 * @returns {AppData} The application data read from the file, or the default data if the file does not exist or there is an error.
 */
const readData = (): AppData => {
  const dataFilePath = 'apps.json'
  try {
    const data = readFromFile<AppData>(dataFilePath)
    if (!data) {
      // File does not exist, create it with default data
      writeToFile(defaultData, dataFilePath)
      return defaultData
    }
    // If data is of type AppData, return it
    return data as AppData
  } catch (err) {
    console.error('Error reading data:', err)
    return defaultData
  }
}

/**
 * Writes the provided `AppData` object to a file named 'apps.json'. If the write is successful, it also sends the data to the web UI via the `sendIpcData` function. If there is an error writing the data, it logs the error to the `loggingStore`.
 *
 * @param {AppData} data - The `AppData` object to be written to the file.
 * @returns {void}
 */
const writeData = (data: AppData): void => {
  try {
    const result = writeToFile<AppData>(data, 'apps.json')
    if (!result) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'Error writing data')
    }
    sendIpcData('app-data', data) // Send data to the web UI
  } catch (err) {
    loggingStore.log(MESSAGE_TYPES.ERROR, 'Error writing data' + err)
    console.error('Error writing data:', err)
  }
}

/**
 * Updates the application data by either adding a new app or updating an existing one.
 *
 * @param {App} newApp - The new app to be added or updated.
 * @returns {Promise<void>} - A Promise that resolves when the data has been written to the file.
 */
const setAppData = async (newApp: App): Promise<void> => {
  const data = readData()

  // Find existing app by name
  const existingAppIndex = data.apps.findIndex((app: App) => app.name === newApp.name)

  if (existingAppIndex !== -1) {
    // Update existing app
    data.apps[existingAppIndex] = newApp
  } else {
    // Add new app
    data.apps.push(newApp)
  }
  writeData(data)
}

/**
 * Updates the application data by setting the `apps` property of the `AppData` object to the provided `appsList` array.
 *
 * @param {App[]} appsList - The new list of apps to be set in the `AppData` object.
 * @returns {Promise<void>} - A Promise that resolves when the data has been written to the file.
 */
const setAppsData = async (appsList: App[]): Promise<void> => {
  const data = readData()
  data.apps = appsList
  writeData(data)
}

/**
 * Adds or updates the manifest for an existing application.
 *
 * @param {Manifest} manifest - The new manifest to be added or updated.
 * @param {string} appName - The name of the application to update.
 * @returns {void}
 */
const addAppManifest = (manifest: Manifest, appName: string): void => {
  const data = readData()

  // Find existing app by name
  const existingAppIndex = data.apps.findIndex((app: App) => app.name === appName)

  if (existingAppIndex !== -1) {
    // Update existing app
    data.apps[existingAppIndex].manifest = manifest
  } else {
    // Add new app
    console.error(`${appName} does not exist!`)
  }
  writeData(data)
}

/**
 * Adds or updates a configuration value in the application data.
 *
 * @param {string} configName - The name of the configuration to add or update.
 * @param {string | Array<string>} config - The new configuration value or array of values to set.
 * @param {AppData} [data=readData()] - The application data object to modify. Defaults to the result of `readData()`.
 * @returns {void}
 */
const addConfig = (configName: string, config: string | Array<string>, data = readData()): void => {
  if (!data.config) {
    const val = {}
    val[configName] = config
    data.config = val
  } else if (Array.isArray(data.config[configName])) {
    const existingArray = data.config[configName] as string[]
    if (Array.isArray(config)) {
      config.forEach((item) => {
        if (!existingArray.includes(item)) {
          existingArray.push(item)
        }
      })
    } else {
      if (!existingArray.includes(config)) {
        existingArray.push(config)
      }
    }
  } else {
    data.config[configName] = config
  }
  // loggingStore.log(MESSAGE_TYPES.CONFIG, {
  //   app: 'server',
  //   type: 'config',
  //   payload: data.config
  // })
  writeData(data)
}
const getConfig = (
  configName: string
): { [app: string]: string | Array<string> | ButtonMapping | undefined } => {
  const data = readData()

  if (!data.config) {
    const val = {}
    data.config = val
    writeData(data)
  }

  return { [configName]: data.config[configName] }
}

/**
 * Retrieves the application data.
 *
 * @returns {AppData} The application data.
 */
const getAppData = (): AppData => {
  const data = readData()
  return data
}

/**
 * Retrieves an application by its name.
 *
 * @param appName - The name of the application to retrieve.
 * @returns The application if found, or `undefined` if not found.
 */
const getAppByName = (appName: string): App | undefined => {
  const data = readData()

  // Find the app by name in the apps array
  const foundApp = data.apps.find((app: App) => app.name === appName)

  return foundApp
}

/**
 * Retrieves an application by its index.
 *
 * @param index - The index of the application to retrieve.
 * @returns The application if found, or `undefined` if not found.
 */
const getAppByIndex = (index: number): App | undefined => {
  const data = readData()

  // Find the app by name in the apps array
  const foundApp = data.apps.find((app: App) => app.prefIndex === index)

  return foundApp
}

/**
 * Purges the configuration for the specified application.
 *
 * @param appName - The name of the application to purge the configuration for.
 * @returns A Promise that resolves when the configuration has been purged.
 */
const purgeAppConfig = async (appName: string): Promise<void> => {
  loggingStore.log(MESSAGE_TYPES.LOGGING, `Purging app: ${appName}`)
  const data = readData()

  // Filter out the app to be purged
  const filteredApps = data.apps.filter((app: App) => app.name !== appName)
  data.apps = filteredApps

  writeData(data)
  // loggingStore.log(MESSAGE_TYPES.CONFIG, {
  //   app: 'server',
  //   type: 'config',
  //   payload: data.config
  // })
}

export {
  setAppData,
  setAppsData,
  getAppData,
  getAppByName,
  getAppByIndex,
  addAppManifest,
  addConfig,
  getConfig,
  purgeAppConfig
}
