'use client'
import 'client-only'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CallbackState, CallbackParams, CallbackError } from '../shared/types'

interface UseAuthCallbackOptions {
  /**
   * コールバック成功時のリダイレクト先
   * デフォルト: "/"
   */
  successRedirect?: string
  
  /**
   * エラー時のリダイレクト先
   * デフォルト: "/login"
   */
  errorRedirect?: string
  
  /**
   * 自動リダイレクトを無効にする
   * デフォルト: false
   */
  disableAutoRedirect?: boolean
  
  /**
   * コールバック処理完了時のカスタムハンドラ
   */
  onSuccess?: (params: CallbackParams) => void
  onError?: (error: CallbackError) => void
}

/**
 * OAuth2コールバック処理専用フック
 * 
 * @param options コールバック処理のオプション
 * @returns コールバック状態とユーティリティ関数
 * 
 * @example
 * ```tsx
 * // app/auth/callback/page.tsx
 * 'use client'
 * import { useAuthCallback } from '@noranekoid/nextjs/client'
 * 
 * export default function CallbackPage() {
 *   const { status, error, isLoading } = useAuthCallback({
 *     successRedirect: '/dashboard',
 *     errorRedirect: '/login?error=callback_failed'
 *   })
 *   
 *   if (isLoading) return <div>認証処理中...</div>
 *   if (error) return <div>エラー: {error.error_description || error.error}</div>
 *   return <div>処理中...</div>
 * }
 * ```
 */
export function useAuthCallback(options: UseAuthCallbackOptions = {}): CallbackState {
  const {
    successRedirect = '/',
    errorRedirect = '/login',
    disableAutoRedirect = false,
    onSuccess,
    onError
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    error: null,
    isLoading: true,
    isSuccess: false,
    isError: false
  })

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URLパラメータを取得
        const params: CallbackParams = {
          code: searchParams.get('code') || undefined,
          state: searchParams.get('state') || undefined,
          error: searchParams.get('error') || undefined,
          error_description: searchParams.get('error_description') || undefined,
          error_uri: searchParams.get('error_uri') || undefined
        }

        // エラーパラメータがある場合
        if (params.error) {
          const callbackError: CallbackError = {
            error: params.error,
            error_description: params.error_description,
            error_uri: params.error_uri
          }

          setState({
            status: 'error',
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          })

          // カスタムエラーハンドラを呼び出し
          onError?.(callbackError)

          // 自動リダイレクト
          if (!disableAutoRedirect) {
            const errorUrl = new URL(errorRedirect, window.location.origin)
            errorUrl.searchParams.set('callback_error', params.error)
            if (params.error_description) {
              errorUrl.searchParams.set('error_description', params.error_description)
            }
            router.push(errorUrl.toString())
          }
          return
        }

        // 認可コードがない場合
        if (!params.code) {
          const callbackError: CallbackError = {
            error: 'invalid_request',
            error_description: 'Authorization code not found in callback parameters'
          }

          setState({
            status: 'error',
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          })

          onError?.(callbackError)

          if (!disableAutoRedirect) {
            router.push(`${errorRedirect}?error=no_code`)
          }
          return
        }

        // コールバック処理をサーバーに送信
        const callbackUrl = new URL('/api/auth/callback', window.location.origin)
        callbackUrl.search = window.location.search // 全パラメータを転送

        const response = await fetch(callbackUrl.toString(), {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          // サーバーエラーの処理
          let errorMessage = 'Authentication failed'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error_description || errorData.error || errorMessage
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }

          const callbackError: CallbackError = {
            error: 'server_error',
            error_description: errorMessage
          }

          setState({
            status: 'error',
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          })

          onError?.(callbackError)

          if (!disableAutoRedirect) {
            router.push(`${errorRedirect}?error=server_error`)
          }
          return
        }

        // 成功時の処理
        setState({
          status: 'success',
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false
        })

        onSuccess?.(params)

        // 成功時のリダイレクト
        if (!disableAutoRedirect) {
          // 元々のリダイレクト先を取得（state パラメータや callbackUrl パラメータから）
          const originalRedirect = searchParams.get('callbackUrl') || successRedirect
          router.push(originalRedirect)
        }

      } catch (error) {
        // ネットワークエラーなどの処理
        const callbackError: CallbackError = {
          error: 'network_error',
          error_description: error instanceof Error ? error.message : 'Network error occurred'
        }

        setState({
          status: 'error',
          error: callbackError,
          isLoading: false,
          isSuccess: false,
          isError: true
        })

        onError?.(callbackError)

        if (!disableAutoRedirect) {
          router.push(`${errorRedirect}?error=network_error`)
        }
      }
    }

    processCallback()
  }, [searchParams, router, successRedirect, errorRedirect, disableAutoRedirect, onSuccess, onError])

  return state
}