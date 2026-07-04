import { cofhejs } from 'cofhejs/web'

export type EncryptedField = {
  data: string
  securityZone: number
}

let initialized = false
let initError: string | null = null

export async function initCofhejs(viemClient: any, viemWalletClient?: any) {
  if (initialized) return
  try {
    const env = (import.meta.env.VITE_COFHE_ENVIRONMENT || 'MOCK') as 'MOCK' | 'LOCAL' | 'TESTNET' | 'MAINNET'
    const result = await cofhejs.initializeWithViem({
      viemClient,
      viemWalletClient,
      environment: env,
      coFheUrl: import.meta.env.VITE_COFHE_URL || undefined,
      verifierUrl: import.meta.env.VITE_VERIFIER_URL || undefined,
      thresholdNetworkUrl: import.meta.env.VITE_THRESHOLD_NETWORK_URL || undefined,
      generatePermit: !!viemWalletClient,
    })
    if (!result.success) {
      initError = result.error?.message ?? 'cofhejs init failed'
      return
    }
    initialized = true
  } catch (err: any) {
    initError = err?.message ?? 'Failed to initialize cofhejs'
  }
}

export function isCofhejsReady() {
  return initialized
}

export function getCofhejsError() {
  return initError
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return '0x' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function encryptFields(values: number[]): Promise<EncryptedField[]> {
  const result = await cofhejs.encrypt(values)
  if (!result.success) throw new Error(`Encryption failed: ${result.error?.message ?? 'unknown'}`)
  return (result.data as unknown as { data: Uint8Array; securityZone: number }[]).map((item) => ({
    data: uint8ArrayToHex(item.data),
    securityZone: item.securityZone,
  }))
}

export function stringToUint32(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash |= 0
  }
  return hash >>> 0
}
