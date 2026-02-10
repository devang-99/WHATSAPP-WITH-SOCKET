import "./global.css";
import type { ReactNode } from "react";
import StoreProvider from "../redux/storeProvider";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
