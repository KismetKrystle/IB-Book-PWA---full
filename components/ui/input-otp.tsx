"use client"

import * as React from "react"
import { OTPInput, type Slot, type OTPInputProps } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, OTPInputProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  ),
)
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />,
)
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot> & { index: number }
>(({ index, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-9 w-9 items-center justify-center border border-input text-sm shadow-sm transition-all focus-within:z-10 group-data-[focus]:border-accent-foreground group-data-[active]:border-accent-foreground",
      className,
    )}
    {...props}
  >
    {props.children}
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 rounded-md",
        index === 0 && "rounded-l-md",
        index === (props["data-length"] ?? 0) - 1 && "rounded-r-md",
        "group-data-[active]:group-data-[focus]:border-2 group-data-[active]:group-data-[focus]:border-accent-foreground group-data-[active]:group-data-[focus]:ring-2 group-data-[active]:group-data-[focus]:ring-ring",
      )}
    />
  </div>
))
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<typeof Minus>,
  React.ComponentPropsWithoutRef<typeof Minus>
>(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn("flex items-center", className)} {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
