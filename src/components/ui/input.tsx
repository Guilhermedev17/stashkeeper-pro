import * as React from "react"

import { cn } from "@/lib/utils"

interface InputBaseProps {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputBaseProps>, InputBaseProps {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full group">
        {prefix && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
            {prefix}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background/80 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0 focus-visible:border-accent/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 md:text-sm backdrop-blur-xs",
            prefix ? "pl-9 pr-3" : "px-3",
            suffix ? "pr-9" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
            {suffix}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
