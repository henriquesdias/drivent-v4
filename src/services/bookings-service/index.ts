import bookingRepository from "@/repositories/booking-repository";
import { notFoundError } from "@/errors";

async function getBookingById(id: number) {
  const booking = await bookingRepository.findFirst(id);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

const bookingsService = {
  getBookingById,
};

export default bookingsService;
