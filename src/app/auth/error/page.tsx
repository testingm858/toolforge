import ErrorClient from "./ErrorClient";
import { Suspense } from "react";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorClient />
    </Suspense>
  );
}
