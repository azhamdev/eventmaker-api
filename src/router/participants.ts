import { Hono } from "hono";

export const participantsRoute = new Hono().get("/", (c) => {
  return c.json({ participants: [] })
})
  .get("/:id", (c) => {
    const id = c.req.param("id")
    return c.json({ participant: id })
  })
  .post("/", (c) => {
    return c.json({ participant: "Created" })
  })
  .patch("/:id", (c) => {
    const id = c.req.param("id")
    return c.json({ participant: id })
  })
  .delete("/:id", (c) => {
    const id = c.req.param("id")
    return c.json({ participant: id })
  })