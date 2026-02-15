import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({
    options = [],
    value,
    onValueChange,
    placeholder = "Tanlang...",
    searchPlaceholder = "Qidirish...",
    emptyText = "Natija topilmadi",
    className,
    disabled = false,
}) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const inputRef = React.useRef(null)
    const listRef = React.useRef(null)

    const selectedOption = options.find((option) => option.value === value)

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options
        return options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [options, searchQuery])

    // Reset highlight when filtered options change
    React.useEffect(() => {
        setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
    }, [filteredOptions])

    // When popover opens, focus the input
    React.useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
            setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
        }
        if (!open) {
            if (value && selectedOption) {
                setSearchQuery("")
            }
            setHighlightedIndex(-1)
        }
    }, [open])

    // Scroll highlighted item into view
    React.useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-combobox-item]')
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: 'nearest' })
            }
        }
    }, [highlightedIndex])

    const displayValue = open ? searchQuery : (selectedOption ? selectedOption.label : "")

    const handleInputChange = (e) => {
        const val = e.target.value
        setSearchQuery(val)
        if (!open) {
            setOpen(true)
        }
    }

    const handleSelect = (option) => {
        onValueChange(option.value === value ? "" : option.value)
        setSearchQuery("")
        setOpen(false)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onValueChange("")
        setSearchQuery("")
    }

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            setOpen(false)
            setSearchQuery("")
            return
        }

        if (e.key === "ArrowDown") {
            e.preventDefault()
            if (!open) {
                setOpen(true)
                return
            }
            setHighlightedIndex((prev) => {
                const next = prev + 1
                return next >= filteredOptions.length ? 0 : next
            })
            return
        }

        if (e.key === "ArrowUp") {
            e.preventDefault()
            if (!open) {
                setOpen(true)
                return
            }
            setHighlightedIndex((prev) => {
                const next = prev - 1
                return next < 0 ? filteredOptions.length - 1 : next
            })
            return
        }

        if (e.key === "Enter") {
            e.preventDefault()
            if (open && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                handleSelect(filteredOptions[highlightedIndex])
            } else if (!open) {
                setOpen(true)
            }
            return
        }

        if (e.key === "Tab") {
            // On Tab, select highlighted item and close
            if (open && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                handleSelect(filteredOptions[highlightedIndex])
            } else {
                setOpen(false)
                setSearchQuery("")
            }
            return
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "relative flex items-center w-full h-12 bg-gray-50 border-2 border-gray-200 rounded-md px-3 transition-colors cursor-text",
                        open && "border-primary/50 ring-2 ring-primary/20",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                    onClick={() => {
                        if (!disabled) {
                            setOpen(true)
                            setTimeout(() => inputRef.current?.focus(), 50)
                        }
                    }}
                >
                    <Search className="h-4 w-4 text-gray-400 shrink-0 mr-2" />
                    <input
                        ref={inputRef}
                        type="text"
                        className={cn(
                            "flex-1 bg-transparent border-none outline-none text-base h-full placeholder:text-gray-400",
                            disabled && "cursor-not-allowed"
                        )}
                        placeholder={open ? searchPlaceholder : placeholder}
                        value={displayValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (!disabled) setOpen(true)
                        }}
                        disabled={disabled}
                        autoComplete="off"
                    />
                    {value && !open && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-1"
                        >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
                <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                            {emptyText}
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                data-combobox-item
                                className={cn(
                                    "relative flex items-center px-3 py-3 text-base cursor-pointer select-none transition-colors",
                                    highlightedIndex === index && "bg-blue-50 text-blue-900",
                                    highlightedIndex !== index && "hover:bg-gray-50",
                                    value === option.value && "font-semibold"
                                )}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        value === option.value ? "opacity-100 text-primary" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
