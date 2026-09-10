import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listTodosForUser } from "@/lib/features/todos";
import { listSubjectsForSchool } from "@/lib/features/subjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTodoForm } from "./create-todo-form";
import { TodoItem } from "./todo-item";

export default async function TodosPage() {
  const user = await requireUserOrRedirect();
  const [todos, subjects] = await Promise.all([
    listTodosForUser(user.id),
    user.schoolId ? listSubjectsForSchool(user.schoolId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">To-Dos</h1>
        <p className="text-muted-foreground">Deine persönlichen Aufgaben.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neues To-Do</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTodoForm subjects={subjects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle To-Dos</CardTitle>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Du hast aktuell keine offenen Aufgaben. 🎉
            </p>
          ) : (
            <ul>
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
