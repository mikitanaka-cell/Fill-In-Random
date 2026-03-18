import { Router, type IRouter } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateQuestionBody,
  UpdateQuestionBody,
  SubmitAttemptBody,
  ListQuestionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function extractAnswers(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2).trim());
}

function questionToResponse(q: typeof questionsTable.$inferSelect) {
  const answers = extractAnswers(q.text);
  return {
    id: q.id,
    title: q.title,
    text: q.text,
    answers,
    totalAttempts: q.totalAttempts,
    correctAttempts: q.correctAttempts,
    hasWrongAttempt: q.hasWrongAttempt,
    createdAt: q.createdAt.toISOString(),
  };
}

router.get("/questions", async (req, res) => {
  const parsed = ListQuestionsQueryParams.safeParse(req.query);
  const wrongOnly = parsed.success ? parsed.data.wrongOnly : false;

  let questions = await db.select().from(questionsTable).orderBy(questionsTable.createdAt);
  if (wrongOnly) {
    questions = questions.filter((q) => {
      if (q.totalAttempts === 0) return false;
      return q.correctAttempts / q.totalAttempts < 0.8;
    });
  }

  res.json(questions.map(questionToResponse));
});

router.post("/questions", async (req, res) => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const answers = extractAnswers(parsed.data.text);
  if (answers.length === 0) {
    res.status(400).json({ error: "Question must contain at least one {{answer}} placeholder" });
    return;
  }

  const [question] = await db
    .insert(questionsTable)
    .values({ title: parsed.data.title, text: parsed.data.text })
    .returning();

  res.status(201).json(questionToResponse(question));
});

router.get("/questions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json(questionToResponse(question));
});

router.put("/questions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const parsed = UpdateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const answers = extractAnswers(parsed.data.text);
  if (answers.length === 0) {
    res.status(400).json({ error: "Question must contain at least one {{answer}} placeholder" });
    return;
  }

  const [question] = await db
    .update(questionsTable)
    .set({ title: parsed.data.title, text: parsed.data.text })
    .where(eq(questionsTable.id, id))
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json(questionToResponse(question));
});

router.delete("/questions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [deleted] = await db
    .delete(questionsTable)
    .where(eq(questionsTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.status(204).send();
});

router.post("/questions/:id/attempts", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const parsed = SubmitAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const correctAnswers = extractAnswers(question.text);
  const userAnswers = parsed.data.answers;

  const perAnswerCorrect = correctAnswers.map((correct, i) => {
    const user = userAnswers[i] ?? "";
    return user.trim() === correct.trim();
  });

  const correct = perAnswerCorrect.every(Boolean);

  await db
    .update(questionsTable)
    .set({
      totalAttempts: sql`${questionsTable.totalAttempts} + 1`,
      correctAttempts: correct
        ? sql`${questionsTable.correctAttempts} + 1`
        : questionsTable.correctAttempts,
      hasWrongAttempt: correct ? questionsTable.hasWrongAttempt : true,
    })
    .where(eq(questionsTable.id, id));

  res.json({
    correct,
    correctAnswers,
    userAnswers,
    perAnswerCorrect,
  });
});

router.post("/questions/:id/reset", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [question] = await db
    .update(questionsTable)
    .set({ totalAttempts: 0, correctAttempts: 0, hasWrongAttempt: false })
    .where(eq(questionsTable.id, id))
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json(questionToResponse(question));
});

router.get("/stats", async (_req, res) => {
  const questions = await db.select().from(questionsTable);
  const totalQuestions = questions.length;
  const questionsWithWrongAttempts = questions.filter((q) => q.hasWrongAttempt).length;
  const totalAttempts = questions.reduce((sum, q) => sum + q.totalAttempts, 0);
  const correctAttempts = questions.reduce((sum, q) => sum + q.correctAttempts, 0);

  res.json({ totalQuestions, questionsWithWrongAttempts, totalAttempts, correctAttempts });
});

export default router;
