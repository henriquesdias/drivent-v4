import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import {
  createUser,
  createHotel,
  createRoom,
  createBooking,
  createTicketTypeWithHotel,
  createTicket,
  createEnrollmentWithAddress,
  createTicketTypeRemote,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/config";

beforeAll(async () => {
  await init();
  await cleanDb();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 200 and booking data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          hotelId: room.hotelId,
          capacity: room.capacity,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });

    it("should respond with status 404 if user do not have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      await createRoom(hotel.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 200 and bookingId and create new booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      const bookingCreated = await prisma.booking.findFirst({
        select: {
          id: true,
          userId: true,
          roomId: true,
        },
      });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: bookingCreated.id });
      expect(bookingCreated).toEqual({
        id: bookingCreated.id,
        userId: user.id,
        roomId: room.id,
      });
    });

    it("should respond with status 404 when roomId do not exist - invalid value", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when roomId do not exist - valid value", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id + 1 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when room has no vacancies", async () => {
      const user = await createUser();
      const secondUser = await createUser();
      const thirdUser = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id, 2);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");
      await createBooking(secondUser.id, room.id);
      await createBooking(thirdUser.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 401 if user already have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");
      await createBooking(user.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if user do not have a valid ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketTypeCreated.id, "RESERVED");

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if user have a remote ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const enrollment = await createEnrollmentWithAddress(user);
      const room = await createRoom(hotel.id);
      const ticketTypeCreated = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketTypeCreated.id, "PAID");

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
});
