import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createTodoSchema, todoStatusSchema } from "@/lib/validation/todo";

export async function listTodosForUser(userId: string) {
  return db.todo.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function createTodo(
  userId: string,
  input: z.infer<typeof createTodoSchema>,
) {
  return db.todo.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority,
      category: input.category,
      subjectId: input.subjectId,
    },
  });
}

export async function updateTodoStatus(
  todoId: string,
  userId: string,
  status: z.infer<typeof todoStatusSchema>,
) {
  const todo = await db.todo.findUnique({
    where: { id: todoId },
    select: { userId: true },
  });
  if (!todo || todo.userId !== userId) {
    throw new AppError("NOT_FOUND", "To-Do nicht gefunden.");
  }
  return db.todo.update({ where: { id: todoId }, data: { status } });
}

export async function deleteTodo(todoId: string, userId: string) {
  const todo = await db.todo.findUnique({
    where: { id: todoId },
    select: { userId: true },
  });
  if (!todo || todo.userId !== userId) {
    throw new AppError("NOT_FOUND", "To-Do nicht gefunden.");
  }
  await db.todo.delete({ where: { id: todoId } });
}
