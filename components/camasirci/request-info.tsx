import type { WashRequest } from "@/types";

/** Çamaşırcının bir isteği tanıması için özet satırları. */
export function RequestInfo({ request }: { request: WashRequest }) {
  return (
    <div>
      <p className="font-medium">Talebe No: {request.studentNo}</p>
      <p className="text-sm text-muted">
        {request.program} · {request.temperature}°C · {request.spin} devir
      </p>
      {(request.softener || request.dry) && (
        <p className="text-sm text-muted">
          {[request.softener && "Yumuşatıcı var", request.dry && "Kurutma"]
            .filter(Boolean)
            .join(" · ")}
          {request.dryProgram ? ` (${request.dryProgram})` : ""}
        </p>
      )}
    </div>
  );
}
