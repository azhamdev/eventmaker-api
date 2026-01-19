import z from 'zod'

export const createEventValidation = z.object({
  name: z.string().min(1),
  description: z.string().max(255),
  dateTime: z.coerce.date(),
  location: z.string().min(1)
})


export const updateEventValidation = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(255).optional(),
  dateTime: z.coerce.date().optional(),
  location: z.string().min(1).optional()
})