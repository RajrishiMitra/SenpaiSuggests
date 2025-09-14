"use client"
import { useState } from "react"
import type React from "react"

type Props = React.ImgHTMLAttributes<HTMLImageElement>

export default function ImageWithFade(props: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      {...props}
      onLoad={(e) => {
        setLoaded(true)
        props.onLoad?.(e)
      }}
      className={["img-fade", loaded ? "img-fade-loaded" : "", props.className].filter(Boolean).join(" ")}
    />
  )
}
