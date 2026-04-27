"use client";

import { use, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrder } from "@/lib/api/orders";
import { getVoucherUploadUrl, confirmVoucher } from "@/lib/api/payments";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Upload } from "lucide-react";

type UploadState = "idle" | "getting-url" | "uploading" | "confirming" | "done";

export function PaymentPageClient({
  paramsPromise,
}: {
  paramsPromise: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(paramsPromise);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    try {
      setUploadState("getting-url");
      const { uploadUrl, objectName } = await getVoucherUploadUrl(orderId);

      setUploadState("uploading");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir archivo");
      }

      setUploadState("confirming");
      const updatedOrder = await confirmVoucher(orderId, objectName);

      setTicketNumber(updatedOrder.ticketNumber ?? null);
      setUploadState("done");
      toast.success("Voucher enviado exitosamente");
    } catch {
      toast.error("Error al procesar el voucher");
      setUploadState("idle");
    }
  }

  const stateLabel: Record<UploadState, string> = {
    idle: "Enviar voucher",
    "getting-url": "Preparando...",
    uploading: "Subiendo archivo...",
    confirming: "Confirmando...",
    done: "¡Enviado!",
  };

  if (isLoading) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (uploadState === "done") {
    return (
      <div className="max-w-md space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-green-800">
                ¡Voucher recibido!
              </h2>
              {ticketNumber && (
                <p className="mt-2 font-mono text-lg font-semibold text-green-700">
                  {ticketNumber}
                </p>
              )}
              <p className="mt-2 text-sm text-green-700">
                Confirmaremos tu pago en breve y recibirás tu pedido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pago del Pedido</h1>
        {order?.ticketNumber && (
          <p className="text-sm text-gray-500">{order.ticketNumber}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instrucciones de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4 space-y-2">
            <p>
              <strong>Yape / Plin:</strong> 999 999 999
            </p>
            <p>
              <strong>Banco:</strong> BCP Cta. Cte. 000-0000000-0-00
            </p>
            <p className="text-gray-600">
              Realiza el pago y sube la foto del comprobante abajo.
            </p>
          </div>
          {order && (
            <p className="text-base font-semibold">
              Total a pagar: {formatPrice(order.total)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subir comprobante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-8 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            {selectedFile ? (
              <p className="text-sm font-medium text-gray-700">
                {selectedFile.name}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Toca para seleccionar imagen
              </p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!selectedFile || uploadState !== "idle"}
          >
            {stateLabel[uploadState]}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
