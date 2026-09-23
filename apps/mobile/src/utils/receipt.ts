import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { paymentService } from "../services";

export async function downloadAndShareReceipt(paymentId: number): Promise<void> {
  const bytes = await paymentService.downloadReceipt(paymentId);

  const file = new File(Paths.cache, `receipt-${paymentId}.pdf`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(new Uint8Array(bytes));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle: `Receipt #${paymentId}`,
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
}