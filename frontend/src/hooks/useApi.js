import { useCallback, useEffect, useState } from 'react'

/**
 * Gọi API khi component hiển thị (và khi deps thay đổi).
 * Trả về { data, loading, error, reload }.
 * Khi tải lại, dữ liệu cũ được giữ nguyên (không nháy trắng màn hình).
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null })
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    let daHuy = false
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(fn)
      .then(
        (data) => !daHuy && setState({ data, loading: false, error: null }),
        (error) => !daHuy && setState((s) => ({ ...s, loading: false, error })),
      )
    return () => {
      daHuy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, lanTai])

  const reload = useCallback(() => setLanTai((n) => n + 1), [])
  return { ...state, reload }
}
