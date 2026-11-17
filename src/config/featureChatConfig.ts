export type FeatureChatMode = 'true' | 'false' | 'developer';

// 'true'      -> Visibile agli utenti, possono inviare richieste feature
// 'false'     -> Disattivata e nascosta completamente
// 'developer' -> Solo visualizzazione + elimina singola riga o wipe totale
export const FEATURE_CHAT_MODE: FeatureChatMode = 'true';
