"use client";

import { Tabs } from "@heroui/react";

import { AppShell } from "@/components/app-shell";
import { MachinesTab } from "@/components/muhasebeci/machines-tab";
import { SettingsTab } from "@/components/muhasebeci/settings-tab";
import { StudentsTab } from "@/components/muhasebeci/students-tab";
import { TransactionsTab } from "@/components/muhasebeci/transactions-tab";

export default function MuhasebeciPage() {
  return (
    <AppShell role="muhasebeci">
      <Tabs className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Muhasebeci bölümleri">
            <Tabs.Tab id="talebeler">
              Talebeler
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="islemler">
              İşlemler
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="makineler">
              Makineler
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="ayarlar">
              Ayarlar
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="talebeler">
          <StudentsTab />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="islemler">
          <TransactionsTab />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="makineler">
          <MachinesTab />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="ayarlar">
          <SettingsTab />
        </Tabs.Panel>
      </Tabs>
    </AppShell>
  );
}
