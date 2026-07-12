'use client'

import { Briefcase } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CaseModalProps } from '@/types/cases'

export function CaseModal({ open, onClose, caseInfo }: CaseModalProps) {
  if (!caseInfo) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 shrink-0 text-primary" />
            <div className="text-left">
              <DialogTitle>{caseInfo.title}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Caso #{caseInfo.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {caseInfo.notes && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Descripción</p>
            <p className="leading-relaxed">{caseInfo.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
