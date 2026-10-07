import { prisma } from '../lib/prisma.js'
import {
  GuideNotFoundError,
  VehicleNotFoundError,
  DuplicateLicenseNumberError,
  DuplicatePlateNumberError,
} from './errors.js'
import type {
  CreateGuideInput,
  UpdateGuideInput,
  CreateVehicleInput,
  UpdateVehicleInput,
} from './schemas.js'

export function listGuides() {
  return prisma.guide.findMany({ orderBy: { name: 'asc' } })
}

export async function createGuide(input: CreateGuideInput) {
  const existing = await prisma.guide.findUnique({ where: { licenseNumber: input.licenseNumber } })
  if (existing) {
    throw new DuplicateLicenseNumberError()
  }
  return prisma.guide.create({ data: input })
}

export async function getGuideById(id: string) {
  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) {
    throw new GuideNotFoundError()
  }
  return guide
}

export async function updateGuide(id: string, input: UpdateGuideInput) {
  const existing = await prisma.guide.findUnique({ where: { id } })
  if (!existing) {
    throw new GuideNotFoundError()
  }

  if (input.licenseNumber && input.licenseNumber !== existing.licenseNumber) {
    const duplicate = await prisma.guide.findUnique({ where: { licenseNumber: input.licenseNumber } })
    if (duplicate) {
      throw new DuplicateLicenseNumberError()
    }
  }

  return prisma.guide.update({ where: { id }, data: input })
}

export function listVehicles() {
  return prisma.vehicle.findMany({ orderBy: { plateNumber: 'asc' } })
}

export async function createVehicle(input: CreateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({ where: { plateNumber: input.plateNumber } })
  if (existing) {
    throw new DuplicatePlateNumberError()
  }
  return prisma.vehicle.create({ data: input })
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } })
  if (!vehicle) {
    throw new VehicleNotFoundError()
  }
  return vehicle
}

export async function updateVehicle(id: string, input: UpdateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({ where: { id } })
  if (!existing) {
    throw new VehicleNotFoundError()
  }

  if (input.plateNumber && input.plateNumber !== existing.plateNumber) {
    const duplicate = await prisma.vehicle.findUnique({ where: { plateNumber: input.plateNumber } })
    if (duplicate) {
      throw new DuplicatePlateNumberError()
    }
  }

  return prisma.vehicle.update({ where: { id }, data: input })
}
