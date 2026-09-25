import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type MarksheetStudent = {
  student_id: string;
  student_name: string;
  status: string;
  score: number | null;
  total_marks: number;
  percentage: number | null;
};

type Marksheet = {
  assessment: {
    title: string;
    type: string;
    total_marks: number;
    course: {
      name: string;
      code: string;
    };
    teacher?: {
      name: string;
    } | null;
    school_class?: {
      name: string;
      code: string;
    } | null;
  };
  students: MarksheetStudent[];
  summary: {
    students: number;
    submitted: number;
    pending: number;
    average: number;
  };
};

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/lo.png");

    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () =>
        resolve(
          typeof reader.result === "string"
            ? reader.result
            : null,
        );

      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function safeFilename(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function exportMarksheetPdf(
  marksheet: Marksheet,
) {
  const document = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const logo = await loadLogo();

  if (logo) {
    document.addImage(
      logo,
      "PNG",
      14,
      10,
      22,
      22,
    );
  }

  document.setTextColor(15, 23, 42);
  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(
    "CGFK SCHOOL",
    logo ? 42 : 14,
    16,
  );

  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(71, 85, 105);
  document.text(
    "Student Assessment Marksheet",
    logo ? 42 : 14,
    22,
  );

  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.setTextColor(15, 23, 42);
  document.text(
    marksheet.assessment.title,
    14,
    40,
  );

  document.setFont("helvetica", "normal");
  document.setFontSize(9);

  const className =
    marksheet.assessment.school_class?.name ??
    "Not specified";

  const classCode =
    marksheet.assessment.school_class?.code;

  const teacherName =
    marksheet.assessment.teacher?.name ??
    "Not specified";

  document.text(
    `Course: ${marksheet.assessment.course.name} (${marksheet.assessment.course.code})`,
    14,
    47,
  );

  document.text(
    `Class: ${className}${classCode ? ` (${classCode})` : ""}`,
    14,
    53,
  );

  document.text(
    `Assessment type: ${marksheet.assessment.type.toUpperCase()}`,
    150,
    47,
  );

  document.text(
    `Teacher: ${teacherName}`,
    150,
    53,
  );

  document.text(
    `Total marks: ${marksheet.assessment.total_marks}`,
    230,
    47,
  );

  document.text(
    `Generated: ${new Intl.DateTimeFormat("en-RW", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date())}`,
    230,
    53,
  );

  document.setFillColor(248, 250, 252);
  document.roundedRect(
    14,
    59,
    269,
    14,
    2,
    2,
    "F",
  );

  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.text(
    `Students: ${marksheet.summary.students}`,
    20,
    68,
  );

  document.text(
    `Submitted: ${marksheet.summary.submitted}`,
    75,
    68,
  );

  document.text(
    `Pending: ${marksheet.summary.pending}`,
    135,
    68,
  );

  document.text(
    `Class average: ${marksheet.summary.average}%`,
    190,
    68,
  );

  const rows = marksheet.students.map(
    (student, index) => [
      String(index + 1),
      student.student_id,
      student.student_name,
      student.status.replaceAll("_", " "),
      student.score === null
        ? "—"
        : `${student.score} / ${student.total_marks}`,
      student.percentage === null
        ? "—"
        : `${student.percentage}%`,
    ],
  );

  autoTable(document, {
    startY: 79,
    head: [
      [
        "No.",
        "Student ID",
        "Student",
        "Status",
        "Marks",
        "Percentage",
      ],
    ],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 42, 67],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: {
        halign: "center",
        cellWidth: 13,
      },
      1: {
        cellWidth: 43,
      },
      2: {
        cellWidth: 75,
      },
      3: {
        cellWidth: 38,
      },
      4: {
        halign: "center",
        cellWidth: 42,
      },
      5: {
        halign: "center",
        cellWidth: 42,
      },
    },
    margin: {
      left: 14,
      right: 14,
      bottom: 18,
    },
    didDrawPage: () => {
      const pageNumber =
        document.getCurrentPageInfo().pageNumber;

      document.setFontSize(8);
      document.setTextColor(100, 116, 139);

      document.text(
        "CGFK School Management System",
        14,
        201,
      );

      document.text(
        `Page ${pageNumber}`,
        283,
        201,
        {
          align: "right",
        },
      );
    },
  });

  const fileName = [
    safeFilename(marksheet.assessment.course.code),
    safeFilename(marksheet.assessment.type),
    "marksheet",
  ]
    .filter(Boolean)
    .join("-");

  document.save(`${fileName}.pdf`);
}
