import * as React from "react"
import { format, startOfDay, isBefore } from "date-fns"
import { uz } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
    value,
    onChange,
    placeholder = "Sanani tanlang",
    className,
    disabled = false,
    disablePastDates = false,
}) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState(value ? new Date(value) : undefined)

    React.useEffect(() => {
        if (value) {
            setDate(new Date(value))
        }
    }, [value])

    const handleSelect = (selectedDate) => {
        setDate(selectedDate)
        if (selectedDate && onChange) {
            const formatted = format(selectedDate, "yyyy-MM-dd")
            onChange(formatted)
        }
        setOpen(false)
    }

    // O'tgan kunlarni disable qilish
    const disabledDays = disablePastDates
        ? { before: startOfDay(new Date()) }
        : undefined

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-12 bg-gray-50 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-base",
                        !date && "text-gray-400",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd.MM.yyyy", { locale: uz }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                    locale={uz}
                    disabled={disabledDays}
                    today={new Date()}
                />
            </PopoverContent>
        </Popover>
    )
}
