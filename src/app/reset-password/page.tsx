import ResetPasswordForm from "@/components/auth/reset-password-form";

type Props = {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: Props) {
  const parameters = await searchParams;

  return (
    <ResetPasswordForm
      token={parameters.token ?? ""}
      email={parameters.email ?? ""}
    />
  );
}
