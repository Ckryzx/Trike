import { InputHTMLAttributes, ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  error?: string
  rightSlot?: ReactNode
}

export function Field({ label, helperText, error, rightSlot, id, className = '', ...props }: FieldProps) {
  const fieldId = id ?? props.name
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="font-heading text-lg font-semibold text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={fieldId}
          className={`min-h-[52px] w-full rounded-xl border-2 border-border bg-white px-4 text-lg text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary ${className}`}
          aria-describedby={helperText ? `${fieldId}-helper` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {rightSlot}
      </div>
      {helperText && !error && (
        <p id={`${fieldId}-helper`} className="text-base text-muted-foreground">
          {helperText}
        </p>
      )}
      {error && <p className="text-base font-medium text-destructive">{error}</p>}
    </div>
  )
}
