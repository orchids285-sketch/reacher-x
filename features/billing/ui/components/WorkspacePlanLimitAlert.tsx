"use client";

import { api } from "@/convex/_generated/api";
import {
  useActiveUseCaseLabels,
  usePreferredShellQueryArgs,
  useQueryWithStatus,
} from "@/shared/hooks";
import { getWorkspaceDiscoveryVerb } from "@/shared/lib/workspaceUseCases";
import { cn } from "@/shared/lib/utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/ui/components/Alert";

interface WorkspacePlanLimitAlertProps {
  className?: string;
}

export function WorkspacePlanLimitAlert({
  className,
}: WorkspacePlanLimitAlertProps) {
  const { activeUseCaseKey, entityPlural } = useActiveUseCaseLabels();
  const preferredShellQueryArgs = usePreferredShellQueryArgs();
  const shellStateQuery = useQueryWithStatus(
    api.shell.getAppShellState,
    preferredShellQueryArgs
  );
  const planQuery = useQueryWithStatus(api.plans.getCurrentPlan);

  const workspaceSystemStatus = shellStateQuery.data?.workspaceSystemStatus;
  const tier = planQuery.data?.tier;
  const requiresPlan = tier === "free";
  const isPlanLimited = workspaceSystemStatus?.issueReason === "limit_reached";

  if (!requiresPlan && !isPlanLimited) {
    return null;
  }

  const entityPluralLower = entityPlural.toLowerCase();
  const discoveryVerb = getWorkspaceDiscoveryVerb(activeUseCaseKey);

  // The upgrade wall is gone entirely.
  //
  // It was the worst of the billing surfaces because it did not merely offer a second
  // subscription -- it withheld the tool until one was bought, from a customer who has
  // already paid for access once. Entitlement is the host's decision, and this component
  // has no way to see it, so "free tier" here means "the host granted access", not "not
  // paying".
  if (requiresPlan) {
    return null;
  }

  // The limit notice stays, without the upsell. That the agent has stopped is something
  // the user needs to know -- an agent that silently stops looks broken -- but why it
  // stopped is answered by the cycle, not by a price list.
  return (
    <Alert className={cn("w-auto", className)}>
      <AlertTitle>{`${entityPlural} limit reached`}</AlertTitle>
      <AlertDescription>
        <p>
          {`This workspace reached its qualified ${entityPluralLower} limit for the current cycle. The agent has paused ${discoveryVerb} new ${entityPluralLower} until the cycle resets.`}
        </p>
      </AlertDescription>
    </Alert>
  );
}
