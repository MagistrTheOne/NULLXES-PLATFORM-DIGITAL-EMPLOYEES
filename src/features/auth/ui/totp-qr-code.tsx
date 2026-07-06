"use client";

import QRCode from "react-qr-code";

export function TotpQrCode({ uri }: { uri: string }) {
  return (
    <div className="w-fit rounded-lg bg-white p-3">
      <QRCode value={uri} size={160} />
    </div>
  );
}
