import type { Instrumentation } from "next";
import { writeErrorLog } from "@/lib/errorLog";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err as { message?: string; digest?: string };
  await writeErrorLog({
    message: error?.message ?? String(err),
    digest: error?.digest,
    routePath: context.routePath,
    routeType: context.routeType,
    requestPath: request.path,
    requestMethod: request.method,
  });
};
