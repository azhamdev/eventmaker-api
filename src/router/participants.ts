import { Hono } from "hono";
import { prisma } from "../utils/prisma.js";
import { zValidator } from "@hono/zod-validator";
import {
  participantBodySchema,
  updateParticipantValidation,
  getParticipantsQueryValidation,
  participantParamValidation,
} from "../validation/participant-validation.js";

// Kenapa: Method chaining membuat kode lebih bersih dan lebih mudah dibaca
// Semua route didefinisikan dalam satu instance Hono, mengikuti pola yang sama dengan events.ts
export const participantsRoute = new Hono()
  // GET /participants?eventId=xxx - Tampilkan peserta untuk event tertentu
  // Kenapa: Parameter query sangat cocok untuk menyaring data
  // Ini menjaga URL kita tetap bersih dan RESTful
  .get(
    "/",
    zValidator("query", getParticipantsQueryValidation),
    async (c) => {
      try {
        const { eventId } = c.req.valid("query");

        // Kenapa: Selalu filter berdasarkan eventId untuk mencegah menampilkan semua peserta
        // Ini memastikan privasi data dan penanganan relasi yang tepat
        const participants = await prisma.participant.findMany({
          where: {
            eventId,
          },
        });

        return c.json({ data: participants });
      } catch (error) {
        console.error("Failed to list participants", error);
        // Kenapa: Status code inline (c.json(data, status)) lebih bersih daripada pemanggilan c.status() terpisah
        // Pola ini lebih ringkas, atomik, dan mengajarkan kebiasaan yang lebih baik
        // Status codes: 200=OK, 201=Created, 400=Bad Request, 404=Not Found, 500=Server Error
        return c.json({ message: "Failed to retrieve participants" }, 500);
      }
    },
  )
  // POST /participants - Buat peserta baru
  // Kenapa: Kita memvalidasi event ada sebelum membuat peserta
  // Ini mencegah peserta yatim (peserta tanpa event)
  .post("/", zValidator("json", participantBodySchema), async (c) => {
    try {
      const body = c.req.valid("json");

      const event = await prisma.event.findUnique({
        where: {
          id: body.eventId,
        },
      });

      if (!event) {
        // Kenapa: Validasi event ada sebelum membuat peserta
        // Mencegah error database relasi dan data yatim
        return c.json({ message: "Event not found" }, 404);
      }

      const newParticipant = await prisma.participant.create({
        data: {
          name: body.name,
          email: body.email,
          eventId: body.eventId,
        },
      });

      return c.json({
        data: newParticipant,
        message: "Participant created successfully",
      });
    } catch (error) {
      console.error("Failed to create participant", error);
      return c.json({ message: "Failed to create participant" }, 500);
    }
  })
  // PATCH /participants/:id - Update peserta
  // Kenapa: Skema validasi terpisah untuk create vs update
  // Update mengizinkan perubahan parsial (field opsional), create membutuhkan semuanya
  .patch(
    "/:id",
    zValidator("param", participantParamValidation),
    zValidator("json", updateParticipantValidation),
    async (c) => {
      const { id } = c.req.valid("param");

      try {
        const body = c.req.valid("json");

        const existingParticipant = await prisma.participant.findUnique({
          where: {
            id,
          },
        });

        if (!existingParticipant) {
          // Kenapa: Cek keberadaan sebelum update
          // Memberikan respons 404 yang jelas jika peserta tidak ditemukan
          return c.json({ message: "Participant not found" }, 404);
        }

        const event = await prisma.event.findUnique({
          where: {
            id: body.eventId,
          },
        });

        if (!event) {
          // Kenapa: Validasi event baru sebelum update peserta
          // Mencegah error database jika eventId tidak valid
          return c.json({ message: "Event not found" }, 404);
        }

        const updatedParticipant = await prisma.participant.update({
          where: {
            id,
          },
          data: {
            name: body.name,
            email: body.email,
            eventId: body.eventId,
          },
        });

        return c.json({
          data: updatedParticipant,
          message: "Participant updated successfully",
        });
      } catch (error) {
        console.error(`Failed to update participant with id=${id}`, error);
        return c.json({ message: "Failed to update participant" }, 500);
      }
    },
  )
  // DELETE /participants/:id - Hapus peserta
  // Kenapa: Periksa keberadaan sebelum penghapusan untuk memberikan respons 404 yang tepat
  // Ini memberikan umpan balik yang jelas kepada pengguna tentang apa yang terjadi
  .delete(
    "/:id",
    zValidator("param", participantParamValidation),
    async (c) => {
      const { id } = c.req.valid("param");

      try {
        const existingParticipant = await prisma.participant.findUnique({
          where: {
            id,
          },
        });

        if (!existingParticipant) {
          return c.json({ message: "Participant not found" }, 404);
        }

        await prisma.participant.delete({
          where: {
            id,
          },
        });

        return c.json({ message: "Participant deleted successfully" });
      } catch (error) {
        console.error(`Failed to delete participant with id=${id}`, error);
        return c.json({ message: "Failed to delete participant" }, 500);
      }
    },
  );