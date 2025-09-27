import { useState, useEffect } from "react";
import { Search, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addMembership } from "@/services/auth";
import { listTenantUsers, removeUserMembership, type User } from "@/services/users";
import { getTenantId } from "@/services/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsAdmin, useUserId } from "@/hooks/useAuth";
import { AdminOnly } from "@/components/auth/RoleGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsUsers() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tenantId = getTenantId();
  const isAdmin = useIsAdmin();
  const currentUserId = useUserId();

  const ROLE_OPTIONS = [
    { value: "ADMIN", label: t("common.administrator") },
    { value: "MANAGER", label: t("common.manager") },
    { value: "WORKER", label: t("common.worker") },
    { value: "VETERINARIAN", label: t("common.veterinarian") },
  ];

  const [formData, setFormData] = useState({
    email: "",
    role: "WORKER",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  // Fetch users for admins
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', tenantId, currentPage, pageSize, searchTerm],
    queryFn: () => listTenantUsers(tenantId || "", {
      page: currentPage,
      limit: pageSize,
      search: searchTerm || undefined,
    }),
    enabled: !!tenantId && isAdmin,
    staleTime: 30000, // 30 seconds
  });

  const { mutateAsync: doAdd, isPending } = useMutation({
    mutationFn: () =>
      addMembership({
        tenant_id: tenantId || "",
        role: formData.role,
        email: formData.email,
        create_if_missing: true,
        // initial_password omitted to let backend auto-generate and force change on first login
      }),
    onSuccess: () => {
      refetchUsers();
    },
  });

  const { mutateAsync: doRemoveUser, isPending: removingUser } = useMutation({
    mutationFn: (userId: string) =>
      removeUserMembership(tenantId || "", userId, {
        reason: deleteReason || undefined,
      }),
    onSuccess: () => {
      refetchUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setDeleteReason("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast({ title: t("common.farmNotSelected"), description: t("common.selectFarmFirst"), variant: "destructive" });
      return;
    }
    if (!formData.email) {
      toast({ title: t("common.emailRequired"), description: t("common.enterUserEmail"), variant: "destructive" });
      return;
    }
    try {
      const res = await doAdd();
      const pwdNote = res.generated_password ? ` ${t("common.tempPassword")}: ${res.generated_password}` : "";
      toast({ title: t("common.userAdded"), description: `${t("common.userAddedDescription")} ${res.role} a ${res.email}.${pwdNote}` });
      setFormData({ email: "", role: formData.role });
    } catch (err) {
      console.error(err);
      toast({ title: t("common.error"), description: t("common.couldNotAddUser"), variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await doRemoveUser(selectedUser.id);
      toast({
        title: t("common.userRemoved"),
        description: t("common.userRemovedDescription")
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t("common.error"),
        description: t("common.couldNotRemoveUser"),
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    // Prevent users from deleting themselves
    if (user.id === currentUserId) {
      toast({
        title: t("common.error"),
        description: t("common.cannotDeleteSelf"),
        variant: "destructive"
      });
      return;
    }

    setSelectedUser(user);
    setDeleteReason("");
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'destructive';
      case 'MANAGER': return 'secondary';
      case 'VETERINARIAN': return 'outline';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role.toUpperCase());
    return roleOption?.label || role;
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center">
              <Plus className="h-5 w-5" />
              {t("common.addUserToTenant")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">{t("common.role")}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex justify-center">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? t("common.loading") : t("common.addUser")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Users Management - Admin Only */}
      <AdminOnly hideOnForbidden>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {t("common.usersList")}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("common.searchUsers")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {loadingUsers ? (
              <div className="text-center py-4">{t("common.loading")}</div>
            ) : !usersData?.users?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t("common.noResults") : t("common.noUsersFound")}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.firstName")}</TableHead>
                          <TableHead>{t("common.lastName")}</TableHead>
                          <TableHead>{t("common.email")}</TableHead>
                          <TableHead>{t("common.role")}</TableHead>
                          <TableHead>{t("common.lastLogin")}</TableHead>
                          <TableHead>{t("common.createdAt")}</TableHead>
                          <TableHead className="text-right">{t("common.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.first_name}</TableCell>
                            <TableCell>{user.last_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(user.last_login)}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                                disabled={user.id === currentUserId}
                                className={user.id === currentUserId
                                  ? "text-muted-foreground cursor-not-allowed"
                                  : "text-destructive hover:text-destructive"
                                }
                                title={user.id === currentUserId ? t("common.cannotDeleteSelf") : t("common.removeUser")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {usersData.users.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 mr-3">
                          <div className="font-medium text-lg mb-1">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground break-all">
                            {user.email}
                          </div>
                          <div className="mt-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.id === currentUserId}
                            className={user.id === currentUserId
                              ? "text-muted-foreground cursor-not-allowed"
                              : "text-destructive hover:text-destructive"
                            }
                            title={user.id === currentUserId ? t("common.cannotDeleteSelf") : t("common.removeUser")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-100">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-xs">{t("common.lastLogin")}:</span>
                          <span className="font-medium text-xs">
                            {formatDate(user.last_login)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-xs">{t("common.createdAt")}:</span>
                          <span className="font-medium text-xs">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {usersData.pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      {t("common.page")} {usersData.pagination.page} {t("common.of")} {usersData.pagination.pages}
                      {" • "}{usersData.pagination.total} {t("common.itemsPerPage")}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        {t("common.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(usersData.pagination.pages, currentPage + 1))}
                        disabled={currentPage === usersData.pagination.pages}
                      >
                        {t("common.next")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </AdminOnly>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeleteUser")}</DialogTitle>
            <DialogDescription>
              {t("common.confirmDeleteUserMessage")}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-2">
                  {getRoleLabel(selectedUser.role)}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-reason">{t("common.reason")}</Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Razón para eliminar al usuario..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={removingUser}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {removingUser ? t("common.loading") : t("common.removeUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
