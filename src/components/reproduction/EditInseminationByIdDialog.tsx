import { useQuery } from "@tanstack/react-query";
import { getInsemination } from "@/services/inseminations";
import EditInseminationDialog from "@/components/reproduction/EditInseminationDialog";

interface Props {
  inseminationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditInseminationByIdDialog({
  inseminationId,
  open,
  onOpenChange,
}: Props) {
  const { data } = useQuery({
    queryKey: ["inseminations", inseminationId],
    queryFn: () => getInsemination(inseminationId),
    enabled: open,
  });

  return (
    <EditInseminationDialog
      open={open}
      onOpenChange={onOpenChange}
      insemination={data ?? null}
    />
  );
}
