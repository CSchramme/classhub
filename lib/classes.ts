import "server-only";
import { db } from "@/lib/db";

export async function getClassBySlug(slug: string) {
  return db.class.findUnique({
    where: { slug },
    include: {
      school: { select: { id: true, name: true } },
      schoolYear: { select: { id: true, name: true } },
    },
  });
}

export async function getUserClassMemberships(userId: string) {
  return db.classMembership.findMany({
    where: { userId, leftAt: null },
    select: { class: { select: { id: true, name: true, slug: true } } },
    orderBy: { class: { name: "asc" } },
  });
}

export async function getClassMembers(classId: string) {
  return db.classMembership.findMany({
    where: { classId, leftAt: null },
    select: {
      joinedAt: true,
      user: { select: { id: true, displayName: true, email: true, role: true } },
    },
    orderBy: { user: { displayName: "asc" } },
  });
}

export async function getClassAnnouncements(classId: string) {
  return db.classAnnouncement.findMany({
    where: { classId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { author: { select: { displayName: true } } },
  });
}

export async function createAnnouncement(input: {
  classId: string;
  title: string;
  content: string;
  expiresAt?: Date;
  authorId: string;
}) {
  return db.classAnnouncement.create({
    data: {
      classId: input.classId,
      title: input.title,
      content: input.content,
      expiresAt: input.expiresAt,
      authorId: input.authorId,
    },
  });
}
