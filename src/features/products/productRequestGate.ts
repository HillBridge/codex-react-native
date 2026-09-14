export function createProductRequestGate() {
  let currentRequestId = 0;

  return {
    begin() {
      currentRequestId += 1;
      return currentRequestId;
    },
    invalidate() {
      currentRequestId += 1;
    },
    isCurrent(requestId: number) {
      return requestId === currentRequestId;
    },
  };
}
