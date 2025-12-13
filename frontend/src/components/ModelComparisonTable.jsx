// this file is for everything realted to model comparison and to show the table
// i can point at it and say: "look, all models are compared here"

import React from "react";
import { Table, Badge } from "@mantine/core";

const prettyName = (modelKey) => {
  // update: converting short keys into nice labels
  if (modelKey === "lr") return "LR";
  if (modelKey === "svm") return "SVM";
  if (modelKey === "distilbert") return "DistilBERT";
  return modelKey;
};

export default function ModelComparisonTable({ rows }) {
  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Model</Table.Th>
          <Table.Th>Directional accuracy</Table.Th>
          <Table.Th># days</Table.Th>
          <Table.Th>Avg confidence</Table.Th>
          <Table.Th>Latency (ms/text)</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {rows.map((r) => (
          <Table.Tr key={r.model}>
            <Table.Td>
              <Badge variant="light">{prettyName(r.model)}</Badge>
            </Table.Td>

            <Table.Td>{(Number(r.directionalAccuracy) * 100).toFixed(1)}%</Table.Td>

            <Table.Td>{r.evaluatedDays}</Table.Td>

            <Table.Td>{Number(r.avgConfidence).toFixed(2)}</Table.Td>

            <Table.Td>{Math.round(Number(r.avgLatencyMs))}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}