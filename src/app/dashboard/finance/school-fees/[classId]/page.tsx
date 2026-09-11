import ClassFeeManagement from "@/components/finance/class-fee-management";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function ClassSchoolFeesPage({
  params,
}: Props) {
  const { classId } = await params;
  const parsedClassId = Number(classId);

  if (
    !Number.isInteger(parsedClassId) ||
    parsedClassId < 1
  ) {
    notFound();
  }

  return <ClassFeeManagement classId={parsedClassId} />;
}
