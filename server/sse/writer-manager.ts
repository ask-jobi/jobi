import "server-only"

const writers: Record<string, WritableStreamDefaultWriter> = {};

export function registerWriter(processId: string, writer: WritableStreamDefaultWriter) {
  writers[processId] = writer;
}

export function sendData(processId: string, data: any) {
  const encoder = new TextEncoder();
  const writer = writers[processId];

  if (!writer) return;

  const formattedData = `data: ${JSON.stringify(data)}\n\n`;
  try {
    writer.write(encoder.encode(formattedData));
  } catch (err) {
    console.error("Failed to write SSE", err);
  }
}

export function closeWriter(processId: string) {
  const writer = writers[processId];
  if (!writer) return;

  try {
    writer.close();
  } catch (e) {
    console.error("Error closing writer", e);
  } finally {
    delete writers[processId];
  }
}
