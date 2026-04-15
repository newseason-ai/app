export type StartCallMonitor = {
  listenUrl?: string;
  controlUrl?: string;
};

export type StartCallResponse = {
  callId: string;
  monitor: StartCallMonitor | null;
  vapiCall: Record<string, unknown>;
};
