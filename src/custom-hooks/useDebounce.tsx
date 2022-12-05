import { useState, useEffect } from "react"

const useDebounce = (value, debounceTimeout = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, debounceTimeout)

    return () => {
      clearTimeout(handler)
    }
  }, [value, debounceTimeout])

  return debouncedValue
}

export default useDebounce
