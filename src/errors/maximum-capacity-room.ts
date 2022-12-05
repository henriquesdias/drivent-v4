import { ApplicationError } from "@/protocols";

export function maximumCapacityRoom(): ApplicationError {
  return {
    name: "maximumCapacityRoom",
    message: "the maximum capacity of the room has been reached!",
  };
}
