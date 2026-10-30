"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toast } from "@heroui/react";

import { AuthProvider } from "@/lib/auth-context";
import { DevSwitcher } from "@/components/dev-switcher";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <AuthProvider>
        {children}
        <DevSwitcher />
        <Toast.Provider />
      </AuthProvider>
    </NextThemesProvider>
  );
}
