/**
 * Event logging for the deployment runner.
 *
 * Appends structured NDJSON events to events.ndjson and updates status.json.
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export class EventLogger {
  constructor(jobDir) {
    this.jobDir = jobDir
    this.index = 0
    this.eventsFile = join(jobDir, 'events.ndjson')
    this.statusFile = join(jobDir, 'status.json')
    this.startedAt = new Date().toISOString()

    if (!existsSync(jobDir)) {
      mkdirSync(jobDir, { recursive: true })
    }
    // Initialize empty events file
    writeFileSync(this.eventsFile, '')
  }

  /** Emit a structured event and update status. */
  emit(stage, agent, status, text, meta) {
    const event = {
      index: this.index++,
      ts: new Date().toISOString(),
      stage,
      agent,
      status,
      text,
      ...(meta && { meta }),
    }

    appendFileSync(this.eventsFile, JSON.stringify(event) + '\n')
    this.writeStatus(stage, status === 'error' ? 'error' : 'running')
    return event
  }

  /** Write current status to status.json. */
  writeStatus(stage, state) {
    const status = {
      jobId: this.jobId,
      stage,
      state,
      lastEventIndex: this.index - 1,
      startedAt: this.startedAt,
      ...(state === 'success' || state === 'error'
        ? { finishedAt: new Date().toISOString() }
        : {}),
    }
    writeFileSync(this.statusFile, JSON.stringify(status, null, 2) + '\n')
  }

  /** Write final result to result.json. */
  writeResult(result) {
    const resultFile = join(this.jobDir, 'result.json')
    writeFileSync(resultFile, JSON.stringify(result, null, 2) + '\n')
    this.writeStatus(result.stage, result.state)
  }

  setJobId(jobId) {
    this.jobId = jobId
  }
}
