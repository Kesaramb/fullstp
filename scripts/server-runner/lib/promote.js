/**
 * Promote a staged tenant app into the live Hestia domain path.
 */

import { execSync } from 'node:child_process'
import { RunnerError } from './provision.js'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

export function promoteStagedApp(stageNodeappPath, finalNodeappPath, logger) {
  logger.emit('promoting', 'runner', 'running', 'Promoting staged build into live domain path...')

  try {
    run(`mkdir -p ${finalNodeappPath}`, 10000)
    run(`cp -a ${stageNodeappPath}/. ${finalNodeappPath}/`, 180000)
    logger.emit('promoting', 'runner', 'done', `Staged app promoted to ${finalNodeappPath}`)
  } catch (err) {
    logger.emit('promoting', 'runner', 'error', `Promotion failed: ${err.message}`, { errorCode: 'PROMOTION_FAILED' })
    throw new RunnerError('PROMOTION_FAILED', `Failed to promote staged app: ${err.message}`)
  }
}
