console.log('[Auth Handler] Starting')
import { getAppData } from './configHandler' // Assuming you have a config handler for active apps
import { sendMessageToApp } from '../services/apps' // Assuming you have an app handler for sending messages
import http from 'http'
import url from 'url'
import settingsStore from '../stores/settingsStore'
import loggingStore from '../stores/loggingStore'
import { Settings, MESSAGE_TYPES } from '@shared/types'

const successView = '<h1>Success</h1><p>You can now close this window.</p>'

let server: http.Server | null = null
let callBackPort: number

/**
 * Handles the callback request for an app authentication flow.
 *
 * This function is responsible for processing the callback request from an app's authentication flow.
 * It extracts the app name from the URL, checks if the app is active, and then sends the callback data
 * to the app. Finally, it responds with a success view.
 *
 * @param req - The incoming HTTP request object.
 * @param res - The HTTP response object to send the response.
 */
function handleCallback(req: http.IncomingMessage, res: http.ServerResponse): void {
  const parsedUrl = url.parse(req.url || '', true)

  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `AUTH: Received callback request for ${parsedUrl.pathname}`
  )

  const urlParts = parsedUrl.pathname?.split('/').filter(Boolean)

  if (!urlParts || urlParts.length < 2) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end('Invalid callback URL')
    return
  }

  const appName = urlParts[1] // The app name should be the third part after '/callback/'
  const config = getAppData() // Assuming getConfig() returns an object with active apps
  if (!config.apps || !config.apps.some((app) => app.name === appName && app.enabled)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(`<h1>App Not Found</h1><p>App '${appName}' not found or not active.</p>`)
    return
  }

  const code = parsedUrl.query.code as string
  sendMessageToApp(appName, { type: 'callback-data', payload: code })

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(successView)
}

/**
 * Starts the HTTP server that handles callback requests for app authentication flows.
 *
 * This function creates an HTTP server that listens on the configured callback port. It handles
 * incoming requests to the `/callback/` endpoint by passing them to the `handleCallback` function.
 * If the request does not match the `/callback/` path, it responds with a 404 Not Found error.
 *
 * The server is started asynchronously, and any existing server instance is first closed before
 * the new one is created.
 */
const startServer = async (): Promise<void> => {
  if (server) {
    await server.close(() => {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'CALLBACK: Shutting down the server...')
    })
  }

  server = http.createServer((req, res) => {
    const parsedUrl = new URL(`http://${req.headers.host}${req.url}`)
    const pathname = parsedUrl.pathname
    if (pathname.startsWith('/callback/')) {
      handleCallback(req, res)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>Not Found</h1><p>The requested URL was not found on this server.</p>')
    }
  })

  server.listen(callBackPort, () => {
    loggingStore.log(
      MESSAGE_TYPES.MESSAGE,
      `CALLBACK: running at http://localhost:${callBackPort}/`
    )
  })
}

/**
 * Initializes the HTTP server that handles callback requests for app authentication flows.
 *
 * This function retrieves the callback port from the settings store, and then starts the server
 * by calling the `startServer` function. If there is an error retrieving the settings or starting
 * the server, it logs the error to the console.
 */
const initializeServer = async (): Promise<void> => {
  try {
    const settings = (await settingsStore.getSettings()) as Settings
    callBackPort = settings.callbackPort
    await startServer()
  } catch (error) {
    console.error('CALLBACK: Failed to get settings or start the server:', error)
  }
}

/**
 * Listens for changes to the callback port setting and updates the server configuration accordingly.
 * If the callback port changes, it stops the existing server and starts a new one with the updated port.
 * If the callback port does not change, it logs a message indicating that the server is not being restarted.
 * If there is an error updating the server configuration, it logs an error message.
 */
settingsStore.addListener((newSettings) => {
  try {
    if (newSettings.callbackPort != callBackPort) {
      callBackPort = newSettings.callbackPort
      startServer()
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'CALLBACK: Not starting - port is not changed')
    }
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'CALLBACK: Error updating with settings' + error)
    }
  }
})

initializeServer()
