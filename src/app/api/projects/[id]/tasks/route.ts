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

  const { title, description, dueDate, assigneeId, outputType } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const VALID_OUTPUT_TYPES = ["PDF", "PPTX", "TXT", "DOCX", "CODE"];
  if (outputType && !VALID_OUTPUT_TYPES.includes(outputType)) {
    return NextResponse.json({ error: "Invalid output type" }, { status: 400 });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: id,
        creatorId: user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        outputType: outputType || null,
      },
      include: { assignee: true },
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
  } catch (err) {
    console.error("[POST /api/projects/tasks]", err);
    const message = err instanceof Error ? err.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}