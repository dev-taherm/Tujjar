import { Spinner } from "@/shared/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary-600" />
    </div>
  );
}
