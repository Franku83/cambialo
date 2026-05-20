'use client'

import { create } from 'zustand'
import type { ListingCondition } from '@cambialo/types'

export interface PendingPhoto {
  id: string           // local UUID antes de subir
  file: File
  preview: string      // ObjectURL
  isVerification: boolean
  uploadedId?: string  // ID en DB tras upload
  cloudinaryUrl?: string
  uploading: boolean
  error?: string
}

export interface Step1Data {
  deviceModelId: string
  brand: string
  modelName: string
  storageGb: number
  imeiLast4: string
}

export interface Step2Data {
  condition: ListingCondition | null
  batteryHealth: number
  hasRepairs: boolean
  repairDetails: string
  hasIcloudLock: boolean
  hasGoogleLock: boolean
  includesBox: boolean
  includesCharger: boolean
  includesEarphones: boolean
}

export interface Step3Data {
  priceUsd: number
  acceptsOffers: boolean
  minOfferUsd: number
  city: string
  state: string
  meetAtMall: boolean
  acceptsTradeIn: boolean
  description: string
  latitude?: number
  longitude?: number
}

export interface Step4Data {
  verificationCode: string | null
  verificationExpiresAt: Date | null
}

interface SellState {
  currentStep: number
  listingId: string | null   // se establece al crear el draft
  step1: Partial<Step1Data>
  step2: Partial<Step2Data>
  step3: Partial<Step3Data>
  step4: Step4Data
  photos: PendingPhoto[]

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setListingId: (id: string) => void
  updateStep1: (data: Partial<Step1Data>) => void
  updateStep2: (data: Partial<Step2Data>) => void
  updateStep3: (data: Partial<Step3Data>) => void
  setVerificationCode: (code: string, expiresAt: Date) => void
  addPhoto: (photo: PendingPhoto) => void
  updatePhoto: (id: string, update: Partial<PendingPhoto>) => void
  removePhoto: (id: string) => void
  reset: () => void
}

const defaultStep2: Partial<Step2Data> = {
  hasIcloudLock: false,
  hasGoogleLock: false,
  hasRepairs: false,
  repairDetails: '',
  includesBox: false,
  includesCharger: false,
  includesEarphones: false,
}

const defaultStep3: Partial<Step3Data> = {
  acceptsOffers: false,
  minOfferUsd: 0,
  meetAtMall: true,
  description: '',
}

export const useSellStore = create<SellState>()((set) => ({
  currentStep: 1,
  listingId: null,
  step1: {},
  step2: defaultStep2,
  step3: defaultStep3,
  step4: { verificationCode: null, verificationExpiresAt: null },
  photos: [],

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  setListingId: (id) => set({ listingId: id }),

  updateStep1: (data) => set((s) => ({ step1: { ...s.step1, ...data } })),
  updateStep2: (data) => set((s) => ({ step2: { ...s.step2, ...data } })),
  updateStep3: (data) => set((s) => ({ step3: { ...s.step3, ...data } })),

  setVerificationCode: (code, expiresAt) =>
    set({ step4: { verificationCode: code, verificationExpiresAt: expiresAt } }),

  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  updatePhoto: (id, update) =>
    set((s) => ({
      photos: s.photos.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),
  removePhoto: (id) =>
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),

  reset: () =>
    set({
      currentStep: 1,
      listingId: null,
      step1: {},
      step2: defaultStep2,
      step3: defaultStep3,
      step4: { verificationCode: null, verificationExpiresAt: null },
      photos: [],
    }),
}))
