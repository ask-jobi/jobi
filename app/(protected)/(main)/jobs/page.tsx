"use client"

import { useState } from "react"
import { JobSearchHeader } from "@/components/jobs/job-search-header"
import { JobListings } from "@/components/jobs/job-listings"
import { SavedSearches } from "@/components/jobs/saved-searches"

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contractType, setContractType] = useState("")
  const [location, setLocation] = useState("")
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState("relevance")

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Fixed Header */}
      <div className="bg-muted/30 border-b flex-shrink-0">
        <div className="p-4">
          <JobSearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            contractType={contractType}
            setContractType={setContractType}
            location={location}
            setLocation={setLocation}
            filters={filters}
            setFilters={setFilters}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            {/* Job Listings - Main Content */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <JobListings
                searchQuery={searchQuery}
                contractType={contractType}
                location={location}
                filters={filters}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <SavedSearches />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
