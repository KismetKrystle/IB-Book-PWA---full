"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Workaround for https://github.com/recharts/recharts/issues/3615
const CartesianGrid = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof RechartsPrimitive.CartesianGrid>>(
  function CartesianGrid(props, ref) {
    return <RechartsPrimitive.CartesianGrid ref={ref} strokeDasharray="1 1" {...props} />
  },
)

const ChartContext = React.createContext<
  | {
      config: ChartConfig
    }
  | undefined
>(undefined)

type ChartConfig = {
  [k: string]: {
    label?: string
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    const id = React.useId()
    if (!config || typeof config !== "object") {
      return null
    }

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={id}
          ref={ref}
          className={cn(
            "flex h-[--chart-height] w-full flex-col [&_.recharts-cartesian-grid]:stroke-border/50 [&_.recharts-default-tooltip]:rounded-lg [&_.recharts-default-tooltip]:border-border [&_.recharts-default-tooltip]:bg-background [&_.recharts-default-tooltip]:shadow-md [&_.recharts-tooltip-cursor]:fill-accent/20 [&_.recharts-xaxis-tick]:fill-muted-foreground [&_.recharts-yaxis-tick]:fill-muted-foreground [&_.recharts-active-dot]:stroke-background/50 [&_.recharts-active-dot]:[stroke-width:2px] [&_.recharts-active-dot]:fill-[--color-active] [&_.recharts-dot]:fill-primary/20 [&_.recharts-tooltip-item]:flex",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideIndicator?: boolean
    indicator?: "dot" | "line"
  }
>(({ active, payload, className, indicator = "dot", hideIndicator = false, ...props }, ref) => {
  const { config } = React.useContext(ChartContext)!

  if (!active || !payload || payload.length === 0 || !config || typeof config !== "object") {
    return null
  }

  const formattedPayload = payload.map((item) => {
    const key = item.dataKey as keyof typeof config
    const configItem = config[key]

    return {
      color: configItem?.color || item.color,
      label: configItem?.label || item.name,
      value: item.value,
    }
  })

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-center justify-items-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
      {...props}
    >
      {formattedPayload.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex w-full items-center justify-between gap-2",
            indicator === "dot" && "before:size-2 before:rounded-full",
            indicator === "line" && "before:h-2 before:w-2 before:rounded-full",
            hideIndicator ? "before:hidden" : "before:bg-[--color-tooltip]",
          )}
          style={
            {
              "--color-tooltip": item.color,
            } as React.CSSProperties
          }
        >
          <RechartsPrimitive.Label className="text-muted-foreground">{item.label}</RechartsPrimitive.Label>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof ChartTooltip>>(
  (props, ref) => (
    <ChartTooltip
      ref={ref}
      wrapperClassName="!bg-transparent !border-none shadow-none"
      content={<ChartTooltip {...props} />}
    />
  ),
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent, CartesianGrid }
