// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { deleteTimetableEntry } from "@/lib/features/timetable";
import {
  createTestSchool,
  createTestClass,
  deleteTestClass,
  deleteTestSchool,
} from "@/lib/test-helpers";

/**
 * Regression test for a real IDOR found in security review: deleting a
 * timetable entry used to only check `requireClassMember(classId)` on the
 * *caller's own* class, then delete the entry by bare id — never checking
 * the entry actually belonged to that class. Any class member could
 * delete any other class's entries by id alone. Fixed by scoping the
 * lookup to `{ id, classId }` (lib/features/timetable.ts).
 */
describe("deleteTimetableEntry", () => {
  it("refuses to delete an entry that belongs to a different class", async () => {
    const school = await createTestSchool();
    const classA = await createTestClass(school.id);
    const classB = await createTestClass(school.id);

    try {
      const subject = await db.subject.create({
        data: { name: "Test-Fach", schoolId: school.id },
      });
      const entry = await db.timetableEntry.create({
        data: {
          classId: classA.id,
          subjectId: subject.id,
          dayOfWeek: "MONDAY",
          startTime: new Date("1970-01-01T08:00:00.000Z"),
          endTime: new Date("1970-01-01T08:45:00.000Z"),
        },
      });

      // classB is real and the caller could legitimately pass
      // requireClassMember(classB.id) for their own membership — but the
      // entry belongs to classA, so this must still be rejected.
      await expect(deleteTimetableEntry(entry.id, classB.id)).rejects.toThrow();
      expect(
        await db.timetableEntry.findUnique({ where: { id: entry.id } }),
      ).not.toBeNull();

      // The correct classId does delete it.
      await deleteTimetableEntry(entry.id, classA.id);
      expect(await db.timetableEntry.findUnique({ where: { id: entry.id } })).toBeNull();
    } finally {
      await deleteTestClass(classA.id);
      await deleteTestClass(classB.id);
      await deleteTestSchool(school.id);
    }
  });
});
