import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, title, description, assigneeId, dueDate, outputType, outputFileUrl, outputFileName } = body;

  // Fetch existing task to check assignee
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const isAssignee = existing.assigneeId === user.id;

  // Status changes: only the assigned member can action the task
  if (status !== undefined && existing.assigneeId && !isAssignee) {
    return NextResponse.json({ error: "Only the assigned member can update this task's status." }, { status: 403 });
  }

  // Output file submission: only the assignee
  if (outputFileUrl !== undefined && !isAssignee) {
    return NextResponse.json({ error: "Only the assigned member can submit output files." }, { status: 403 });
  }

  // Detail edits (including outputType): assignee OR team leader / professor
  const hasDetailEdit = title !== undefined || description !== undefined || assigneeId !== undefined || dueDate !== undefined || outputType !== undefined;
  if (hasDetailEdit && !isAssignee) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });
    const isPrivileged = member?.role === "TEAM_LEADER" || member?.role === "PROFESSOR";
    if (!isPrivileged) {
      return NextResponse.json({ error: "Only the assigned member or team leaders can edit this task." }, { status: 403 });
    }
  }

  // Block DONE if output is required but not yet submitted
  const finalStatus = status !== undefined ? status : existing.status;
  const finalOutputType = outputType !== undefined ? outputType : existing.outputType;
  const finalOutputFileUrl = outputFileUrl !== undefined ? outputFileUrl : existing.outputFileUrl;
  if (finalStatus === "DONE" && finalOutputType && !finalOutputFileUrl) {
    return NextResponse.json({ error: `This task requires a ${finalOutputType} file to be uploaded before marking it as done.` }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (status !== undefined) {
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.status = status;
    updateData.completedAt = status === "DONE" ? new Date() : null;
  }

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (outputType !== undefined) updateData.outputType = outputType || null;
  if (outputFileUrl !== undefined) {
    updateData.outputFileUrl = outputFileUrl || null;
    updateData.outputFileName = outputFileName || null;
    updateData.outputUploadedAt = outputFileUrl ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: { assignee: true },
  });

  if (status !== undefined) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        projectId: id,
        taskId: taskId,
        action: "TASK_STATUS_UPDATED",
        metadata: { newStatus: status, taskTitle: task.title },
      },
    });
  }

  return NextResponse.json(task);
}