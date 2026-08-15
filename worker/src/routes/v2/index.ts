import type { RequestContext } from "../../http/requestContext";
import {
  realCredentialsRoute,
  type RealCredentialRouteDependencies,
} from "./credentials";

export function v2Route(
  request: Request,
  context: RequestContext,
  dependencies: RealCredentialRouteDependencies,
) {
  return realCredentialsRoute(request, context, dependencies);
}
