import * as React from "react"

import { cn } from "@/lib/utils"
import { inputRootState } from "../styles/input"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputRootState,
        className
      )}
      {...props}
    />
  )
}

export { Input }
