"use client"

import { useState } from "react"
import { Search, Briefcase, MapPin, Filter, Bell, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { MatchMeModal } from "./match-me-modal"

interface JobSearchHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  contractType: string
  setContractType: (type: string) => void
  location: string
  setLocation: (location: string) => void
  filters?: any
  setFilters?: (filters: any) => void
}

export function JobSearchHeader({
  searchQuery,
  setSearchQuery,
  contractType,
  setContractType,
  location,
  setLocation
}: JobSearchHeaderProps) {
  const [activeFilters] = useState(1)
  const [isMatchMeModalOpen, setIsMatchMeModalOpen] = useState(false)

  const contractTypes = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" }
  ]

  const locations = [
    { value: "paris", label: "Paris, France" },
    { value: "lyon", label: "Lyon, France" },
    { value: "marseille", label: "Marseille, France" },
    { value: "toulouse", label: "Toulouse, France" },
    { value: "remote", label: "Remote" }
  ]

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by job, company or keyword"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger className="w-36 h-10">
              <Briefcase className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Contract" />
            </SelectTrigger>
            <SelectContent>
              {contractTypes.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  icon={Briefcase}
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-44 h-10">
              <MapPin className="w-4 h-4 mr-1" />
              <SelectValue placeholder="City, department..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value} icon={MapPin}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" className="h-8 relative">
            <Filter className="w-3.5 h-3.5 mr-1" />
            All filters
            <Badge
              variant="secondary"
              className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {activeFilters}
            </Badge>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            className="h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
            onClick={() => setIsMatchMeModalOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Match Me
          </Button>
          <Button className="h-8 bg-green-600 hover:bg-green-700 text-sm">
            <Bell className="w-3.5 h-3.5 mr-1" />
            Save this search
          </Button>
        </div>
      </div>

      {/* Match Me Modal */}
      <MatchMeModal
        isOpen={isMatchMeModalOpen}
        onClose={() => setIsMatchMeModalOpen(false)}
        onMatch={(resumeData) => {
          // TODO: 实现RAG搜索逻辑
          console.log("Matching with resume:", resumeData)
          setIsMatchMeModalOpen(false)
        }}
      />
    </div>
  )
}
