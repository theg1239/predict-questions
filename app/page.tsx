"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/components/file-upload";
import PredictedQuestions from "@/components/predicted-questions";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { debounce } from "lodash";

interface Question {
  id: number;
  text: string;
  dataTable?: string;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const debouncedSetQuestions = useCallback(
    debounce((newQuestions: Question[]) => {
      setQuestions(newQuestions);
    }, 300),
    []
  );

  const handlePrediction = async (formData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions) {
          debouncedSetQuestions(data.questions);
        } else {
          debouncedSetQuestions([]);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "File upload failed");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      debouncedSetQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="bg-background/60 backdrop-blur-sm border-primary/10 shadow-lg">
          <CardContent className="p-6">
            <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Exam Question Predictor
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Upload previous question papers and let AI predict potential questions for your upcoming exams.
            </p>
            <FileUpload onPredict={handlePrediction} loading={loading} />
            <PredictedQuestions questions={questions} loading={loading} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
