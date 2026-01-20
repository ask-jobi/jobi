"use client"

import { MoreVertical, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Mock data
const mockSavedSearches = [
  {
    id: 1,
    query: "'cloud engineer' • Part-time / Student job",
    notifications: 6,
    isActive: true
  },
  {
    id: 2,
    query: "'data scientist' • Paris • Full-time'",
    notifications: 2,
    isActive: false
  },
  {
    id: 3,
    query: "'frontend developer' • Remote'",
    notifications: 0,
    isActive: false
  }
]

export function SavedSearches() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">My saved search</CardTitle>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {mockSavedSearches.map((search) => (
          <div
            key={search.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              search.isActive
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  {search.query}
                </p>
                {search.notifications > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 border-0"
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    {search.notifications} news
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-4">
          Create new search
        </Button>
      </CardContent>
    </Card>
  )
}
