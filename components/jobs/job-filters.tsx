"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function JobFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const filterOptions = [
    { id: "remote", label: "Remote", count: 45 },
    { id: "full-time", label: "Full-time", count: 120 },
    { id: "part-time", label: "Part-time", count: 67 },
    { id: "contract", label: "Contract", count: 89 },
    { id: "internship", label: "Internship", count: 34 },
    { id: "startup", label: "Startup", count: 23 },
    { id: "big-company", label: "Big Company", count: 156 },
    { id: "high-salary", label: "High Salary", count: 78 }
  ]

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    )
  }

  const clearAllFilters = () => {
    setActiveFilters([])
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filterOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter(option.id)}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeFilters.includes(option.id)}
                onChange={() => toggleFilter(option.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{option.label}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {option.count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
