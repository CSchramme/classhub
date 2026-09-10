"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { createTodo, updateTodoStatus, deleteTodo } from "@/lib/features/todos";
import { createTodoSchema, todoStatusSchema } from "@/lib/validation/todo";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createTodoAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const parsed = createTodoSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    category: formData.get("category") || undefined,
    subjectId: formData.get("subjectId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createTodo(user.id, parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/todos");
  return { error: null };
}

export async function setTodoStatusAction(todoId: string, status: string) {
  const user = await requireUser();
  const parsedStatus = todoStatusSchema.parse(status);
  await updateTodoStatus(todoId, user.id, parsedStatus);
  revalidatePath("/home/todos");
}

export async function deleteTodoAction(todoId: string) {
  const user = await requireUser();
  await deleteTodo(todoId, user.id);
  revalidatePath("/home/todos");
}
