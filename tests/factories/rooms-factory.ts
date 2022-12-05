import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createRoom(hotelId: number, capacity?: number) {
  return prisma.room.create({
    data: {
      name: faker.random.numeric.toString(),
      capacity: capacity || Number(faker.random.numeric()),
      hotelId,
    },
  });
}
