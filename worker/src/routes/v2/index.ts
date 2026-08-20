import type { RequestContext } from "../../http/requestContext";
import {
  realCredentialsRoute,
  type RealCredentialRouteDependencies,
} from "./credentials";
import {
  complianceAuditRoute,
  type ComplianceAuditRouteDependencies,
} from "./audit";

export type V2RouteDependencies = RealCredentialRouteDependencies &
  ComplianceAuditRouteDependencies;

export function v2Route(
  request: Request,
  context: RequestContext,
  dependencies: V2RouteDependencies,
) {
  return complianceAuditRoute(request, context, dependencies).then(
    (response) =>
      response ?? realCredentialsRoute(request, context, dependencies),
  );
}
