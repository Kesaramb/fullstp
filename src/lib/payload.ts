import { getPayload as getPayloadInstance } from 'payload'
import config from '@payload-config'

export async function getPayloadClient() {
  return getPayloadInstance({ config })
}
