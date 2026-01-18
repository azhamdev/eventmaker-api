import { Hono } from "hono";
import { prisma } from '../utils/prisma.js'

export const eventsRoute = new Hono().get("/", async (c) => {
  const events = await prisma.event.findMany({
    include: {
      participants: true
    }
  })
  return c.json({ events })
})
  .get("/:id", async (c) => {
    const id = c.req.param("id")
    const event = await prisma.event.findFirst({
      where: {
        id: id
      },
      include: {
        participants: true
      }
    })
    return c.json({ event })
  })
  .post("/", async (c) => {
    const body = await c.req.json()
    const newEvent = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
        dateTime: new Date(body.dateTime)
      }
    })
    return c.json({ event: newEvent })
  })
  .patch("/:id", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json()
    const updatedEvent = await prisma.event.update({
      where: {
        id: id
      },
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
        dateTime: new Date()
      }
    })

    return c.json({ event: updatedEvent })
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id")
    await prisma.event.delete({
      where: {
        id: id
      }
    })


    return c.json({ message: "Event deleted sucsessfully" })
  })