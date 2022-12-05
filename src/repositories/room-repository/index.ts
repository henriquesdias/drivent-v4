import { prisma } from "@/config";

async function findFirst(id: number) {
  return prisma.room.findFirst({
    where: {
      id,
    },
  });
}

const roomRepository = {
  findFirst,
};

export default roomRepository;
