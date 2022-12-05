import { prisma } from "@/config";

async function findFirst(id: number) {
  return prisma.booking.findFirst({
    where: {
      userId: id,
    },
    select: {
      id: true,
      Room: {
        select: {
          id: true,
          name: true,
          capacity: true,
          hotelId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}
async function findMany(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId,
    },
  });
}
async function create(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

const bookingRepository = {
  findFirst,
  create,
  findMany,
};

export default bookingRepository;
