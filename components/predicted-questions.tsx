"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React from "react";

function parseMarkdownTable(mdTable: string): React.ReactNode {
  const lines = mdTable.trim().split("\n");

  if (lines.length < 2) {
    return <p className="text-red-500">Invalid table data</p>;
  }

  const headers = lines[0]
    .split("|")
    .map((header) => header.trim())
    .filter(Boolean);

  const separator = lines[1]
    .split("|")
    .map((sep) => sep.trim())
    .filter(Boolean);
  
  if (separator.length < headers.length) {
    return <p className="text-red-500">Invalid table format: Separator line does not match header columns.</p>;
  }

  // Extract data rows
  const dataRows = lines.slice(2).map((line, index) => {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (cells.length !== headers.length) {
      return (
        <tr key={index}>
          <td colSpan={headers.length} className="px-2 py-1 border border-gray-300 text-red-500">
            Invalid row format
          </td>
        </tr>
      );
    }

    return (
      <tr key={index}>
        {cells.map((cell, cellIndex) => (
          <td key={cellIndex} className="px-2 py-1 border border-gray-300">
            {cell}
          </td>
        ))}
      </tr>
    );
  });

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse border border-gray-400 w-full text-sm">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-2 py-1 border border-gray-300 bg-black text-left"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{dataRows}</tbody>
      </table>
    </div>
  );
}

interface Question {
  id: number;
  text: string;
  dataTable?: string;
}

interface PredictedQuestionsProps {
  questions: Question[];
  loading: boolean;
}

export default function PredictedQuestions({
  questions,
  loading,
}: PredictedQuestionsProps) {
  return (
    <div className="mt-12">
      <h2 className="text-3xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Predicted Questions
      </h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : questions.length > 0 ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {questions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-background/50 rounded-md border-primary/10 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-primary">
                      Question {question.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{question.text}</p>
                    {question.dataTable && question.dataTable.trim().length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Data Table:</h4>
                        {parseMarkdownTable(question.dataTable)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Card className="bg-background/50 rounded-md border-primary/10">
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              No predictions available yet. Upload PDFs to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
