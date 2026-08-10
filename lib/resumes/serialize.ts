import type { Document, Resume } from '@prisma/client'

export type CandidateSummary = {
  id: string
  documentId: string
  screeningId: string
  name: string
  email: string | null
  matchScore: number
  rank: number
  skillsMatched: string[]
  skillsMissing: string[]
  yearsExperience: number | null
  currentRole: string | null
  education: string | null
  summary: string | null
  fileName: string
  createdAt: string
}

export type CandidateDetail = CandidateSummary & {
  interviewQuestions: string[]
  resumeText: string | null
  fileUrl: string
  jobDescription: string
}

type ResumeWithDocument = Resume & {
  document: Pick<Document, 'fileName' | 'fileUrl' | 'extractedText'>
}

export function toCandidateSummary(resume: ResumeWithDocument): CandidateSummary {
  return {
    id: resume.id,
    documentId: resume.documentId,
    screeningId: resume.screeningId,
    name: resume.candidateName,
    email: resume.email,
    matchScore: Math.round(resume.jdMatchScore),
    rank: resume.ranking,
    skillsMatched: resume.skills,
    skillsMissing: resume.skillsMissing,
    yearsExperience: resume.yearsExperience,
    currentRole: resume.currentRole,
    education: resume.education,
    summary: resume.summary,
    fileName: resume.document.fileName,
    createdAt: resume.createdAt.toISOString(),
  }
}

export function toCandidateDetail(resume: ResumeWithDocument): CandidateDetail {
  return {
    ...toCandidateSummary(resume),
    interviewQuestions: resume.interviewQuestions,
    resumeText: resume.document.extractedText,
    fileUrl: resume.document.fileUrl,
    jobDescription: resume.jobDescription,
  }
}
