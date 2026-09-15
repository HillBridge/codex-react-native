export function createProductRequestAbortController() {
  let currentController: AbortController | undefined;

  function cancel() {
    currentController?.abort();
    currentController = undefined;
  }

  function begin() {
    cancel();
    currentController = new AbortController();

    return currentController.signal;
  }

  return { begin, cancel };
}
