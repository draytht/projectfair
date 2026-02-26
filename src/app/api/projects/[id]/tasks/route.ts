import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, dueDate, assigneeId } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId: id,
      creatorId: user.id,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      projectId: id,
      taskId: task.id,
      action: "TASK_CREATED",
      metadata: { taskTitle: title },
    },
  });

  return NextResponse.json(task);
}