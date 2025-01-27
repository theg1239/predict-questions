import formidable, { File } from "formidable";
import { NextRequest } from "next/server";
import { Readable, PassThrough } from "stream";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "tmp_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function readableStreamToNodeStream(stream: ReadableStream<Uint8Array>): Readable {
  const passThrough = new PassThrough();
  const reader = stream.getReader();

  (async function () {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        passThrough.write(Buffer.from(value));
      }
      passThrough.end();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred while converting stream.");
      passThrough.destroy(error);
    }
  })();

  return passThrough;
}

export async function parseForm(req: NextRequest): Promise<{ files: File[] }> {
  const form = formidable({
    multiples: true,
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filename: (name, ext, part, form) => {
      return Date.now().toString() + "-" + (part.originalFilename || "unknown");
    },
  });

  const nodeStream = readableStreamToNodeStream(req.body as ReadableStream<Uint8Array>);

  const mockReq = Object.assign(nodeStream, {
    headers: {
      "content-type": req.headers.get("content-type") || "",
      "content-length": req.headers.get("content-length") || "0",
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(mockReq as any, (err, fields, files) => {
      if (err) {
        console.error("Form parsing error:", err);
        return reject(err);
      }

      console.log("Form fields:", fields);
      console.log("Form files:", files);

      const uploadedFiles: File[] = [];

      for (const key in files) {
        const fileOrFiles = files[key];
        if (Array.isArray(fileOrFiles)) {
          uploadedFiles.push(...fileOrFiles);
        } else if (fileOrFiles) {
          uploadedFiles.push(fileOrFiles);
        }
      }

      console.log("Uploaded files:", uploadedFiles);

      resolve({ files: uploadedFiles as File[] });
    });
  });
}
