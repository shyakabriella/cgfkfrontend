import { jsPDF } from "jspdf";

type NamedItem = {
  name?: string | null;
  code?: string | null;
  title?: string | null;
};

type TeachingPoint = {
  title?: string;
  explanation?: string;
};

type SourceReference = {
  document?: string;
  page_reference?: string;
  excerpt?: string;
};

type LessonSection = {
  heading?: string;
  introduction?: string;
  paragraphs?: string[];
  key_points?: TeachingPoint[];
  examples?: TeachingPoint[];
  highlights?: string[];
  source_references?: SourceReference[];
  content?: string;
};

type TeachingMaterial = {
  title: string;
  lesson_date: string;
  duration_minutes: number;
  school_class?: NamedItem;
  learning_unit?: NamedItem;
  indicative_content?: NamedItem;
  generated_content: {
    title?: string;
    lesson_summary?: string;
    lesson_sections?: LessonSection[];
  };
};

type Course = {
  name: string;
  code: string;
};

const pageWidth = 210;
const pageHeight = 297;
const leftMargin = 17;
const rightMargin = 17;
const contentWidth =
  pageWidth - leftMargin - rightMargin;
const bottomMargin = 18;

function cleanText(value?: string | null) {
  return (value ?? "")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replace(/\s+/g, " ")
    .trim();
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function loadLogo() {
  try {
    const response = await fetch("/lo.png");

    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise<string | null>(
      (resolve) => {
        const reader = new FileReader();

        reader.onload = () =>
          resolve(
            typeof reader.result === "string"
              ? reader.result
              : null,
          );

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      },
    );
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function downloadTeachingMaterialPdf(
  course: Course,
  material: TeachingMaterial,
) {
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const logo = await loadLogo();
  let y = 18;

  function addPage() {
    document.addPage();
    y = 18;

    document.setDrawColor(210, 210, 210);
    document.line(
      leftMargin,
      13,
      pageWidth - rightMargin,
      13,
    );

    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.setTextColor(90, 90, 90);
    document.text(
      `${cleanText(course.code)} - Teaching Material`,
      leftMargin,
      10,
    );
  }

  function ensureSpace(requiredHeight: number) {
    if (
      y + requiredHeight >
      pageHeight - bottomMargin
    ) {
      addPage();
    }
  }

  function writeParagraph(
    value: string,
    options?: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      indent?: number;
      spacingAfter?: number;
    },
  ) {
    const text = cleanText(value);

    if (!text) return;

    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    const lineHeight = size * 0.42;
    const width = contentWidth - indent;

    document.setFont(
      "helvetica",
      options?.bold ? "bold" : "normal",
    );
    document.setFontSize(size);
    document.setTextColor(
      ...(options?.color ?? [45, 45, 45]),
    );

    const lines = document.splitTextToSize(
      text,
      width,
    ) as string[];

    ensureSpace(lines.length * lineHeight + 3);

    document.text(
      lines,
      leftMargin + indent,
      y,
      {
        lineHeightFactor: 1.35,
      },
    );

    y +=
      lines.length * lineHeight +
      (options?.spacingAfter ?? 3);
  }

  function writeBullet(
    value: string,
    number?: number,
  ) {
    const prefix =
      number !== undefined ? `${number}.` : "-";

    ensureSpace(12);

    document.setFont("helvetica", "bold");
    document.setFontSize(9.5);
    document.setTextColor(65, 65, 65);
    document.text(prefix, leftMargin + 3, y);

    const text = cleanText(value);
    const lines = document.splitTextToSize(
      text,
      contentWidth - 12,
    ) as string[];

    document.setFont("helvetica", "normal");
    document.text(
      lines,
      leftMargin + 11,
      y,
      {
        lineHeightFactor: 1.35,
      },
    );

    y += lines.length * 4.2 + 2.5;
  }

  function sectionTitle(value: string) {
    ensureSpace(15);

    document.setFillColor(241, 243, 245);
    document.roundedRect(
      leftMargin,
      y - 5,
      contentWidth,
      11,
      2,
      2,
      "F",
    );

    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.setTextColor(30, 30, 30);

    const title = document.splitTextToSize(
      cleanText(value),
      contentWidth - 8,
    ) as string[];

    document.text(title, leftMargin + 4, y + 1);

    y += Math.max(14, title.length * 5 + 7);
  }

  // Document header
  if (logo) {
    try {
      document.addImage(
        logo,
        "PNG",
        leftMargin,
        12,
        20,
        20,
      );
    } catch {
      // Continue without the logo if the image is invalid.
    }
  }

  document.setFont("helvetica", "bold");
  document.setFontSize(15);
  document.setTextColor(25, 25, 25);
  document.text(
    "CGFK SCHOOL",
    logo ? 42 : leftMargin,
    18,
  );

  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(90, 90, 90);
  document.text(
    "Professional Teaching Material",
    logo ? 42 : leftMargin,
    24,
  );

  document.setDrawColor(140, 140, 140);
  document.line(
    leftMargin,
    36,
    pageWidth - rightMargin,
    36,
  );

  y = 47;

  document.setFont("helvetica", "bold");
  document.setFontSize(19);
  document.setTextColor(20, 20, 20);

  const title = cleanText(
    material.generated_content.title ||
      material.title,
  );

  const titleLines = document.splitTextToSize(
    title,
    contentWidth,
  ) as string[];

  document.text(titleLines, leftMargin, y, {
    lineHeightFactor: 1.2,
  });

  y += titleLines.length * 7.5 + 6;

  // Lesson information
  const information = [
    [
      "Course",
      `${cleanText(course.name)} (${cleanText(
        course.code,
      )})`,
    ],
    [
      "Assigned class",
      cleanText(
        material.school_class?.name ?? "Not specified",
      ),
    ],
    [
      "Learning unit",
      cleanText(
        material.learning_unit?.title ??
          "Not specified",
      ),
    ],
    [
      "Indicative content",
      cleanText(
        material.indicative_content?.title ??
          "Not specified",
      ),
    ],
    ["Lesson date", formatDate(material.lesson_date)],
    [
      "Duration",
      `${material.duration_minutes} minutes`,
    ],
  ];

  for (const [label, value] of information) {
    ensureSpace(9);

    document.setFillColor(247, 247, 247);
    document.rect(
      leftMargin,
      y - 4.5,
      contentWidth,
      8,
      "F",
    );

    document.setFont("helvetica", "bold");
    document.setFontSize(9);
    document.setTextColor(55, 55, 55);
    document.text(label, leftMargin + 3, y);

    document.setFont("helvetica", "normal");
    document.text(
      document.splitTextToSize(
        value,
        contentWidth - 50,
      ),
      leftMargin + 48,
      y,
    );

    y += 9;
  }

  y += 5;

  if (material.generated_content.lesson_summary) {
    sectionTitle("Lesson Summary");

    writeParagraph(
      material.generated_content.lesson_summary,
      {
        size: 10,
        spacingAfter: 5,
      },
    );
  }

  const sections =
    material.generated_content.lesson_sections ?? [];

  sections.forEach((section, sectionIndex) => {
    sectionTitle(
      `${sectionIndex + 1}. ${
        section.heading || "Lesson Content"
      }`,
    );

    if (section.introduction) {
      writeParagraph(section.introduction, {
        size: 10,
        spacingAfter: 4,
      });
    }

    section.paragraphs?.forEach((paragraph) => {
      writeParagraph(paragraph, {
        size: 10,
        spacingAfter: 4,
      });
    });

    if (section.content) {
      writeParagraph(section.content, {
        size: 10,
        spacingAfter: 4,
      });
    }

    if (section.key_points?.length) {
      writeParagraph("Key teaching points", {
        size: 10,
        bold: true,
        color: [35, 35, 35],
        spacingAfter: 3,
      });

      section.key_points.forEach(
        (point, pointIndex) => {
          const value = point.title
            ? `${point.title}: ${point.explanation ?? ""}`
            : point.explanation ?? "";

          writeBullet(value, pointIndex + 1);
        },
      );
    }

    if (section.examples?.length) {
      writeParagraph("Examples", {
        size: 10,
        bold: true,
        spacingAfter: 3,
      });

      section.examples.forEach((example) => {
        const value = example.title
          ? `${example.title}: ${
              example.explanation ?? ""
            }`
          : example.explanation ?? "";

        writeBullet(value);
      });
    }

    if (section.highlights?.length) {
      ensureSpace(12);

      document.setFillColor(245, 245, 245);
      document.setDrawColor(185, 185, 185);

      const highlightLines =
        section.highlights.flatMap((highlight) =>
          document.splitTextToSize(
            `- ${cleanText(highlight)}`,
            contentWidth - 10,
          ),
        ) as string[];

      const boxHeight =
        highlightLines.length * 4.2 + 10;

      ensureSpace(boxHeight);

      document.roundedRect(
        leftMargin,
        y - 4,
        contentWidth,
        boxHeight,
        2,
        2,
        "FD",
      );

      document.setFont("helvetica", "bold");
      document.setFontSize(9);
      document.setTextColor(45, 45, 45);
      document.text(
        "Important points",
        leftMargin + 5,
        y + 1,
      );

      document.setFont("helvetica", "normal");
      document.text(
        highlightLines,
        leftMargin + 5,
        y + 7,
        {
          lineHeightFactor: 1.35,
        },
      );

      y += boxHeight + 4;
    }

    if (section.source_references?.length) {
      writeParagraph("Source references", {
        size: 9,
        bold: true,
        color: [90, 90, 90],
        spacingAfter: 2,
      });

      section.source_references.forEach(
        (reference) => {
          const source = [
            reference.document,
            reference.page_reference,
          ]
            .filter(Boolean)
            .join(" - ");

          writeParagraph(
            `${source}${
              reference.excerpt
                ? `: "${reference.excerpt}"`
                : ""
            }`,
            {
              size: 8,
              color: [100, 100, 100],
              indent: 3,
              spacingAfter: 2,
            },
          );
        },
      );
    }

    y += 4;
  });

  // Add footer to every page.
  const totalPages =
    document.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber++
  ) {
    document.setPage(pageNumber);

    document.setDrawColor(210, 210, 210);
    document.line(
      leftMargin,
      pageHeight - 14,
      pageWidth - rightMargin,
      pageHeight - 14,
    );

    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.setTextColor(110, 110, 110);

    document.text(
      "CGFK School Management System",
      leftMargin,
      pageHeight - 9,
    );

    document.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - rightMargin,
      pageHeight - 9,
      {
        align: "right",
      },
    );
  }

  const fileName =
    safeFileName(
      `${course.code}-${material.title}`,
    ) || "teaching-material";

  document.save(`${fileName}.pdf`);
}
