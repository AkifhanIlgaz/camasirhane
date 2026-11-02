import { RequestPhoto } from "@/components/request-photo";
import { programName } from "@/lib/programs";
import type { WashRequest } from "@/types";

/** Çamaşırcının bir isteği tanıması için özet satırları. */
export function RequestInfo({ request }: { request: WashRequest }) {
  return (
    <div>
      <p className="font-medium">Talebe No: {request.studentNo}</p>
      <p className="text-sm text-muted">
        {programName("wash", request.program)} · {request.temperature}°C · {request.spin} devir
      </p>
      {(request.softener || request.dry) && (
        <p className="text-sm text-muted">
          {[request.softener && "Yumuşatıcı var", request.dry && "Kurutma"]
            .filter(Boolean)
            .join(" · ")}
          {request.dryProgram ? ` (${programName("dry", request.dryProgram)})` : ""}
        </p>
      )}
      {request.note && (
        <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-secondary px-3 py-2 text-sm">
          <span className="font-medium">Not: </span>
          {request.note}
        </p>
      )}
      {request.hasImage && (
        <div className="mt-2">
          <RequestPhoto requestId={request.id} />
        </div>
      )}
    </div>
  );
}
