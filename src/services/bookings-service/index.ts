import bookingRepository from "@/repositories/booking-repository";
import roomRepository from "@/repositories/room-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { notFoundError, unauthorizedError, maximumCapacityRoom } from "@/errors";
import { cannotListHotelsError } from "@/errors/cannot-list-hotels-error";

async function getBookingById(id: number) {
  const booking = await bookingRepository.findFirst(id);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

async function postNewBooking(userId: number, roomId: number) {
  const room = await roomRepository.findFirst(roomId);
  if (!room) {
    throw notFoundError();
  }

  const booking = await bookingRepository.findFirst(userId);
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (booking || !enrollment) throw unauthorizedError();

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotListHotelsError();
  }
  const allBookings = await bookingRepository.findMany(roomId);
  if (allBookings.length === room.capacity) {
    throw maximumCapacityRoom();
  }

  return bookingRepository.create(userId, roomId);
}

const bookingsService = {
  getBookingById,
  postNewBooking,
};

export default bookingsService;
