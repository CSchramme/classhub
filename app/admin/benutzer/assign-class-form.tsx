"use client";

import { useActionState } from "react";
import { assignClassAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClassOption = { id: string; name: string; school: { name: string } };

export function AssignClassForm({
  userId,
  classes,
}: {
  userId: string;
  classes: ClassOption[];
}) {
  const [state, formAction, isPending] = useActionState(assignClassAction, {
    error: null,
  });

  if (classes.length === 0) return null;

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <Select name="classId">
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Klasse…">
            {(value: string | null) => {
              const klass = classes.find((c) => c.id === value);
              return klass ? klass.name : "Klasse…";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {classes.map((klass) => (
            <SelectItem key={klass.id} value={klass.id}>
              {klass.school.name} · {klass.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        Zuweisen
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
