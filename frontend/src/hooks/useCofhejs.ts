import { useEffect, useState, useCallback } from 'react'
import { useWalletClient, usePublicClient } from 'wagmi'
import { initCofhejs, isCofhejsReady, getCofhejsError, encryptFields as doEncrypt } from '../services/cofhejs'
import type { EncryptedField } from '../services/cofhejs'

export function useCofhejs() {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [ready, setReady] = useState(isCofhejsReady())
  const [error, setError] = useState<string | null>(getCofhejsError())

  useEffect(() => {
    if (ready) return
    if (!publicClient) return

    initCofhejs(publicClient, walletClient ?? undefined)
      .then(() => {
        setReady(isCofhejsReady())
        setError(getCofhejsError())
      })
      .catch((err: any) => {
        setError(err?.message ?? 'init failed')
      })
  }, [ready, publicClient, walletClient])

  const encryptFields = useCallback(async (values: number[]): Promise<EncryptedField[] | null> => {
    if (!isCofhejsReady()) return null
    try {
      return await doEncrypt(values)
    } catch {
      return null
    }
  }, [])

  return { ready, error, encryptFields }
}
