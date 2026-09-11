"use client";

import {
  CheckCircle2,
  FileText,
  ImagePlus,
  LoaderCircle,
  UserPlus,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  getClasses,
  getLocations,
  registerStudent,
  updateStudent,
  RegisteredStudent,
  RwandaLocation,
  SchoolClass,
} from "@/services/student.service";

type StudentForm = {
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string;
  parent_contact: string;
  guardian_name: string;
  guardian_contact: string;
  guardian_relationship: string;
  date_of_birth: string;
  school_class_id: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  previous_school_name: string;
};

const emptyForm: StudentForm = {
  first_name: "",
  last_name: "",
  father_name: "",
  mother_name: "",
  parent_contact: "",
  guardian_name: "",
  guardian_contact: "",
  guardian_relationship: "",
  date_of_birth: "",
  school_class_id: "",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  previous_school_name: "",
};

function createStudentForm(
  student?: RegisteredStudent,
): StudentForm {
  if (!student) return emptyForm;

  return {
    first_name: student.first_name ?? "",
    last_name: student.last_name ?? "",
    father_name: student.father_name ?? "",
    mother_name: student.mother_name ?? "",
    parent_contact: student.parent_contact ?? "",
    guardian_name: student.guardian_name ?? "",
    guardian_contact: student.guardian_contact ?? "",
    guardian_relationship:
      student.guardian_relationship ?? "",
    date_of_birth: student.date_of_birth?.split("T")[0] ?? "",
    school_class_id: String(
      student.school_class_id ??
        student.school_class?.id ??
        "",
    ),
    province: student.province ?? "",
    district: student.district ?? "",
    sector: student.sector ?? "",
    cell: student.cell ?? "",
    village: student.village ?? "",
    previous_school_name:
      student.previous_school_name ?? "",
  };
}

