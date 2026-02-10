"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "../utils/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useAppSelector(
    (state) => state.authenticator.currentUser,
  );

  useEffect(() => {
    if (!currentUser) router.replace("/pages/auth/login");
  }, [currentUser, router]);

  if (!currentUser) return null;

  return children;
}