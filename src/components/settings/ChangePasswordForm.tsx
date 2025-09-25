import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/auth";

export default function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutateAsync: doChange, isPending } = useMutation({
    mutationFn: () => changePassword({ current_password: currentPassword, new_password: newPassword }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: t("common.error"), description: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    try {
      await doChange();
      localStorage.removeItem('lf_must_change_password');
      toast({ title: t("auth.passwordUpdated"), description: t("auth.passwordUpdatedDescription") });
      onSuccess?.();
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast({ title: t("common.error"), description: t("auth.passwordUpdateError"), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-center">
          <KeyRound className="h-5 w-5" />
          {t("auth.changePasswordTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current" className="text-sm font-medium">{t("auth.currentPasswordLabel")}</Label>
            <div className="relative">
              <Input
                id="current"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new" className="text-sm font-medium">{t("auth.newPasswordLabel")}</Label>
            <div className="relative">
              <Input
                id="new"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">{t("auth.confirmNewPasswordLabel")}</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? t("common.loading") : t("auth.updatePasswordButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