export default function StudentRegistrationForm({
  mode = "create",
  student,
  onSuccess,
}: {
  mode?: "create" | "edit";
  student?: RegisteredStudent;
  onSuccess?: (student: RegisteredStudent) => void;
}) {
  const editing = mode === "edit" && Boolean(student);

  const [form, setForm] = useState<StudentForm>(() =>
    createStudentForm(student),
  );
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [provinces, setProvinces] = useState<RwandaLocation[]>([]);
  const [districts, setDistricts] = useState<RwandaLocation[]>([]);
  const [sectors, setSectors] = useState<RwandaLocation[]>([]);
  const [cells, setCells] = useState<RwandaLocation[]>([]);
  const [villages, setVillages] = useState<RwandaLocation[]>([]);

  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [cellId, setCellId] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [classData, provinceData] = await Promise.all([
          getClasses(),
          getLocations("province"),
        ]);

        setClasses(classData);
        setProvinces(provinceData);

        if (student) {
          const province = provinceData.find(
            (location) =>
              location.name.toLowerCase() ===
              student.province?.toLowerCase(),
          );

          if (province) {
            setProvinceId(String(province.id));

            const districtData = await getLocations(
              "district",
              province.id,
            );

            setDistricts(districtData);

            const district = districtData.find(
              (location) =>
                location.name.toLowerCase() ===
                student.district?.toLowerCase(),
            );

            if (district) {
              setDistrictId(String(district.id));

              const sectorData = await getLocations(
                "sector",
                district.id,
              );

              setSectors(sectorData);

              const sector = sectorData.find(
                (location) =>
                  location.name.toLowerCase() ===
                  student.sector?.toLowerCase(),
              );

              if (sector) {
                setSectorId(String(sector.id));

                const cellData = await getLocations(
                  "cell",
                  sector.id,
                );

                setCells(cellData);

                const cell = cellData.find(
                  (location) =>
                    location.name.toLowerCase() ===
                    student.cell?.toLowerCase(),
                );

                if (cell) {
                  setCellId(String(cell.id));

                  setVillages(
                    await getLocations("village", cell.id),
                  );
                }
              }
            }
          }
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Registration information could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [student]);

  function updateField(field: keyof StudentForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function selectProvince(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const selected = provinces.find((item) => item.id === Number(id));

    setProvinceId(id);
    setDistrictId("");
    setSectorId("");
    setCellId("");
    setDistricts([]);
    setSectors([]);
    setCells([]);
    setVillages([]);

    setForm((current) => ({
      ...current,
      province: selected?.name ?? "",
      district: "",
      sector: "",
      cell: "",
      village: "",
    }));

    if (!id) return;

    setLoadingAddress(true);

    try {
      setDistricts(await getLocations("district", Number(id)));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Districts could not be loaded.",
      );
    } finally {
      setLoadingAddress(false);
    }
  }

  async function selectDistrict(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const selected = districts.find((item) => item.id === Number(id));

    setDistrictId(id);
    setSectorId("");
    setCellId("");
    setSectors([]);
    setCells([]);
    setVillages([]);

    setForm((current) => ({
      ...current,
      district: selected?.name ?? "",
      sector: "",
      cell: "",
      village: "",
    }));

    if (!id) return;

    setLoadingAddress(true);

    try {
      setSectors(await getLocations("sector", Number(id)));
    } finally {
      setLoadingAddress(false);
    }
  }

  async function selectSector(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const selected = sectors.find((item) => item.id === Number(id));

    setSectorId(id);
    setCellId("");
    setCells([]);
    setVillages([]);

    setForm((current) => ({
      ...current,
      sector: selected?.name ?? "",
      cell: "",
      village: "",
    }));

    if (!id) return;

    setLoadingAddress(true);

    try {
      setCells(await getLocations("cell", Number(id)));
    } finally {
      setLoadingAddress(false);
    }
  }

  async function selectCell(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const selected = cells.find((item) => item.id === Number(id));

    setCellId(id);
    setVillages([]);

    setForm((current) => ({
      ...current,
      cell: selected?.name ?? "",
      village: "",
    }));

    if (!id) return;

    setLoadingAddress(true);

    try {
      setVillages(await getLocations("village", Number(id)));
    } finally {
      setLoadingAddress(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setStudentId("");

    try {
      const payload = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          payload.append(key, value);
        }
      });

      if (image) {
        payload.append("image", image);
      }

      documents.forEach((document) => {
        payload.append("documents[]", document);
      });

      const savedStudent =
        editing && student
          ? await updateStudent(student.id, payload)
          : await registerStudent(payload);

      setStudentId(savedStudent.student_id);
      onSuccess?.(savedStudent);

      if (!editing) {
        setForm(emptyForm);
        setProvinceId("");
        setDistrictId("");
        setSectorId("");
        setCellId("");
        setDistricts([]);
        setSectors([]);
        setCells([]);
        setVillages([]);
        setImage(null);
        setDocuments([]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Student registration failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
        <LoaderCircle size={20} className="animate-spin" />
        Loading registration form...
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 bg-white p-4 sm:p-5"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {studentId && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
          <CheckCircle2 size={21} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold">
              {editing
                ? "Student updated successfully"
                : "Student registered successfully"}
            </p>
            <p className="mt-1 text-sm">
              Student ID:{" "}
              <span className="font-bold">{studentId}</span>
            </p>
          </div>
        </div>
      )}

      <FormSection title="Student Information">
        <FormInput
          label="First name"
          value={form.first_name}
          onChange={(value) => updateField("first_name", value)}
        />

        <FormInput
          label="Last name"
          value={form.last_name}
          onChange={(value) => updateField("last_name", value)}
        />

        <FormInput
          label="Date of birth"
          type="date"
          value={form.date_of_birth}
          onChange={(value) => updateField("date_of_birth", value)}
        />

        <SelectInput
          label="Class"
          value={form.school_class_id}
          onChange={(value) => updateField("school_class_id", value)}
        >
          <option value="">Select class</option>

          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name} ({schoolClass.code})
              {schoolClass.program
                ? ` — ${schoolClass.program.name}`
                : ""}
            </option>
          ))}
        </SelectInput>

        <FormInput
          label="Previous school"
          required={false}
          value={form.previous_school_name}
          onChange={(value) =>
            updateField("previous_school_name", value)
          }
        />
      </FormSection>

      <FormSection title="Parents and Guardian">
        <FormInput
          label="Father name"
          required={false}
          value={form.father_name}
          onChange={(value) => updateField("father_name", value)}
        />

        <FormInput
          label="Mother name"
          required={false}
          value={form.mother_name}
          onChange={(value) => updateField("mother_name", value)}
        />

        <FormInput
          label="Parent contact"
          type="tel"
          value={form.parent_contact}
          onChange={(value) => updateField("parent_contact", value)}
        />

        <FormInput
          label="Guardian name"
          required={false}
          value={form.guardian_name}
          onChange={(value) => updateField("guardian_name", value)}
        />

        <FormInput
          label="Guardian contact"
          type="tel"
          required={false}
          value={form.guardian_contact}
          onChange={(value) =>
            updateField("guardian_contact", value)
          }
        />

        <FormInput
          label="Relationship"
          required={false}
          placeholder="Example: Uncle"
          value={form.guardian_relationship}
          onChange={(value) =>
            updateField("guardian_relationship", value)
          }
        />
      </FormSection>

      <FormSection title="Student Address">
        <SelectInput
          label="Province"
          value={provinceId}
          onChangeEvent={selectProvince}
        >
          <option value="">Select province</option>
          {provinces.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="District"
          value={districtId}
          disabled={!provinceId}
          onChangeEvent={selectDistrict}
        >
          <option value="">Select district</option>
          {districts.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="Sector"
          value={sectorId}
          disabled={!districtId}
          onChangeEvent={selectSector}
        >
          <option value="">Select sector</option>
          {sectors.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="Cell"
          value={cellId}
          disabled={!sectorId}
          onChangeEvent={selectCell}
        >
          <option value="">Select cell</option>
          {cells.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="Village"
          value={form.village}
          disabled={!cellId}
          onChange={(value) => updateField("village", value)}
        >
          <option value="">Select village</option>
          {villages.map((location) => (
            <option key={location.id} value={location.name}>
              {location.name}
            </option>
          ))}
        </SelectInput>

        {loadingAddress && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <LoaderCircle size={17} className="animate-spin" />
            Loading address...
          </div>
        )}
      </FormSection>

      <FormSection title="Image and Documents">
        <FileInput
          label="Student image"
          accept="image/jpeg,image/png,image/webp"
          icon={ImagePlus}
          onChange={(files) => setImage(files[0] ?? null)}
        />

        <FileInput
          label="Student documents"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple
          icon={FileText}
          onChange={setDocuments}
        />
      </FormSection>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {submitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Register Student
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">
        {title}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function FormInput({
  label,
  value,
  type = "text",
  required = true,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {!required && (
          <span className="ml-1 font-normal text-slate-400">
            (optional)
          </span>
        )}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  disabled = false,
  children,
  onChange,
  onChangeEvent,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  onChange?: (value: string) => void;
  onChangeEvent?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        required
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChangeEvent?.(event);
          onChange?.(event.target.value);
        }}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {children}
      </select>
    </label>
  );
}

function FileInput({
  label,
  accept,
  multiple = false,
  icon: Icon,
  onChange,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  icon: typeof FileText;
  onChange: (files: File[]) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="flex h-16 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50">
        <Icon size={22} className="text-blue-600" />
        <span>Choose {multiple ? "files" : "file"}</span>
      </div>

      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) =>
          onChange(Array.from(event.target.files ?? []))
        }
      />
    </label>
  );
}
