import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Copy, Check, Smartphone, Wifi, WifiOff, Eye, EyeOff, Link, ChevronDown, ChevronRight, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listScaleDevices,
  createScaleDevice,
  regenerateDeviceKey,
  generatePairingPin,
  updateScaleDevice,
  type ScaleDevice,
} from "@/services/deviceSync";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DeviceSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [deviceName, setDeviceName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<ScaleDevice | null>(null);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ScaleDevice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [activePinData, setActivePinData] = useState<{
    pin: string;
    expires_at: string;
    deviceName: string;
    apiKey?: string;
  } | null>(null);
  const [pinTimeLeft, setPinTimeLeft] = useState<number>(0);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["scale-devices"],
    queryFn: listScaleDevices,
    staleTime: 30000,
  });

  const { mutateAsync: doCreate, isPending: creating } = useMutation({
    mutationFn: createScaleDevice,
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["scale-devices"] });
      setCreatedDevice(device);
      setIsCreateOpen(false);
      setDeviceName("");
      if (device.pairing_pin && device.pairing_pin_expires_at) {
        setActivePinData({
          pin: device.pairing_pin,
          expires_at: device.pairing_pin_expires_at,
          deviceName: device.name,
          apiKey: device.api_key,
        });
        setIsPinDialogOpen(true);
      } else {
        setIsKeyDialogOpen(true);
      }
    },
  });

  const { mutateAsync: doRegenerate, isPending: regenerating } = useMutation({
    mutationFn: (id: string) => regenerateDeviceKey(id),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["scale-devices"] });
      setCreatedDevice(device);
      setIsRegenDialogOpen(false);
      setSelectedDevice(null);
      setIsKeyDialogOpen(true);
    },
  });

  const { mutateAsync: doDeactivate, isPending: deactivating } = useMutation({
    mutationFn: (id: string) => updateScaleDevice(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scale-devices"] });
      setIsDeleteDialogOpen(false);
      setSelectedDevice(null);
      toast({ title: t("devices.deviceDeactivated"), description: t("devices.deviceDeactivatedDesc") });
    },
  });

  const { mutateAsync: doGeneratePin, isPending: generatingPin } = useMutation({
    mutationFn: (id: string) => generatePairingPin(id),
  });

  // Countdown timer for PIN expiration
  useEffect(() => {
    if (!activePinData?.expires_at || !isPinDialogOpen) return;

    const calcTimeLeft = () => {
      const now = Date.now();
      const expires = new Date(activePinData.expires_at).getTime();
      return Math.max(0, Math.floor((expires - now) / 1000));
    };

    setPinTimeLeft(calcTimeLeft());

    const interval = setInterval(() => {
      const remaining = calcTimeLeft();
      setPinTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [activePinData?.expires_at, isPinDialogOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    try {
      await doCreate({ name: deviceName.trim() });
    } catch {
      toast({ title: t("common.error"), description: t("devices.couldNotCreate"), variant: "destructive" });
    }
  };

  const handleRegenerate = async () => {
    if (!selectedDevice) return;
    try {
      await doRegenerate(selectedDevice.id);
    } catch {
      toast({ title: t("common.error"), description: t("devices.couldNotRegenerate"), variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    if (!selectedDevice) return;
    try {
      await doDeactivate(selectedDevice.id);
    } catch {
      toast({ title: t("common.error"), description: t("devices.couldNotDeactivate"), variant: "destructive" });
    }
  };

  const handleGeneratePin = useCallback(async (device: ScaleDevice) => {
    try {
      const result = await doGeneratePin(device.id);
      setActivePinData({
        pin: result.pin,
        expires_at: result.expires_at,
        deviceName: device.name,
      });
      setIsPinDialogOpen(true);
    } catch {
      toast({ title: t("common.error"), description: t("devices.couldNotGeneratePin"), variant: "destructive" });
    }
  }, [doGeneratePin, toast, t]);

  const handleRegeneratePin = useCallback(async () => {
    if (!activePinData) return;
    const device = devices.find((d) => d.name === activePinData.deviceName);
    if (!device) return;
    try {
      const result = await doGeneratePin(device.id);
      setActivePinData({
        pin: result.pin,
        expires_at: result.expires_at,
        deviceName: device.name,
        apiKey: activePinData.apiKey,
      });
    } catch {
      toast({ title: t("common.error"), description: t("devices.couldNotGeneratePin"), variant: "destructive" });
    }
  }, [activePinData, devices, doGeneratePin, toast, t]);

  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Add button */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t("devices.title")}
          </CardTitle>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("devices.addDevice")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("devices.noDevices")}</p>
              <p className="text-sm mt-1">{t("devices.noDevicesHint")}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead>{t("devices.status")}</TableHead>
                        <TableHead>{t("devices.firmware")}</TableHead>
                        <TableHead>{t("devices.lastSeen")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow key={device.id} className={!device.is_active ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{device.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">{device.api_key_masked}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setSelectedDevice(device);
                                  setIsRegenDialogOpen(true);
                                }}
                                title={t("devices.regenerateKey")}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={device.is_active ? "default" : "secondary"}>
                              {device.is_active ? t("common.active") : t("common.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{device.firmware_version || "-"}</TableCell>
                          <TableCell className="text-sm">{formatDate(device.last_seen_at)}</TableCell>
                          <TableCell className="text-right">
                            {device.is_active && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGeneratePin(device)}
                                  disabled={generatingPin}
                                >
                                  <Link className="h-4 w-4 mr-1" />
                                  {t("devices.pairDevice")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`border border-border rounded-lg bg-card overflow-hidden ${!device.is_active ? "opacity-50" : ""}`}
                  >
                    <div className="px-3 pt-3 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{device.name}</p>
                        <Badge variant={device.is_active ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                          {device.is_active ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{device.api_key_masked}</code>
                      </div>
                    </div>

                    <div className="px-3 pb-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("devices.firmware")}</span>
                        <span>{device.firmware_version || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("devices.lastSeen")}</span>
                        <span>{formatDate(device.last_seen_at)}</span>
                      </div>
                      {device.wifi_ssid && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">WiFi</span>
                          <span className="flex items-center gap-1">
                            <Wifi className="h-3 w-3" /> {device.wifi_ssid}
                          </span>
                        </div>
                      )}
                    </div>

                    {device.is_active && (
                      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border/50 bg-muted/30">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleGeneratePin(device)}
                          disabled={generatingPin}
                        >
                          <Link className="h-3.5 w-3.5 mr-1" />
                          {t("devices.pairDevice")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedDevice(device);
                            setIsRegenDialogOpen(true);
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          {t("devices.regenerateKeyShort")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedDevice(device);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Device Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.addDevice")}</DialogTitle>
            <DialogDescription>{t("devices.addDeviceDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="py-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="device-name">{t("devices.deviceName")}</Label>
                <Input
                  id="device-name"
                  placeholder={t("devices.deviceNamePlaceholder")}
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={creating || !deviceName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? t("common.loading") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Display Dialog (shown after create or regenerate) */}
      <Dialog open={isKeyDialogOpen} onOpenChange={(open) => {
        setIsKeyDialogOpen(open);
        if (!open) {
          setCreatedDevice(null);
          setShowKey(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.apiKeyTitle")}</DialogTitle>
            <DialogDescription>{t("devices.apiKeyWarning")}</DialogDescription>
          </DialogHeader>
          {createdDevice?.api_key && (
            <div className="py-4">
              <div className="p-3 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("devices.deviceName")}</p>
                  <p className="font-medium text-sm">{createdDevice.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1.5 rounded border flex-1 break-all">
                      {showKey ? createdDevice.api_key : "••••••••••••••••" + createdDevice.api_key.slice(-4)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(createdDevice.api_key!, createdDevice.id)}
                    >
                      {copiedId === createdDevice.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                {t("devices.apiKeyCopyReminder")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setIsKeyDialogOpen(false);
              setCreatedDevice(null);
              setShowKey(false);
            }}>
              {t("devices.understood")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Key Confirmation */}
      <Dialog open={isRegenDialogOpen} onOpenChange={setIsRegenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.regenerateKey")}</DialogTitle>
            <DialogDescription>{t("devices.regenerateKeyDesc")}</DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedDevice.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("devices.currentKey")}: {selectedDevice.api_key_masked}</p>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                {t("devices.regenerateWarning")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegenDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {regenerating ? t("common.loading") : t("devices.regenerateKey")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Device Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.deactivateDevice")}</DialogTitle>
            <DialogDescription>{t("devices.deactivateDeviceDesc")}</DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedDevice.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("devices.firmware")}: {selectedDevice.firmware_version || "-"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deactivating ? t("common.loading") : t("devices.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pairing PIN Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={(open) => {
        setIsPinDialogOpen(open);
        if (!open) {
          setActivePinData(null);
          setIsAdvancedOpen(false);
          setShowKey(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.pairingPin")}</DialogTitle>
            <DialogDescription>{t("devices.enterPinOnDevice")}</DialogDescription>
          </DialogHeader>
          {activePinData && (
            <div className="py-4 space-y-4">
              {/* Device name */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t("devices.deviceName")}</p>
                <p className="font-medium text-sm">{activePinData.deviceName}</p>
              </div>

              {/* PIN Display */}
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">{t("devices.pairingPinDesc")}</p>
                {pinTimeLeft > 0 ? (
                  <>
                    <div className="text-5xl font-bold font-mono tracking-[0.3em] select-all">
                      {activePinData.pin}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(activePinData.pin, "pin")}
                      >
                        {copiedId === "pin" ? (
                          <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        {copiedId === "pin" ? "Copiado" : "Copiar PIN"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{t("devices.pairingPinExpires")} {formatTimeLeft(pinTimeLeft)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-bold font-mono tracking-[0.3em] text-muted-foreground/40 select-none">
                      ------
                    </div>
                    <p className="text-sm text-destructive font-medium">{t("devices.pairingPinExpired")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegeneratePin}
                      disabled={generatingPin}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      {generatingPin ? t("common.loading") : t("devices.generateNewPin")}
                    </Button>
                  </>
                )}
              </div>

              {/* Advanced: API Key section */}
              {activePinData.apiKey && (
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                      {isAdvancedOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      {t("devices.advancedApiKey")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-muted rounded-lg space-y-2">
                      <p className="text-xs text-muted-foreground">API Key</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1.5 rounded border flex-1 break-all">
                          {showKey ? activePinData.apiKey : "••••••••••••••••" + activePinData.apiKey.slice(-4)}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => copyToClipboard(activePinData.apiKey!, "apikey")}
                        >
                          {copiedId === "apikey" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        {t("devices.apiKeyCopyReminder")}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setIsPinDialogOpen(false);
              setActivePinData(null);
              setIsAdvancedOpen(false);
              setShowKey(false);
            }}>
              {t("devices.understood")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
