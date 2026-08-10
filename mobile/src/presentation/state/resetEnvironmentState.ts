export type EnvironmentReset = () => void;
export function resetEnvironmentState(resets: EnvironmentReset[]) {
  resets.forEach((reset) => reset());
}
