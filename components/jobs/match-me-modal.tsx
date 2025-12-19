'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Sparkles, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ResumeUpload from '@/components/client-components/resume-upload'

interface Resume {
  id: string
  title: string
  company?: string
  position?: string
  updatedAt: string
  thumbnailUrl?: string
}

interface MatchMeModalProps {
  isOpen: boolean
  onClose: () => void
  onMatch: (resumeData: { type: 'existing' | 'new', resumeId?: string, file?: File }) => void
}

// Mock data for existing resumes
const mockResumes: Resume[] = [
  {
    id: '1',
    title: 'Software Engineer Resume',
    company: 'TechCorp',
    position: 'Senior Developer',
    updatedAt: '2024-01-15',
    thumbnailUrl: '/api/resume/thumbnail?resume_id=1'
  },
  {
    id: '2', 
    title: 'Product Manager Resume',
    company: 'StartupXYZ',
    position: 'Product Lead',
    updatedAt: '2024-01-10',
    thumbnailUrl: '/api/resume/thumbnail?resume_id=2'
  },
  {
    id: '3',
    title: 'Data Scientist Resume',
    company: 'DataFlow Inc',
    position: 'ML Engineer',
    updatedAt: '2024-01-08',
    thumbnailUrl: '/api/resume/thumbnail?resume_id=3'
  }
]

export function MatchMeModal({ isOpen, onClose, onMatch }: MatchMeModalProps) {
  const [selectedResume, setSelectedResume] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [step, setStep] = useState<'select' | 'upload'>('select')

  useEffect(() => {
    if (isOpen) {
      setSelectedResume(null)
      setUploadedFile(null)
      setStep('select')
    }
  }, [isOpen])

  // Reset file when switching to upload step
  useEffect(() => {
    if (step === 'upload') {
      setUploadedFile(null)
    }
  }, [step])

  const handleExistingResumeSelect = (resumeId: string) => {
    setSelectedResume(resumeId)
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
  }

  const handleMatch = () => {
    if (step === 'select' && selectedResume) {
      onMatch({ type: 'existing', resumeId: selectedResume })
    } else if (step === 'upload' && uploadedFile) {
      onMatch({ type: 'new', file: uploadedFile })
    }
  }

  const canProceed = () => {
    if (step === 'select') return selectedResume !== null
    if (step === 'upload') return uploadedFile !== null
    return false
  }

  const selectedResumeData = mockResumes.find(r => r.id === selectedResume)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Match Me with Jobs
          </DialogTitle>
        </DialogHeader>

        {/* Step Selection */}
        <div className="flex gap-4 mb-2">
          <Button
            variant={step === 'select' ? 'default' : 'outline'}
            onClick={() => setStep('select')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Use Existing Resume
          </Button>
          <Button
            variant={step === 'upload' ? 'default' : 'outline'}
            onClick={() => setStep('upload')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Resume
          </Button>
        </div>

        {/* Existing Resumes Selection */}
        {step === 'select' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Select a Resume</h3>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-4">
              {mockResumes.map((resume) => (
                <Card
                  key={resume.id}
                  className={`cursor-pointer transition-all ${
                    selectedResume === resume.id
                      ? 'border-2 border-purple-500 bg-purple-50/50'
                      : 'hover:bg-muted/50 border border-border'
                  }`}
                  onClick={() => handleExistingResumeSelect(resume.id)}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-muted/50 rounded flex items-center justify-center">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{resume.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Updated {resume.updatedAt}
                        </p>
                      </div>
                      {selectedResume === resume.id && (
                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Resume</h3>
            <ResumeUpload
              file={uploadedFile || undefined}
              onSelectFile={handleFileUpload}
            />
          </div>
        )}

        {/* Selected Resume Preview */}
        {selectedResumeData && step === 'select' && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Selected Resume</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">{selectedResumeData.title}</p>
                <p className="text-sm text-purple-700">
                  {selectedResumeData.position} at {selectedResumeData.company}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleMatch}
            disabled={!canProceed()}
            className={`flex-1 ${
              canProceed() 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Find Matching Jobs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
