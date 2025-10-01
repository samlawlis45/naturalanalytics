import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outlined" | "interactive"
    size?: "sm" | "md" | "lg"
  }
>(({ className, variant = "default", size = "md", ...props }, ref) => {
  const variants = {
    default: "bg-white border border-slate-200 shadow-sm",
    elevated: "bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300",
    outlined: "bg-white border-2 border-slate-200 shadow-none",
    interactive: "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-250 cursor-pointer hover:-translate-y-0.5",
  }

  const sizes = {
    sm: "p-3 rounded-lg",
    md: "p-6 rounded-xl", 
    lg: "p-8 rounded-2xl",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-colors duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: "space-y-1 pb-2",
    md: "space-y-1.5 pb-4",
    lg: "space-y-2 pb-6",
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col", sizes[size], className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    size?: "sm" | "md" | "lg" | "xl"
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, size = "md", as: Component = "h3", ...props }, ref) => {
  const sizes = {
    sm: "text-lg font-semibold leading-tight text-slate-900",
    md: "text-xl font-semibold leading-tight text-slate-900",
    lg: "text-2xl font-semibold leading-tight text-slate-900",
    xl: "text-3xl font-bold leading-tight text-slate-900",
  }

  return (
    <Component
      ref={ref}
      className={cn(sizes[size], className)}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: "text-sm text-slate-600",
    md: "text-sm text-slate-600 leading-relaxed",
    lg: "text-base text-slate-600 leading-relaxed",
  }

  return (
    <p
      ref={ref}
      className={cn(sizes[size], className)}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: "pt-2",
    md: "pt-4",
    lg: "pt-6",
  }

  return (
    <div 
      ref={ref} 
      className={cn(sizes[size], className)} 
      {...props} 
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: "flex items-center pt-2",
    md: "flex items-center pt-4",
    lg: "flex items-center pt-6",
  }

  return (
    <div
      ref={ref}
      className={cn(sizes[size], className)}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }