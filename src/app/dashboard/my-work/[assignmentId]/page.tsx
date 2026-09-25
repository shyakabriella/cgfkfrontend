"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

type QuizData = {
  submitted: boolean;
  assignment_id: number;
  assessment: {
    title: string;
    type: string;
    instructions?: string | null;
    question_count?: number;
    total_marks: number;
    course?: {
      name: string;
      code: string;
    };
  };
  progress?: {
    current: number;
    total: number;
  };
  question?: {
    id: number;
    type:
      | "multiple_choice"
      | "true_false"
      | "short_answer"
      | "essay";
    question: string;
    options: string[];
    marks: number;
  };
  question_seconds?: number;
  expires_at?: string;
  score?: number;
  manual_marking_pending?: boolean;
  submitted_at?: string;
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

export default function StudentQuizPage() {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);

  const submitAnswer = useCallback(
    async (answerValue: string) => {
      if (
        submittingRef.current ||
        !quiz?.question ||
        quiz.submitted
      ) {
        return;
      }

      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/student/assessment-assignments/${params.assignmentId}/answer`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              question_id: quiz.question.id,
              answer: answerValue || null,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ?? "Answer could not be saved.",
          );
        }

        setQuiz(result.data);
        setAnswer("");
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Answer could not be saved.",
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [params.assignmentId, quiz],
  );

  useEffect(() => {
    async function startQuiz() {
      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/student/assessment-assignments/${params.assignmentId}/start`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ?? "Quiz could not be opened.",
          );
        }

        setQuiz(result.data);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Quiz could not be opened.",
        );
      } finally {
        setLoading(false);
      }
    }

    void startQuiz();
  }, [params.assignmentId]);

  useEffect(() => {
    if (!quiz?.expires_at || quiz.submitted) return;

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(quiz!.expires_at!).getTime() -
            Date.now()) /
            1000,
        ),
      );

      setSeconds(remaining);

      if (remaining === 0 && !submittingRef.current) {
        void submitAnswer("");
      }
    }

    updateTimer();

    const timer = window.setInterval(updateTimer, 500);

    return () => window.clearInterval(timer);
  }, [quiz?.expires_at, quiz?.submitted, submitAnswer]);

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center gap-2">
        <LoaderCircle size={20} className="animate-spin" />
        Opening assessment...
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (quiz?.submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 text-center shadow-sm">
        <CheckCircle2
          size={46}
          className="mx-auto text-emerald-600"
        />

        <h1 className="mt-4 text-xl font-bold">
          Assessment submitted
        </h1>

        <p className="mt-2 text-slate-500">
          Your answers were submitted successfully.
        </p>

        <p className="mt-5 text-2xl font-bold">
          {quiz.score ?? 0} / {quiz.assessment.total_marks}
        </p>

        {quiz.manual_marking_pending && (
          <p className="mt-2 text-sm text-amber-700">
            Short-answer or essay questions are waiting for
            teacher marking.
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push("/dashboard/my-work")}
          className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Return to My Work
        </button>
      </div>
    );
  }

  if (!quiz?.question) return null;

  const question = quiz.question;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <Image
            src="/lo.png"
            alt="CGFK School"
            width={52}
            height={52}
            className="h-12 w-12 rounded-lg object-contain"
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              CGFK School
            </p>
            <h1 className="truncate font-bold text-slate-900">
              {quiz.assessment.title}
            </h1>
            <p className="text-sm text-slate-500">
              {quiz.assessment.course?.name}
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-bold ${
              seconds <= 10
                ? "bg-red-50 text-red-700"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            <Clock3 size={18} />
            {seconds}s
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{
              width: `${
                ((quiz.progress?.current ?? 1) /
                  (quiz.progress?.total ?? 1)) *
                100
              }%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Question {quiz.progress?.current} of{" "}
          {quiz.progress?.total}
        </p>
      </header>

      <main className="mt-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        {error && (
          <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold leading-7">
            {question.question}
          </h2>

          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">
            {question.marks} marks
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {question.type === "multiple_choice" &&
            question.options.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                  answer === option
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={answer === option}
                  onChange={() => setAnswer(option)}
                />
                <span>{option}</span>
              </label>
            ))}

          {question.type === "true_false" &&
            ["True", "False"].map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                  answer === option
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={answer === option}
                  onChange={() => setAnswer(option)}
                />
                {option}
              </label>
            ))}

          {question.type === "short_answer" && (
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write your answer..."
              className="h-12 w-full rounded-lg border border-slate-300 px-3"
            />
          )}

          {question.type === "essay" && (
            <textarea
              rows={7}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write your answer..."
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => void submitAnswer(answer)}
          disabled={submitting}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {submitting && (
            <LoaderCircle size={17} className="animate-spin" />
          )}

          {submitting ? "Saving..." : "Save and Continue"}
        </button>
      </main>
    </div>
  );
}
