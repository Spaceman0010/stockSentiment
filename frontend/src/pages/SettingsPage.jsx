// This page is optional. experimental for now
// keeping it simple for now

import React from "react";
import { Paper, Text } from "@mantine/core";

export default function SettingsPage() {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={800} size="xl">Settings</Text>
      <Text size="sm" c="dimmed">
        Later I can add: backend URL, caching toggle, transaction cost slider, etc.
      </Text>
    </Paper>
  );
}