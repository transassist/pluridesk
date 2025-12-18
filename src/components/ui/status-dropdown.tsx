"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type StatusOption = {
    value: string;
    label: string;
    className?: string;
};

interface StatusDropdownProps {
    currentStatus: string;
    options: readonly StatusOption[] | StatusOption[];
    onStatusChange: (newValue: string) => void;
    isLoading?: boolean;
    className?: string;
    statusColorMap?: Record<string, string>;
}

export function StatusDropdown({
    currentStatus,
    options,
    onStatusChange,
    isLoading,
    className,
    statusColorMap,
}: StatusDropdownProps) {
    const currentOption = options.find((opt) => opt.value === currentStatus);
    const label = currentOption?.label ?? currentStatus;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-auto p-0 px-2 py-1 hover:bg-transparent focus-visible:ring-0",
                        className
                    )}
                    disabled={isLoading}
                >
                    <Badge
                        variant="outline"
                        className={cn(
                            "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium capitalize transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-primary/20",
                            statusColorMap?.[currentStatus] ?? "bg-muted text-muted-foreground",
                            isLoading && "opacity-50 grayscale"
                        )}
                    >
                        {label}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px] glass-card">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        className={cn(
                            "flex items-center justify-between gap-2 text-xs",
                            currentStatus === option.value && "bg-primary/5 font-semibold text-primary"
                        )}
                        onClick={() => onStatusChange(option.value)}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    statusColorMap?.[option.value]?.split(" ").find(c => c.startsWith("bg-")) ?? "bg-muted"
                                )}
                            />
                            {option.label}
                        </div>
                        {currentStatus === option.value && <Check className="h-3 w-3" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
