type State = { status: 'signed_out' | 'not_requested' | 'pending' | 'rejected' | 'approved' };

export async function resolveWorkspaceAccess<T extends State>(actions: {
  signedIn: boolean;
  login: () => Promise<T>;
  check: () => Promise<T>;
  request: () => Promise<T>;
}): Promise<T> {
  const state = await (actions.signedIn ? actions.check() : actions.login());
  return state.status === 'not_requested' ? actions.request() : state;
}
