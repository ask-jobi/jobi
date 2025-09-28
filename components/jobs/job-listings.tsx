'use client'

import { useState } from 'react'
import { Heart, Briefcase, MapPin, Zap, ThumbsUp, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface JobListingsProps {
  searchQuery: string
  contractType: string
  location: string
  filters: any
  sortBy: string
  setSortBy: (sort: string) => void
}

// Mock data
const mockJobs = [
  {
    id: 1,
    company: 'Pernod Ricard',
    logo: '🌺',
    title: 'Group Social Reporting HR Intern - Mars 2026',
    type: 'Internship 4 to 6 months',
    location: 'Paris, France',
    badges: [
      { text: 'Simple application', icon: Zap, color: 'bg-green-100 text-green-800' },
      { text: 'Job of the week', icon: ThumbsUp, color: 'bg-gray-100 text-gray-800' }
    ],
    isSaved: false
  },
  {
    id: 2,
    company: 'SCOR',
    logo: '🌊',
    title: 'Solution Analyst Intern',
    type: 'Internship 7 to 9 months',
    location: 'Île-de-France, France',
    badges: [],
    isSaved: false
  },
  {
    id: 3,
    company: 'TechCorp',
    logo: '💻',
    title: 'Frontend Developer',
    type: 'Full-time',
    location: 'Lyon, France',
    badges: [
      { text: 'Remote friendly', icon: MapPin, color: 'bg-blue-100 text-blue-800' }
    ],
    isSaved: true
  },
  {
    id: 4,
    company: 'DataFlow',
    logo: '📊',
    title: 'Data Scientist',
    type: 'Contract 6 months',
    location: 'Marseille, France',
    badges: [
      { text: 'High salary', icon: Zap, color: 'bg-yellow-100 text-yellow-800' }
    ],
    isSaved: false
  }
]

export function JobListings({ searchQuery, contractType, location, sortBy, setSortBy }: JobListingsProps) {
  const [jobs] = useState(mockJobs)
  const [savedJobs, setSavedJobs] = useState(new Set([3]))

  const toggleSave = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesContract = !contractType || job.type.toLowerCase().includes(contractType.toLowerCase())
    
    const matchesLocation = !location || 
      job.location.toLowerCase().includes(location.toLowerCase())
    
    return matchesSearch && matchesContract && matchesLocation
  })

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Results Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-green-600">{filteredJobs.length}</span>
          <span className="text-sm text-muted-foreground">jobs</span>
          <div className="w-3 h-3 bg-muted-foreground/20 rounded-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">i</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance" icon={ArrowUpDown}>By relevance</SelectItem>
              <SelectItem value="date" icon={ArrowUpDown}>By date</SelectItem>
              <SelectItem value="salary" icon={ArrowUpDown}>By salary</SelectItem>
              <SelectItem value="company" icon={ArrowUpDown}>By company</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scrollable Job Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-4">
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Company Logo */}
                    <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center text-lg">
                      {job.logo}
                    </div>
                    
                    {/* Job Info */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{job.company}</h3>
                      </div>
                      
                      <h2 className="font-bold text-lg">{job.title}</h2>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex gap-1.5 flex-wrap">
                        {job.badges.map((badge, index) => (
                          <Badge key={index} className={`${badge.color} border-0 text-xs`}>
                            <badge.icon className="w-2.5 h-2.5 mr-1" />
                            {badge.text}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSave(job.id)}
                    className="p-1.5"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        savedJobs.has(job.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`} 
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Load More - Inside scrollable area */}
          <div className="text-center py-6">
            <Button variant="outline" size="sm">
              Load more jobs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
