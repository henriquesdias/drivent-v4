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

const bookingRepository = {
  findFirst,
};

export default bookingRepository;
