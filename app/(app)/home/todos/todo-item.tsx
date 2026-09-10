"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { setTodoStatusAction, deleteTodoAction } from "./actions";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
};

export function TodoItem({
  todo,
}: {
  todo: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: string;
    category: string | null;
    status: string;
    subject: { name: string } | null;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const completed = todo.status === "COMPLETED";

  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <Checkbox
        checked={completed}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(() => {
            setTodoStatusAction(todo.id, checked ? "COMPLETED" : "OPEN");
          });
        }}
        className="mt-1"
      />
      <div className="flex-1">
        <p className={completed ? "text-muted-foreground line-through" : "font-medium"}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-sm text-muted-foreground">{todo.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {todo.dueDate && (
            <Badge variant="outline">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                todo.dueDate,
              )}
            </Badge>
          )}
          <Badge variant="outline">{PRIORITY_LABELS[todo.priority]}</Badge>
          {todo.category && <Badge variant="outline">{todo.category}</Badge>}
          {todo.subject && <Badge variant="outline">{todo.subject.name}</Badge>}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="To-Do löschen"
        disabled={isPending}
        onClick={() => startTransition(() => deleteTodoAction(todo.id))}
      >
        <X className="size-4" />
      </Button>
    </li>
  );
}
