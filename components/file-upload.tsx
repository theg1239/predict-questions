"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { debounce } from "lodash";

interface PredictedQuestion {
  id: number;
  text: string;
  dataTable?: string;
}

interface FileUploadProps {
  onPredict: (formData: FormData) => void;
  loading: boolean;
}

export default function FileUpload({ onPredict, loading }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("pdfs", file);
    });

    onPredict(formData);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-secondary/30 backdrop-blur-sm border-primary/10">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background/70 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-4 text-primary" />
                <p className="mb-2 text-sm text-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF files only</p>
              </div>
              <Input
                id="dropzone-file"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                name="pdfs"
              />
            </label>
          </div>
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-2 bg-background/50 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="default" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Predicting..." : "Predict Questions"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
