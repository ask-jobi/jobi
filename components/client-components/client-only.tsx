"use client"
import React, { PropsWithChildren } from "react"

function ClientOnly(props: PropsWithChildren<any>) {
  const { children } = props
  const [hasMounted, setHasMounted] = React.useState(false)
  React.useEffect(() => {
    setHasMounted(true)
  }, [])
  if (!hasMounted) {
    return null
  }
  return <>{children}</>
}

export default ClientOnly
